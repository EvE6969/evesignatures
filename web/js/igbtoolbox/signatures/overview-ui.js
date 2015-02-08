
define(
  "igbtoolbox/signatures/overview-ui",
  [
  "react",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/portal/util",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/react/overview-list",
  "igbtoolbox/spatial/proximity-mixin",
  "igbtoolbox/evexmlapi/stats-mixin",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/portal/timestamps-mixin"
  ],

  function(react, defineComponent, util, sigEvents, overviewListReact, withProximity, withStats, withPilot, withTimestamps) {
    'use strict';


    return defineComponent([withTimestamps, withProximity, withPilot, withStats], {

      attached: function() {
        this.on(document, sigEvents.SYSTEMS_UPDATED, this._renderSystems);
      },

      _renderSystems: function(e, d) {
        var systemId = this.getPilot().systemId;
        react.renderComponent(overviewListReact({systems:d.systems, currentSystemId: systemId}), this.node);
        this.updateTimestampDurations();
        this.updateJumpDistances();
        this.updateKillStats();
      }

    });

  }
);