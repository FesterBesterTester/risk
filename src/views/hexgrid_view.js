import React from 'react'
import styles from '../../assets/stylesheets/styles.scss'

// Tile size.
const TILE_COLS = 3
const TILE_ROWS = 3

export default class HexgridView extends React.PureComponent {
  shouldViewUpdate (nextProps, nextState) {
    // Don't ever update the view.
    return false
  }

  render () {
    const hexgrid = this.props.hexgrid

    // Calculate the dimensions of the tile.
    const width = hexgrid.width * 2
    const height = hexgrid.height * 2

    return (
      <g className={styles.hexgrid}>
        <defs>
          <pattern id='tile' width={width} height={height} patternUnits='userSpaceOnUse'>
            {this.renderHexgrid(hexgrid)}
          </pattern>
        </defs>
        <rect width={this.props.width} height={this.props.height} fill='url(#tile)' />
      </g>
    )
  }

  renderHexgrid (hexgrid) {
    const hexagons = hexgrid.build([TILE_COLS, TILE_ROWS], [-0.5, -0.5])
    return hexagons.map(this.renderPolygon)
  }

  renderPolygon (polygon, index) {
    return (
      <polygon key={index} points={polygon} />
    )
  }
}
