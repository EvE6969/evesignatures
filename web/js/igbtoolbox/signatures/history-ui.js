
define(
  "igbtoolbox/signatures/history-ui",
  [
  "react",
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/react/edit-history",
  "igbtoolbox/signatures/models",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/messagebus/messagebus-mixin",
  "igbtoolbox/portal/timestamps-mixin",
  "igbtoolbox/flightjs/ajax-mixin",
  "igbtoolbox/flightjs/logging-mixin"
  ],

  function(react, _, defineComponent, editHistoryReact, sigModels, withPilot, withPushMessages, withTimestamps, withAjax, withLogging) {
    'use strict';


    return defineComponent(
      [withLogging, withPushMessages, withAjax, withTimestamps], {

      attributes: {
        signatureHistoryUri: '/api/signature/logs'
      },

      attached: function() {
        this._historyViewModel = [];

        this.onMessage("signatures", this._onUpdateEvent);

        this.ajax(this.attr.signatureHistoryUri).done(this._onHistoryReceived.bind(this));
      },

      render: function() {
        react.renderComponent(editHistoryReact({entries:this._historyViewModel}), this.node);
        this.updateTimestampDurations();
      },


      _onHistoryReceived: function(resp) {

        if(!resp['data']) {
            this.logError('Could not get data');
            return;
        }

        var logs = resp['data'];
        this._historyViewModel = _.map(logs, function(l) {
          return new sigModels.SignatureHistoryEntry(l['text'], l['date']);
        });

        this.render();
      },

      _onUpdateEvent: function(e) {
        if(e.eventType != 'signature_history_added') {
          return;
        }
        this.logDebug('Received new signature history added message');
        this._historyViewModel.pop(); // remove last message
        var en = new sigModels.SignatureHistoryEntry(e.data['text'], e.data['date']);
        this._historyViewModel = new Array(en).concat(this._historyViewModel);
        //this._historyViewModel.unshift(en) // insert new item at beginning
        this.render();
      }
    });
  }
);

