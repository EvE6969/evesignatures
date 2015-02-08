
define(
  "igbtoolbox/signatures/wh-list-ui",
  [
  "react",
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/util",
  "igbtoolbox/signatures/react/wh-region-list",
  "igbtoolbox/spatial/proximity-mixin",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/portal/timestamps-mixin"
  ],

  function(react, _, defineComponent, sigEvents, sigUtil, whRegionListReact, withProximity, withPilot, withTimestamps) {
    'use strict';


    return defineComponent([withTimestamps, withProximity, withPilot], {

      attached: function() {
        this.on(document, sigEvents.SIGNATURES_UPDATED, this._renderReact);
      },

      _renderReact: function(e, data) {
        var signatures = this._filterWormholes(data.signatures);

        // group by system
        var sigsBySystem = _.reduce(signatures, function(prev, cur) {
          if(prev[cur.system] === undefined) {
            prev[cur.system] = [];
          }
          prev[cur.system].push(cur);
          return prev;
        }, {});

        // group by region
        var sigsByRegion = _.reduce(_.pairs(sigsBySystem), function(prev, cur) {
          var firstSig = cur[1][0];
          var region = firstSig.region;
          if(prev[region] === undefined) {
            prev[region] = {};
          }

          // region -> system map which has a list of signatures
          if(prev[region][firstSig.system] === undefined) {
            prev[region][firstSig.system] = { system: firstSig.system, systemId: firstSig.systemId, sec: firstSig.sec, signatures: [] };
          }

          // add signature to list of signatures in system
          prev[region][firstSig.system].signatures = _.union(prev[region][firstSig.system].signatures, cur[1]);
          return prev;
        }, {});

        // make systems a list instead of map again so we can sort it
        _.map(_.keys(sigsByRegion), function(region) {
          var systems = sigUtil.signatureSortByDistanceOrName(_.values(sigsByRegion[region]), this.getPilot(), this.getDistancesBySystemId());
          sigsByRegion[region] = systems;
        }, this);

        react.renderComponent(whRegionListReact({signaturesByRegion:sigsByRegion}), this.node);
        this.updateTimestampDurations();
        this.updateJumpDistances();
      },

      _filterWormholes: function(signatures) {
        return _.filter(signatures, function(t) {
          return t.classification == 'wormhole';
        });
      }
    });

  }
);
