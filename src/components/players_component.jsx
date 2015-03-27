import * as core from '../core';
import * as F from 'fkit';
import * as React from 'react/addons';

const cx = React.addons.classSet;

export default React.createClass({
  displayName: 'PlayersComponent',

  propTypes: {
    currentPlayer: React.PropTypes.object,
    game:          React.PropTypes.object.isRequired
  },

  classes(player) {
    let selected = player === this.props.currentPlayer;
    return F.set(player, true, {selected});
  },

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.currentPlayer !== this.props.currentPlayer ||
      nextProps.game.world !== this.props.game.world;
  },

  render() {
    let game = this.props.game;

    core.log('PlayersComponent#render');

    return (
      /* jshint ignore:start */
      <ul className="players">{this.renderPlayers(game)}</ul>
      /* jshint ignore:end */
    );
  },

  renderPlayers(game) {
    return game.players.map(this.renderPlayer(this.classes, game));
  },

  renderPlayer: F.curry((classes, game, player, index) => {
    return (
      /* jshint ignore:start */
      <li className={cx(classes(player))} key={index}>{game.armiesForPlayer(player)}</li>
      /* jshint ignore:end */
    );
  }),
});
