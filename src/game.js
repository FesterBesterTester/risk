'use strict';

var core = require('./core'),
    F    = require('fkit');

/**
 * Creates a new game state.
 */
function Game(players, world) {
  var a = arguments;

  if (a.length > 0) {
    // Assign each player to a random country.
    world = world.assignPlayers(players);

    this.world           = world;
    this.players         = players;
    this.currentPlayer   = F.head(players);
    this.selectedCountry = null;
    this.over            = false;
  }
}

Game.prototype.constructor = Game;

Object.defineProperty(Game.prototype, 'alivePlayers', {
  get: function() {
    return this.players.filter(function(player) {
      return this.world.countriesOccupiedByPlayer(player).length > 0;
    }, this);
  }
});

/**
 * Returns the total number of armies for a given player.
 */
Game.prototype.armiesForPlayer = function(player) {
  return F.sum(
    this.world
      .countriesOccupiedByPlayer(player)
      .map(F.get('armies'))
  );
};

/**
 * Returns true if the current player can select a given country, false
 * otherwise.
 */
Game.prototype.canSetCountry = function(country) {
  return country !== null && country.player === this.currentPlayer;
};

/**
 * Returns true if the current player can deselect a given country, false
 * otherwise.
 */
Game.prototype.canUnsetCountry = function(country) {
  return country !== null &&
    country.player === this.currentPlayer &&
    country === this.selectedCountry;
};

/**
 * Returns true if the current player can move to a given country, false
 * otherwise.
 */
Game.prototype.canMoveToCountry = function(country) {
  return country !== null &&
    this.currentPlayer !== null &&
    country.player !== this.currentPlayer &&
    this.selectedCountry !== null &&
    this.selectedCountry.player === this.currentPlayer &&
    this.selectedCountry.armies > 1 &&
    this.selectedCountry.hasNeighbour(country);
};

/**
 * Ends the turn for the current player.
 *
 * @returns A new game state.
 */
Game.prototype.endTurn = function() {
  core.log('Game#endTurn');

  // Find the index of the current and next players.
  var i = F.elemIndex(this.currentPlayer, this.alivePlayers),
      j = (i + 1) % this.alivePlayers.length;

  return this.selectPlayer(this.alivePlayers[j]);
};

/**
 * Selects a given player and returns a new game state.
 */
Game.prototype.selectPlayer = function(player) {
  core.log('Game#selectPlayer');

  if (player === this.currentPlayer) {
    throw new Error('The player is already selected');
  }

  var world = this.currentPlayer ?
    this.world.reinforce(this.currentPlayer) :
    this.world;

  return F.copy(this, {
    currentPlayer:   player,
    selectedCountry: null,
    world:           world
  });
};

/**
 * Selects a given country and returns a new game state.
 */
Game.prototype.selectCountry = function(country) {
  core.log('Game#selectCountry');

  if (this.canMoveToCountry(country)) {
    return this.moveToCountry(country);
  } else if (this.canUnsetCountry(country)) {
    return F.set('selectedCountry', null, this);
  } else if (this.canSetCountry(country)) {
    return F.set('selectedCountry', country, this);
  } else {
    return this;
  }
};

/**
 * Moves to the target country from the selected country and returns a new game
 * state. If the target country is occupied then the invading armies will
 * attack.
 */
Game.prototype.moveToCountry = function(country) {
  core.log('Game#moveToCountry');

  var world = country.player ?
    this.world.attack(this.selectedCountry, country) :
    this.world.move(this.selectedCountry, country);

  return F.copy(this, {
    selectedCountry: null,
    world:           world,
    over:            this.alivePlayers.length === 1
  });
};

module.exports = Game;
