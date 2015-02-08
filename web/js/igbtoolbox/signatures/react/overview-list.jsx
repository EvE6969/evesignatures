/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/overview-list",
  [
  "react",
  "igbtoolbox/signatures/react/overview-system"
  ],

  function(React, systemReact) {
    'use strict';


    return React.createClass({
      render: function() {
        var systems = this.props.systems;

        var systems = systems.map(function (s) {
          var SignatureOverviewSystem = systemReact;
          return (
            <SignatureOverviewSystem system={s} currentSystemId={this.props.currentSystemId} key={s.systemId} />
          );
        }, this);

        return (
          <div className="eve_signatures_overview_list">
            {systems}
          </div>
        );
      }
    });

  }
);