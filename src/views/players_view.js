import React from 'react'
import classnames from 'classnames'
import log from '../log'
import styles from '../stylesheets/styles.scss'

export default class PlayersView extends React.PureComponent {
  render () {
    let game = this.props.game

    log.debug('PlayersView#render')

    return (
      <ul className={styles.players}>{this.renderPlayers(game)}</ul>
    )
  }

  renderPlayers (game) {
    return game.players.map(this.renderPlayer(game))
  }

  renderPlayer (game) {
    return (player, index) => {
      const selected = player === this.props.currentPlayer
      const className = classnames(styles[player], {[styles.selected]: selected})

      return (
        <li className={className} key={index}><span>{game.armiesForPlayer(player)}</span></li>
      )
    }
  }
}
