import * as core from '../core';
import * as React from 'react';

// Tile size.
var TILE_COLS = 3,
    TILE_ROWS = 3;

export default React.createClass({
  displayName: 'HexgridComponent',

  shouldComponentUpdate(nextProps, nextState) {
    // Don't ever update the component.
    return false;
  },

  render() {
    var hexgrid = this.props.hexgrid;

    // Calculate the dimensions of the tile.
    var width  = hexgrid.width * 2,
        height = hexgrid.height * 2;

    core.log('HexgridComponent#render');

    return (
      /* jshint ignore:start */
      <g className="hexgrid">
        <defs>
          <pattern id="tile" width={width} height={height} patternUnits="userSpaceOnUse">
            {this.renderHexgrid(hexgrid)}
          </pattern>
        </defs>
        <rect width={this.props.width} height={this.props.height} fill="url(#tile)" />
      </g>
      /* jshint ignore:end */
    );
  },

  renderHexgrid(hexgrid) {
    var hexagons = hexgrid.build([TILE_COLS, TILE_ROWS], [-0.5, -0.5]);
    return hexagons.map(this.renderPolygon);
  },

  renderPolygon(polygon, index) {
    return (
      /* jshint ignore:start */
      <polygon key={index} points={polygon} />
      /* jshint ignore:end */
    );
  },
});
