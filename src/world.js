'use strict';

var _ = require('lodash');

function World(hexagons, countries, cells) {
  this.hexagons  = hexagons;
  this.countries = countries;
  this.cells     = cells;
}

World.prototype.constructor = World;

// Attacks with armies from the source country to the target country.
World.prototype.attack = function(source, target) {
  console.log('World#attack');
};

// Moves armies from the source country to the target country.
World.prototype.move = function(source, target) {
  console.log('World#move');

  // Assert the source country is in the world.
  if (!_.contains(this.countries, source)) {
    throw 'Source country is not in the world';
  }

  // Assert the target country is in the world.
  if (!_.contains(this.countries, target)) {
    throw 'Target country is not in the world';
  }

  // Assert the source country has enough armies.
  if (source.armies <= 1) {
    throw 'Source country does not have enough armies';
  }

  target.armies = source.armies - 1;
  source.armies = 1;
};

module.exports = World;
