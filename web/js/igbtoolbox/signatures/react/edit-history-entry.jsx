/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/edit-history-entry",
  [
  "react"
  ],

  function(React) {
    'use strict';

    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var entry = this.props.entry;

        return (
          <li>
            <div className="eve_timestamp" data-timestamp={entry.timestamp}></div>
            <div>{entry.text}</div>
          </li>
        );
      }
    });
  }
);