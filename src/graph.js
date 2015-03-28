/**
 * This module defines operations on graphs.
 *
 * @module
 */

import * as core from './core';
import F from 'fkit';
import Immutable from 'immutable';

function keySet(graph) {
  return graph.vertexMap.keySeq().toSet();
}

function addEdge(adjacencyMap, [k, j]) {
  let kSet = adjacencyMap.get(k) || Immutable.Set(),
      jSet = adjacencyMap.get(j) || Immutable.Set();
  return adjacencyMap.set(k, kSet.add(j)).set(j, jSet.add(k));
}

function removeEdge(adjacencyMap, [k, j]) {
  let kSet = adjacencyMap.get(k) || Immutable.Set(),
      jSet = adjacencyMap.get(j) || Immutable.Set();
  return adjacencyMap.set(k, kSet.delete(j)).set(j, jSet.delete(k));
}

function removeVertex([vertexMap, adjacencyMap], k) {
  let verticesMap_ = vertexMap.remove(k);

  let kSet = adjacencyMap.get(k);

  if (kSet) {
    let adjacencyMap_ = kSet.reduce((map, j) => {
      let jSet = adjacencyMap.get(j);
      return map.set(j, jSet.remove(k));
    }, adjacencyMap).remove(k);

    return [verticesMap_, adjacencyMap_];
  } else {
    return [verticesMap_, adjacencyMap];
  }
}

function traverse(graph, k) {
  let traverse_ = F.curry(([visited, vertices], k) => {
    let adjacentVertices = graph.adjacentVertices(k);

    // Add the vertex to the set of visited vertices.
    visited = visited.add(k);

    // Add the adjacent vertices to the result.
    vertices = adjacentVertices.reduce((a, b) => a.add(b), vertices);

    // Recurse with the adjacent vertices that have not been visited.
    return adjacentVertices
      .filter(j => !visited.contains(j))
      .reduce(traverse_, [visited, vertices]);
  });

  let [_, keys] = traverse_(
    [Immutable.Set(), Immutable.OrderedSet.of(k)],
    k
  );

  return keys;
}

function shortestPathBy(graph, p, key) {
  let [path, _, k] = shortestPathBy_([
    Immutable.OrderedMap([[key, null]]),
    Immutable.List.of(key),
    null
  ]);

  return reconstructPath(k, path);

  function shortestPathBy_([path, frontier, k]) {
    if (frontier.size === 0) {
      return [path, frontier, k];
    }

    let next = frontier.first();

    let adjacentVertices = graph.adjacentVertices(next);

    if (p(graph.get(next), next)) {
      return [path, frontier, next];
    }

    adjacentVertices.forEach(vertex => {
      if (!path.has(vertex)) {
        frontier = frontier.push(vertex);
        path = path.set(vertex, next);
      }
    });

    return shortestPathBy_([path, frontier.shift(), k]);
  }

  function reconstructPath(k, path) {
    let result = Immutable.Stack();

    return k !== null ?
      reconstructPath_(result, path, k) :
      result;

    function reconstructPath_(result, path, k) {
      let j = path.get(k);

      result = result.unshift(k);

      return j !== null ?
        reconstructPath_(result, path, j) :
        result;
    }
  }
}

function connectedComponents(graph) {
  let traverseComponents = (remaining, subgraphs) => {
    if (remaining.size > 0) {
      // Traverse the graph starting at the first vertex.
      let subgraph = traverse(graph, remaining.first());

      // Add the subgraph to the set of subgraphs.
      subgraphs = subgraphs.add(subgraph);

      // Remove the subgraph from the set of vertices.
      remaining = remaining.subtract(subgraph);

      // Recurse with the remaining set of vertices.
      subgraphs = traverseComponents(remaining, subgraphs);
    }

    return subgraphs;
  };

  let keys = keySet(graph);

  return traverseComponents(
    keys,
    Immutable.OrderedSet()
  );
}

export default class Graph {
  constructor(values, edges) {
    let a = arguments;

    if (a.length > 0) {
      this.vertexMap = Immutable.Map(
        values.map(value => [value.id, value])
      );

      this.adjacencyMap = edges.reduce(
        addEdge,
        Immutable.Map()
      );
    }
  }

  /**
   * Returns the number of vertices in the graph.
   */
  get size() { return this.vertexMap.size; }

