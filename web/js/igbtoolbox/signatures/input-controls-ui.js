define(
  "igbtoolbox/signatures/input-controls-ui",
  [
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/events",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/flightjs/logging-mixin"
  ],

  function(_, defineComponent, sigEvents, withPilot, withLogging) {
    'use strict';


    return defineComponent([withLogging, withPilot], {

      attributes: {
        sigInTimerInterval: 250,
        sigInTitleSelector: '.eve_signatures_add_title',
        sigInInputSelector: '.eve_signature_add_input_txt',
        sigInBtnReportClearSelector: '.eve_signature_add_input_sysclear_btn',
        sigInBtnClearInputSelector: '.eve_signature_add_input_clearinput_btn'
      },

      attached: function() {

        // "report clear" and "clear input" buttons
        this.on(this.$node.find(this.attr.sigInBtnReportClearSelector), 'click', sigEvents.SYSTEM_REPORTED_CLEAR);
        this.on(this.$node.find(this.attr.sigInBtnClearInputSelector), 'click', this._clearInput);

        // large input field for copy and paste
        this._inText = this.$node.find(this.attr.sigInInputSelector)[0];

        // periodically check input field for any text changes
        this._timerCheckId = setInterval(this._checkInputForChanges.bind(this), this.attr.sigInTimerInterval);

        // label for current system
        var p = this.getPilot();
        if(p) {
          this._updateSystemLabel(p.systemName);
        }
        this.onSystemChanged(function(p) {
          this._updateSystemLabel(p.systemName);
        });
      },

      dispose: function() {
        if(this._timerCheckId) {
          clearInterval(this._timerCheckId);
        }
      },

      _updateSystemLabel: function(systemName) {
        this.$node.find(this.attr.sigInTitleSelector).text(systemName);
        // this.$node.find(this.attr.sigInTitleSelector).each(function(el) {
        //   $(el).text(systemName);
        // });
      },

      _clearInput: function() {
        this._inText.value = '';
        this._inText.focus();
      },

      _checkInputForChanges: function() {

        var txt = this._inText.value.trim();
        if(!_.isEmpty(txt) && this._lastTxt != txt) {
          this.logDebug('Input content text change detected');
          var es = new sigEvents.SignatureUserInput(txt);
          this.trigger(sigEvents.SIGNATURE_USER_INPUT, es);
          this._clearInput();
        }
        this._lastTxt = txt;
      }

    });
  }
);

