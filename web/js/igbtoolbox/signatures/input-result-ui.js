define(
  "igbtoolbox/signatures/input-result-ui",
  [
  "react",
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/react/input-result",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/flightjs/logging-mixin"
  ],

  function(React, _, defineComponent, sigEvents, inputResultReact, withPilot, withLogging) {
    'use strict';


    return defineComponent([withLogging, withPilot], {

      attached: function() {
        this.on(document, sigEvents.SYSTEMS_UPDATED, this._renderReact);
        this.on(sigEvents.SIGNATURE_INPUT_PARSED, this._parsedSignatures);
      },

      _renderReact: function(e, d) {
        var systemId = this.getPilot().systemId;
        var system = _.find(d.systems, function(s) {
          return s.systemId == systemId;
        });
        if(system && system.signatures) {
          React.renderComponent(inputResultReact({signatures: system.signatures, lastEnteredSignatures: this._lastParsedSignatures}), this.node);
        }
      },

      _parsedSignatures: function(e) {
        this._lastParsedSignatures = _.map(e.signatures, function(s) { return s.signature; });
      }

    });
  }
);
