'use strict';

var Copyable = require('./copyable'),
    Player   = require('./player'),
    core     = require('./core'),
    fn       = require('fn.js');

// The number of players in the game.
var PLAYERS = 5;

// Returns a new game state.
function Game(world) {
  var a = arguments;

  if (a.length > 0) {
    // Create the players.
    var players = core.range(PLAYERS).map(function(id) {
      return Player(id);
    });

    // Assign each player to a random country.
    world = world.assignPlayers(players);

    this.players         = players;
    this.world           = world;
    this.currentPlayer   = null;
    this.selectedCountry = null;
  }
}

Game.prototype = new Copyable();

Game.prototype.constructor = Game;

// Returns the total number of armies for a given player.
Game.prototype.armiesForPlayer = function(player) {
  return this.world
    .countriesOccupiedByPlayer(player)
    .map(fn.prop('armies'))
    .reduce(fn.op['+'], 0);
};

// Returns true if a given player can be set, false otherwise.
Game.prototype.canSelectPlayer = function(player) {
  return player !== null && player !== this.currentPlayer;
};

// Returns true if a given country can be set, false otherwise.
Game.prototype.canSelectCountry = function(country) {
  return this.canMoveToCountry(country) || this.canSetCountry(country);
};

// Returns true if the current player can select a given country, false
// otherwise.
Game.prototype.canSetCountry = function(country) {
  return country !== null && country.player === this.currentPlayer;
};

// Returns true if the current player can deselect a given country, false
// otherwise.
Game.prototype.canUnsetCountry = function(country) {
  return country !== null &&
         country.player === this.currentPlayer &&
         country === this.selectedCountry;
};

// Returns true if the current player can move to a given country, false
// otherwise.
Game.prototype.canMoveToCountry = function(country) {
  return country !== null &&
         this.currentPlayer !== null &&
         country.player !== this.currentPlayer &&
         this.selectedCountry !== null &&
         this.selectedCountry.armies > 1 &&
         this.selectedCountry.hasNeighbour(country);
};

// Selects a given player and returns a new game state.
Game.prototype.selectPlayer = function(player) {
  core.log('Game#selectPlayer');

  if (player === this.currentPlayer) {
    throw new Error('The player is already selected');
  }

  var world = this.currentPlayer ? this.world.reinforce(this.currentPlayer) : this.world;

  return this.copy({
    currentPlayer:   player,
    selectedCountry: null,
    world:           world
  });
};

// Selects a given country and returns a new game state.
Game.prototype.selectCountry = function(country) {
  core.log('Game#selectCountry');

  if (this.canMoveToCountry(country))
    return this.moveToCountry(country);
  else if (this.canUnsetCountry(country))
    return this.set('selectedCountry', null);
  else if (this.canSetCountry(country))
    return this.set('selectedCountry', country);
  else
    return this;
};

// Moves armies from the selected country to a given country and returns a
// new game state.
Game.prototype.moveToCountry = function(country) {
  core.log('Game#moveToCountry');

  var world = this.world.move(this.currentPlayer, this.selectedCountry, country);

  return this.copy({
    selectedCountry: null,
    world:           world
  });
};

module.exports = Game;