  /**
   * Returns the first value in the graph.
   */
  first() {
    return this.vertexMap.first();
  }

  /**
   * Returns the last value in the graph.
   */
  last() {
    return this.vertexMap.last();
  }

  /**
   * Returns the vertex with key `k`.
   */
  get(k) {
    return this.vertexMap.get(k);
  }

  /**
   * Merges the list of `as` into the graph.
   */
  merge(as) {
    let bs        = Immutable.Map(as.map(a => [a.id, a])),
        vertexMap = this.vertexMap.merge(bs);
    return F.copy(this, {vertexMap});
  }

  /**
   * Updates the vertex `k` with updater function `f`.
   */
  update(k, f) {
    let vertexMap = this.vertexMap.update(k, f);
    return F.copy(this, {vertexMap});
  }

  /**
   * Returns the keys of the vertices in the graph.
   */
  keys() {
    return keySet(this).toArray();
  }

  /**
   * Returns the values of the vertices in the graph.
   */
  values() {
    return this.vertexMap.toArray();
  }

  /**
   * Returns the the edges in the graph.
   */
  edges() {
    return this.adjacencyMap
      .reduce(addEdges, Immutable.List())
      .toArray();

    function addEdges(edges, kSet, k) {
      return kSet.reduce((edges, j) => edges.push([k, j]), edges);
    }
  }

  /**
   * Adds a vertex to the graph with key `k` and value `v`.
   */
  addVertex(k, v) {
    let vertexMap = this.vertexMap.set(k, v);
    return F.copy(this, {vertexMap});
  }

  /**
   * Removes a vertex from the graph with key `k`.
   */
  removeVertex(k) {
    let [vertexMap, adjacencyMap] = removeVertex(
      [this.vertexMap, this.adjacencyMap],
      k
    );

    return F.copy(this, {vertexMap, adjacencyMap});
  }

  /**
   * Connects the vertices in the graph with keys `k` and `j`.
   */
  addEdge(k, j) {
    let adjacencyMap = this.adjacencyMap.withMutations(m => addEdge(m, [k, j]));
    return F.copy(this, {adjacencyMap});
  }

  /**
   * Disconnects the vertices in the graph with keys `k` and `j`.
   */
  removeEdge(k, j) {
    let adjacencyMap = this.adjacencyMap.withMutations(m => removeEdge(m, [k, j]));
    return F.copy(this, {adjacencyMap});
  }

  /**
   * Returns true if the vertices with keys `k` and `j` are adjacent in the
   * graph.
   */
  adjacent(k, j) {
    let kSet = this.adjacencyMap.get(k, Immutable.Set());
    return kSet.has(j);
  }

  /**
   * Returns the keys of the vertices adjacent to the vertex with key `k`.
   */
  adjacentVertices(k) {
    let kSet = this.adjacencyMap.get(k, Immutable.Set());
    return kSet.toArray();
  }

  /**
   * Returns the vertices adjacent to the vertex with key `k`.
   */
  adjacentValues(k) {
    let kSet = this.adjacencyMap.get(k);
    return kSet.reduce((values, key) => values.push(this.get(key)), Immutable.List()).toArray();
  }

  /**
   * Filters the graph values using the predicate function `p`.
   */
  filter(p) {
    let keys = this.vertexMap.filterNot(p).keySeq();

    let [vertexMap, adjacencyMap] = keys.reduce(
      removeVertex,
      [this.vertexMap, this.adjacencyMap]
    );

    return F.copy(this, {vertexMap: vertexMap, adjacencyMap: adjacencyMap});
  }

  /**
   * Returns the vertices found in a breadth-first traversal of the graph,
   * starting vertex `k`.
   */
  traverse(k) {
    return traverse(this, k).toArray();
  }

  /**
   * Returns the shortest path, starting at vertex `k`, to vertex `j`.
   */
  shortestPath(j, k) {
    return shortestPathBy(this, (_, a) => a === k, j).toArray();
  }

  /**
   * Returns the shortest path, starting at vertex `k`, to the first vertex
   * that satisfies the predicate function `p`.
   */
  shortestPathBy(p, k) {
    return shortestPathBy(this, p, k).toArray();
  }

  /**
   * Returns the connected subgraphs in the graph.
   */
  connectedComponents() {
    return connectedComponents(this).map(island =>
      this.filter((value, key) => island.has(key))
    ).toArray();
  }
}
