import * as core from './core';
import * as F from 'fkit';
import * as Immutable from 'immutable';

export function depthIndex(graph, subgraphs) {
  let player = subgraphs[0].first().player;

  // FIXME: FKit `concatMap` should handle arrays of strings properly.
  let keys = F.concat(subgraphs.map(subgraph => subgraph.keys()));

  return keys.reduce((list, key) => {
    let path = graph.shortestPathBy(country => country.player !== player, key);

    if (F.empty(path)) {
      throw "Can't calculate depth map from empty path."
    }

    let depth = path.length - 2;

    return list.update(depth, set => {
      return (set || Immutable.Set()).add(key);
    })
  }, Immutable.List()).toJS();
}

/**
 * Calculates the total number of reinforcements for the player subgraphs.
 */
function calculateTotalReinforcements(subgraphs) {
  let maxSubgraphSize = F.maximumBy(core.bySize, subgraphs).size;
  let countries = F.concatMap(subgraph => subgraph.values(), subgraphs);
  let totalAvailableSlots = F.sum(countries.map(F.get('availableSlots')));
  return Math.min(maxSubgraphSize, totalAvailableSlots);
}

/**
 * TODO: First distribute to all countries with depth 0, then depth 1, and so
 * on.
 */
export function reinforcementMap(graph, subgraphs, depthIndex) {
  let n = calculateTotalReinforcements(subgraphs);

  let [_, result] = depthIndex.reduce(([n, result], keys, depth) => {
    let countries = keys.map(key => graph.get(key));

    // Calculate the availability list.
    let as = countries.map(F.get('availableSlots'));

    // Calculate the distribution list.
    let bs = core.distribute(n, as);

    n -= F.sum(bs);

    result = keys.reduce((result, key, index) => F.append([key, bs[index]], result), result);

    return [n, result]
  }, [n, []]);


  return result;
}
