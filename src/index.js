import AI from './ai'
import Bacon from 'baconjs'
import {drop, equal, range} from 'fkit'
import Game from './game'
import Player from './player'
import React from 'react'
import ReactDOM from 'react-dom'
import RootComponent from './components/root_component'
import * as WorldBuilder from './world_builder'

/**
 * The number of milliseconds between clock ticks.
 */
const CLOCK_INTERVAL = 100

/**
 * The number of players in the game.
 */
const PLAYERS = 5

/**
 * The number of human players in the game.
 */
const HUMANS = 1

/**
 * The dimensions.
 */
const WIDTH = 800
const HEIGHT = 600

function transformGameState (game, event) {
  switch (event.type) {
    case 'end-turn':
      return game.endTurn()
    case 'select-country':
      return game.selectCountry(event.country)
    default:
      return game
  }
}

// Create the players.
let players = range(0, PLAYERS).map(id => new Player(id))

// Create the world.
let world = WorldBuilder.build(WIDTH, HEIGHT)

// Create the game state.
let game = new Game(players, world)

// Create the input bus.
let inputBus = new Bacon.Bus()

// Create the main app bus.
let mainBus = new Bacon.Bus()

// Create the clock tick stream.
let clock = Bacon.interval(CLOCK_INTERVAL, CLOCK_INTERVAL)

// The game property scans the game state transformer function over events on
// the main bus.
let gameProperty = mainBus.scan(game, transformGameState)

// Map player IDs to AI streams.
let aiStream = Bacon.mergeAll(drop(HUMANS, game.players).map(playerAI))

// Plug the input bus into the main bus.
mainBus.plug(inputBus)

// Plug the AI stream into the main bus.
mainBus.plug(aiStream)

const root = document.getElementById('root')

// Render the UI whenever the game property changes.
gameProperty.onValue(game =>
  ReactDOM.render(<RootComponent game={game} bus={inputBus} />, root)
)

/*
 * The player AI stream emits the moves calculated for a player.
 */
function playerAI (player) {
  let worldProperty = gameProperty.map('.world')

  return worldProperty
    .sampledBy(playerClock(player))
    .withStateMachine(new AI(), (ai, event) => {
      if (event.hasValue()) {
        let [ai_, events] = ai.nextMove(event.value(), player)
        return [ai_, events.map(move => new Bacon.Next(move))]
      } else {
        return [ai, [event]]
      }
    })
}

/*
 * Returns a clock stream which emits tick events only when the player is
 * current.
 */
function playerClock (player) {
  let currentPlayerProperty = gameProperty.map('.currentPlayer')
  return clock.map(currentPlayerProperty).filter(equal(player))
}
