var Country = require('./country');
var Hexgrid = require('./hexgrid');
var Point   = require('./point');
var Polygon = require('./polygon');
var Voronoi = require('../lib/voronoi');
var World   = require('./world');
var _       = require('lodash');
var core    = require('./core');

var RADIUS = 8, // Hexgrid radius.

    // The number of "seed" sites to apply to the Voronoi function. More seeds
    // will result in more countries.
    SEEDS = 20,

    // The number of Lloyd relaxations to apply to the Voronoi cells. More
    // relaxations will result in countries more uniform in shape and size.
    RELAXATIONS = 2;

function cellVertices(cell) {
  return cell.halfedges.map(function(halfedge) {
    return new Point(halfedge.getStartpoint());
  });
}

// Returns the polygon for a given cell.
function cellPolygon(cell) {
  return new Polygon(cellVertices(cell));
}

// Calculates the Voronoi diagram for a given set of sites using a tessellation
// function. A number of Lloyd relaxations will also be applied to the
// resulting diagram. http://en.wikipedia.org/wiki/Lloyd's_algorithm
function calculateDiagram(t, sites, relaxations) {
  // Calculate the initial Voronoi diagram.
  var diagram = t(sites);

  // Apply a number of relaxations to the Voronoi diagram.
  return _.range(relaxations).reduce(function(diagram) {
    // Calculate the new sites from the centroids of the cells.
    var sites = diagram.cells.map(function(cell) {
      return cellPolygon(cell).centroid();
    });

    // Recycle the diagram before computing it again.
    diagram.recycle();

    // Return a new Voronoi diagram.
    return t(sites);
  }, diagram);
}

// Merges the given set of hexagons inside the Voronoi cells into countries.
function calculateCountries(hexagons, diagram) {
  var countries = diagram.cells.reduce(function(countries, cell) {
    // Find the hexagons inside the cell.
    var innerHexagons = hexagons.filter(function(hexagon) {
      return cellPolygon(cell).containsPoint(hexagon.centroid());
    });

    // Merge the hexagons into a larger polygon.
    var polygon = Polygon.merge(innerHexagons);

    // Create a new country.
    countries[cell.site.voronoiId] = new Country(polygon.offset(-2.0));

    return countries;
  }, {});

  return _.map(countries, function(country, id) {
    var cell = diagram.cells[id];
    var neighbours = neighbouringCells(cell, diagram);

    country.neighbours = neighbours.map(function(neighbour) {
      return countries[neighbour.site.voronoiId];
    });

    return country;
  });
}

// Returns the cells neighbouring a given cell.
function neighbouringCells(cell, diagram) {
  return cell.getNeighborIds().map(function(id) {
    return diagram.cells[id];
  });
}

module.exports = {
  buildWorld: function(width, height) {
    // Create a hexgrid.
    var hexgrid = new Hexgrid(width, height, RADIUS);

    // Create a Voronoi tessellation function.
    var voronoi = new Voronoi();
    var bbox = {xl:0, xr:width, yt:0, yb:height};
    var t = function(points) {
      var diagram = voronoi.compute(points, bbox);
      diagram.recycle = function() { voronoi.recycle(diagram); };
      return diagram;
    };

    // Generate a set of random "seed" sites within the clipping region.
    var sites = _.range(SEEDS).map(function(d) {
      return new Point(_.random(width, true), _.random(height, true));
    });

    // Calculate the Voronoi diagram.
    var diagram = calculateDiagram(t, sites, RELAXATIONS);

    // Calculate the countries from the Voronoi diagram.
    var countries = calculateCountries(hexgrid.hexagons, diagram);

    // Calculate the Voronoi cells for debugging.
    var cells = diagram.cells.map(cellVertices);

    // Return a new world.
    return new World(hexgrid.hexagons, countries, cells);
  }
};
