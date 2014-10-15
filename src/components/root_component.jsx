/** @jsx React.DOM */

'use strict';

var core              = require('../core'),
    Bacon             = require('baconjs'),
    ControlsComponent = require('./controls_component'),
    GameComponent     = require('./game_component'),
    HexgridComponent  = require('./hexgrid_component'),
    PlayersComponent  = require('./players_component'),
    React             = require('react');

module.exports = React.createClass({
  displayName: 'RootComponent',

  propTypes: {
    game:   React.PropTypes.object.isRequired,
    stream: React.PropTypes.instanceOf(Bacon.Observable).isRequired
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    // Don't update the component if the props haven't changed.
    return nextProps.game !== this.props.game;
  },

  render: function() {
    var game = this.props.game;

    core.log('RootComponent#render');

    return (
      /* jshint ignore:start */
      <div className="game">
        <PlayersComponent currentPlayer={game.currentPlayer} game={game} />
        <svg width={game.world.width} height={game.world.height}>
          <HexgridComponent width={game.world.width} height={game.world.height} hexgrid={game.world.hexgrid} />
          <GameComponent stream={this.props.stream} game={game} debug={true} />
        </svg>
        <ControlsComponent currentPlayer={game.currentPlayer} stream={this.props.stream} />
      </div>
      /* jshint ignore:end */
    );
  }
});
