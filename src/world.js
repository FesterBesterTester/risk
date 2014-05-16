var _       = require('lodash');
var core    = require('./core');
var d3      = require('d3');
var Country = require('./country');
var Hexgrid = require('./hexgrid');
var Point   = require('./point');
var Polygon = require('./polygon');

var RADIUS = 8, // Hexgrid radius.

    // The number of "seed" points to apply to the Voronoi function. More seeds
    // will result in more countries.
    SEEDS = 20,

    // The number of Lloyd relaxations to apply to the Voronoi regions. More
    // relaxations will result in countries more uniform in shape and size.
    RELAXATIONS = 2;

// Calculates the Voronoi regions for a set of points using a given Voronoi
// function.
function calculateRegions(voronoi, points) {
  // Calculate and relax the Voronoi regions for the points.
  var regions = relaxRegions(voronoi, voronoi(points), RELAXATIONS);

  regions.forEach(function(region) {
    region.neighbours = calculateNeighbouringRegions(regions, region);
  });

  return regions;
}

// Applies a given number of Lloyd relaxations to a set of regions using a
// Voronoi function. http://en.wikipedia.org/wiki/Lloyd's_algorithm
function relaxRegions(voronoi, regions, relaxations) {
  return _.range(relaxations - 1).reduce(function(regions, i) {
    var points = regions.map(function(region) {
      return d3.geom.polygon(region).centroid();
    });

    return voronoi(points);
  }, regions);
}

// Calculates the regions neighbouring a given region.
function calculateNeighbouringRegions(regions, region) {
  return region.cell.edges
    .map(function(edge) { return edge.edge; })
    .filter(function(edge) { return edge.l && edge.r; })
    .map(function(edge) {
      var i = (edge.l === region.cell.site ? edge.r.i : edge.l.i);
      return regions[i];
    });
}

// Merge the hexagons inside the Voronoi regions into countries.
function calculateCountries(hexagons, regions, links) {
  var countries = regions.map(function(region) {
    // Find all hexagons inside the Voronoi region.
    var innerHexagons = hexagons.filter(function(hexagon) {
      return regionToPolygon(region).containsPoint(hexagon.centroid);
    });

    // Merge the hexagons into a larger polygon.
    var polygon = Polygon.merge(innerHexagons);

    // Create a new country.
    var country = new Country(polygon.offset(-2.0));
    country.region = region;
    return country;
  });

  countries.forEach(function(country) {
    country.calculateNeighbouringCountries(countries);
  });

  return countries;
}

// Converts a region to a polygon.
function regionToPolygon(region) {
  return new Polygon(region.map(function(vertex) {
    return new Point(vertex);
  }));
}

function World(width, height) {
  // Create a hexgrid.
  var hexgrid = new Hexgrid(width, height, RADIUS);

  // Create a Voronoi function.
  var voronoi = d3.geom.voronoi().clipExtent([[0, 0], [width, height]]);

  // Generate a number of random "seed" points within the clipping region.
  var points = d3.range(SEEDS).map(function(d) {
    return [Math.random() * width, Math.random() * height];
  });

  this.hexagons = hexgrid.hexagons;
  this.regions = calculateRegions(voronoi, points);
  this.countries = calculateCountries(this.hexagons, this.regions);
}

module.exports = World;
