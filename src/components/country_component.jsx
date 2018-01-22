import * as core from '../core';
import Bacon from 'baconjs';
import F from 'fkit';
import React from 'react';
import classnames from 'classnames'

export default class CountryComponent extends React.PureComponent {
  didSelectCountry(country) {
    this.props.stream.push({type: 'select-country', country: country});
  }

  classes() {
    let player = this.props.country.player,
        color  = player ? player.toString() : '';

    return F.set(color, true, {
      country:  true,
      nearby:   this.props.nearby,
      selected: this.props.selected
    });
  }

  render() {
    let country = this.props.country;

    core.log('CountryComponent#render (' + country + ')');

    return (
      /* jshint ignore:start */
      <g>
        <polygon
          className={classnames(this.classes())}
          points={country.polygon}
          onClick={this.didSelectCountry.bind(this, country)}
        />
        {this.renderSlots(country)}
      </g>
      /* jshint ignore:end */
    );
  }

  renderSlots(country) {
    return country.slots.map(this.renderSlot(country));
  }

  renderSlot(country) {
    return (polygon, index) => {
      let classes = {
        selected: index < country.armies,
        slot:     true
      };

      return (
        /* jshint ignore:start */
        <polygon className={classnames(classes)} key={index} points={polygon} />
        /* jshint ignore:end */
      );
    };
  }
}
