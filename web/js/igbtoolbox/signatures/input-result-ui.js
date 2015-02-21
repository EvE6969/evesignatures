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
        this.on(document, sigEvents.SYSTEMS_UPDATED, this._updateSignatures);
        this.on(document, sigEvents.SIGNATURE_INPUT_PARSED, this._parsedSignatures);
      },

      _updateSignatures: function(e, d) {
        var systemId = this.getPilot().systemId;
        var system = _.find(d.systems, function(s) {
          return s.systemId == systemId;
        });
        if(system && system.signatures) {
          this._lastSignatures = system.signatures;
        } else {
          this._lastSignatures = [];
        }
        this._renderReact();
      },

      _renderReact: function() {
        if(this._lastSignatures) {
          React.renderComponent(inputResultReact({signatures: this._lastSignatures, lastEnteredSignatures: this._lastParsedSignatures}), this.node);
        }
      },

      _parsedSignatures: function(e, d) {
        this._lastParsedSignatures = _.map(d.signatures, function(s) { return s.signature; });
        this._renderReact();
      }

    });
  }
);
