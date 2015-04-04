define(
  "igbtoolbox/signatures/input-controller",
  [
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/models",
  "igbtoolbox/signatures/input-result-ui",
  "igbtoolbox/signatures/input-controls-ui",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/flightjs/ajax-mixin"
  ],

  function(defineComponent, sigEvents, sigModels, inputResultsUI, inputControlsUI, withPilot, withAjax) {
    'use strict';

    return defineComponent([withPilot, withAjax], {

      attributes: {
        sigInUri: '/api/signature',
        sigInResultsSelector: '.eve_signatures_add_signatures',
        sigInControlsSelector: '.eve_signatures_add_cnt_input'
      },

      attached: function() {
        this.on(sigEvents.SIGNATURE_USER_INPUT, this._parseSignatures);
        this.on(sigEvents.SIGNATURE_INPUT_PARSED, this._saveSignatures);
        this.on(sigEvents.SYSTEM_REPORTED_CLEAR, this._onSystemClear);

        // attach sub components
        inputResultsUI.attachTo(this.attr.sigInResultsSelector);
        inputControlsUI.attachTo(this.attr.sigInControlsSelector);
      },

      _parseSignatures: function(e, d) {

        var p = this.getPilot();
        if(!p) {
          this.logError("Pilot not available");
          return;
        }
        var pname = p.characterName;
        var updated = new Date();
        var fieldRegex = /^([A-Z]{3}-\d{3})\t([^\t]+)\t([^\t]*)\t([^\t]*)\t(\d{1,3}[.,]?\d{0,2})%\t([0-9.,]+ (?:AU|km|m))/;
        var lines = d.txt.split(/(?:\r\n|\r|\n)+/g);
        var systemName = p.systemName;
        var systemId = p.systemId;
        var ret = [];
        for(var i = 0; i < lines.length; i++) {

          var m = fieldRegex.exec(lines[i]);
          if(!m) {
            continue;
          }
          var sig = new sigModels.Signature(systemName, systemId, m[1], m[2], m[3], m[4], m[5], pname, null, updated, pname, false);
          ret.push(sig);
        }

        var elr = new sigEvents.SignatureInputParsed(ret);
        this.trigger(sigEvents.SIGNATURE_INPUT_PARSED, elr);
      },

      _saveSignatures: function(e, d) {

        if(!d.signatures || d.signatures.length == 0) {
          return;
        }
        
        var l = [];
        for(var j = 0; j < d.signatures.length; j++) {
          l.push(d.signatures[j].toJson());
        }

        this.ajax(this.attr.sigInUri, {
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({'action': 'save', 'signatures': l})
        });

        _gaq.push(['_trackEvent', 'Signatures', 'Input', 'Saved']);
      },

      _onSystemClear: function(e) {
        var p = this.getPilot();
        if(!p) {
          this.logError("Pilot not available");
          return;
        }
        var pname = p.characterName;
        var updated = new Date();
        var sig = new sigModels.Signature(p.systemName, p.systemId, 'XXX', 'dummy', 'dummy', 'systemclear', '0', pname, updated, updated, null, false);
        this._saveSignatures(e, {signatures: [sig]});
      }

    });

  }
);