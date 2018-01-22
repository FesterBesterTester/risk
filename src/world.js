import * as core from './core'
import * as reinforcement from './reinforcement'
import F from 'fkit'

/**
 * Returns true if the country is occupied by the given player, false
 * otherwise.
 */
function occupiedBy (player) {
  return F.compose(F.equal(player), F.get('player'))
}

export default class World {
  constructor (width, height, hexgrid, cells, graph) {
    const a = arguments

    if (a.length > 0) {
      this.width = width
      this.height = height
      this.hexgrid = hexgrid
      this.cells = cells
      this.graph = graph
    }
  }

  get countries () { return this.graph.values() }

  /**
   * Returns the countries occupied by a player.
   */
  countriesOccupiedBy (player) {
    return this.countries.filter(occupiedBy(player))
  }

  /**
   * Returns the countries neighbouring country `a`.
   */
  countriesNeighbouring (a) {
    return this.graph.adjacentValues(a.id)
  }

  /**
   * Returns true if the countries `a` and `b` are neighbours.
   */
  neighbouring (a, b) {
    return this.graph.adjacent(a.id, b.id)
  }

  /**
   * Assigns the given players to random countries and returns a new world
   * state.
   */
  assignPlayers (players) {
    const as = F.sample(players.length, this.countries)

    const bs = as.map((country, index) =>
      F.copy(country, {player: players[index], armies: 2})
    )

    return F.set('graph', this.graph.merge(bs), this)
  }

  /**
   * Moves to the country `t` from the country `s` and returns a new world
   * state.
   */
  move (s, t) {
    core.log('World#move')

    // Calculate the number of armies to move.
    const n = F.min(s.armies - 1, t.slots.length)

    const u = F.set('armies', s.armies - n, s)
    const v = F.copy(t, {armies: n, player: s.player})

    return F.set('graph', this.graph.merge([u, v]), this)
  }

  /**
   * Attacks the country `t` from the country `s` and returns a new world
   * state.
   */
  attack (s, t) {
    core.log('World#attack')

    // Roll the dice!
    const attackerDice = core.rollDice(s.armies)
    const defenderDice = core.rollDice(t.armies)

    core.log('attacker: ' + attackerDice)
    core.log('defender: ' + defenderDice)

    // Calculate the number of defender dice with a value greater than or equal
    // to the corresponding attacker dice.
    const comparisons = F
      .zip(core.reverseSort(attackerDice), core.reverseSort(defenderDice))
      .map(F.uncurry(F.gte))

    // Calculate the casualties.
    const attackerCasualties = comparisons.filter(F.id).length
    const defenderCasualties = comparisons.filter(F.not).length

    // Calculate the number of armies to move.
    const movers = F.min(s.armies - 1, t.slots.length)

    // Calculate the result.
    const as = F.sum(attackerDice) > F.sum(defenderDice)
      ? calculateWin()
      : calculateLose()

    return F.set('graph', this.graph.merge(as), this)

    function calculateWin () {
      const u = F.set('armies', s.armies - movers, s)
      const v = F.copy(t, {armies: F.max(movers - attackerCasualties, 1), player: s.player})

      return [u, v]
    }

    function calculateLose () {
      const u = F.set('armies', F.max(s.armies - attackerCasualties, 1), s)
      const v = F.set('armies', F.max(t.armies - defenderCasualties, 1), t)

      return [u, v]
    }
  }

  /**
   * Reinforces the given `player` and returns a new world state.
   */
  reinforce (player) {
    core.log('World#reinforce')

    const subgraphs = this.graph
      .filter(country => country.player === player)
      .connectedComponents()

    const depthIndex = reinforcement.depthIndex(this.graph, subgraphs)
    const reinforcementMap = reinforcement.reinforcementMap(this.graph, subgraphs, depthIndex)

    const graph = F.pairs(reinforcementMap).reduce((graph, [key, n]) => {
      return graph.update(key, country => country.reinforce(n))
    }, this.graph)

    return F.set('graph', graph, this)
  }
}
