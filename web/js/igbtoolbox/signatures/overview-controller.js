define(
  "igbtoolbox/signatures/page-controller",
  [
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/util",
  "igbtoolbox/signatures/models",
  "igbtoolbox/signatures/history-ui",
  "igbtoolbox/signatures/overview-ui",
  "igbtoolbox/signatures/wh-edit-dialog-ui",
  "igbtoolbox/autocomplete/autocomplete-ui",
  "igbtoolbox/evexmlapi/stats-events",
  "igbtoolbox/sde/sde-mixin",
  "igbtoolbox/spatial/proximity-mixin",
  "igbtoolbox/igb/ping-mixin",
  "igbtoolbox/flightjs/ajax-mixin",
  "igbtoolbox/messagebus/messagebus-mixin",
  "igbtoolbox/flightjs/logging-mixin"
  ],

  function(_, defineComponent, sigEvents, sigUtil, sigModels, historyUI, overviewUI, wormholeEditDialogUI, autocompleteUI,
    statsEvents, withSDE, withProximity, withPilot, withAjax, withPushMessages, withLogging) {
    'use strict';


    return defineComponent(
      [withSDE, withProximity, withPilot, withPushMessages, withAjax, withLogging], {

      attributes: {
        sigUri: '/api/signature',
        sigACRegionSelector: '#signature_in_acregion',
        sigOverviewUISelector: '#m_signatures_overview',
        sigHistoryUISelector: '#m_signatures_history',
        sigToogleShowAllSelector: '#signature_in_showall'
      },

      attached: function() {

        this._systemsAndSignatures = [];

        this.on(sigEvents.NEED_REGION, this._loadRegion);
        this.on(sigEvents.NEED_SIGNATURE_REMOVED, this._removeSignature);
        this.on(document, sigEvents.NEED_WHEDIT_DIALOG, this._onWhEditDialogRequested);

        this.onProximityChanged(this._onDistancesChanged);

        this.onMessage("signatures", this._onUpdateEvent);

        // signature edit history
        historyUI.attachTo(this.attr.sigHistoryUISelector);

        // region auto-completion input field
        var region = null;
        if(this.getPilot() && this.getPilot().regionName) {
          region = this.getPilot().regionName;
        }

        // load regions from SDE
        this.withRegions(_.partial(this._regionsLoaded, region));

        // signatures overview list per region
        overviewUI.attachTo(this.attr.sigOverviewUISelector);

        // toggle visibility of foreign sov systems
        var tcb = $(this.attr.sigToogleShowAllSelector);
        if(tcb) {
          tcb.on('change', this._updateSovVisibility.bind(this));
        }
        this.on(statsEvents.SOV_STATS_UPDATED, this._updateSovVisibility);

        // load current region
        if(region) {
          this._updateOverview(region);
        }

        this.$node.show();
      },

      _updateSovVisibility: function() {
        var els = this.$node.find(".eve_signature_overview_list_entry");
        var showAll = $(this.attr.sigToogleShowAllSelector)[0].checked;
        for(var i = 0; i < els.length; i++) {
          var el = $(els[i]);
          if(showAll || el.hasClass('eve_sov_owned')) el.show();
          else el.hide();
        }
      },

      _regionsLoaded: function(currentRegion, regionNames) {

        // attach auto complete based on region names
        autocompleteUI.attachTo(this.attr.sigACRegionSelector, {
          acSource: regionNames,
          acEvent: sigEvents.NEED_REGION,
          acDefaultValue: currentRegion
        });

      },

      _loadRegion: function(e, d) {
        e.stopPropagation();
        this.logDebug('Loading region: ' + d.region);
        this._updateOverview(d.region);
      },

      _updateOverview: function(region) {

        var url = this.attr.sigUri + '?region=' + encodeURIComponent(region);
        this.logDebug('Requesting signatures: ' + url);

        this.ajax(url).done(this._onSignaturesReceived.bind(this));

        _gaq.push(['_trackEvent', 'Signatures', 'Input', 'Loaded']);
      },

      _onDistancesChanged: function(e) {
        // re-sort systems by distances
        if(this._systemsAndSignatures) {
          this._systemsAndSignatures = sigUtil.signatureSortByDistanceOrName(this._systemsAndSignatures, this.getPilot(), this.getDistancesBySystemId());
          this._publishViewModel();
        }
      },

      _onSignaturesReceived: function(resp) {

        this.logDebug('Received signatures');

        if(!resp['data']) {
          this.logError('Could not get data');
          return;
        }

        var res = resp['data'];
        var sigs = res['signatures'];

        this.logDebug('Received ' + sigs.length + ' signatures');

        // get instances from objects
        sigs = sigs.map(sigModels.Signature.fromJson);

        // group by system
        var sigsBySystem = sigs.reduce((prev, cur) => {
          if(prev[cur.system] === undefined) {
            prev[cur.system] = [];
          }
          prev[cur.system].push(cur);
          return prev;
        }, {});

        // save most recent result date by system
        var lastResultDatesBySystem = sigs.reduce((prev, cur) => {
          if(prev[cur.system] === undefined || prev[cur.system] < cur.lastUpdatedTime) {
            prev[cur.system] = cur.lastUpdatedTime;
          }
          return prev;
        }, {});

        // add all systems from region
        var systems = res['systems'];

        // create list of view model entries
        var systemsAndDistances = systems.map(s => {
          var lastResultDate = lastResultDatesBySystem[s['systemName']];
          var signatures = sigsBySystem[s['systemName']];

          // sort all signatures within a system
          signatures = this._sortSignatures(signatures);

          return new sigModels.SignatureOverviewViewModelSystemEntry(s['systemId'], s['systemName'], s['sec'],
            lastResultDate, signatures);

        });


        // sort systems by distances
        systemsAndDistances = sigUtil.signatureSortByDistanceOrName(systemsAndDistances, this.getPilot(), this.getDistancesBySystemId());

        this._systemsAndSignatures = systemsAndDistances;
        this._publishViewModel();

        this.logDebug("Providing signatures on " + systemsAndDistances.length + " systems");
      },

      _publishViewModel: function() {
        var ev = new sigEvents.SystemViewModelUpdate(this._systemsAndSignatures);
        this.trigger(sigEvents.SYSTEMS_UPDATED, ev);

        // extract simple list of signatures
        var sigs = _.flatten(this._systemsAndSignatures.map(s => s.signatures ));
        var ek = new sigEvents.SignaturesModelUpdate(sigs);
        this.trigger(sigEvents.SIGNATURES_UPDATED, ek);
      },

      _removeSignature: function(e, d) {
        this.logDebug('Removing signature ' + d.signature + ' in ' + d.systemId);

        var l = {'action': 'remove', 'systemId': d.systemId, 'signature': d.signature}

        this.ajax(this.attr.sigUri, {
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(l)
        });

        _gaq.push(['_trackEvent', 'Signatures', 'Input', 'Remove']);

      },

      _onUpdateEvent: function(e) {

        if(e.eventType == 'signature_removed') {

          var systemId = e.data['systemId'];
          var signature = e.data['signature'];

          this.logDebug('Removing deleted signature ' + signature + ' in ' + systemId + ' from view');

          this._systemsAndSignatures.forEach(s => {
            // remove deleted signature in effected system
            if(s.systemId == systemId) {
              s.signatures = s.signatures.filter(t => t.signature != signature);
              s.lastResultDate = new Date().getTime();
              s.update();
            }
          });

          this._publishViewModel();

        } else if(e.eventType == 'signature_saved' || e.eventType == 'signature_whdetails_saved') {

          var sig = sigModels.Signature.fromJson(e.data);
          this._systemsAndSignatures.forEach(s => {
            if(s.systemId == sig.systemId) {
              if(s.signatures !== undefined) {
                // remove existing signature in effected system if found and add it again
                // also remove all previous signatures if the updated signature is a tombstone
                s.signatures = s.signatures.filter(t =>
                  t.signature != sig.signature && (sig.signature != 'XXX' || t.lastUpdated.getTime() > sig.lastUpdated.getTime()) && t.signature != 'XXX'
                );
              } else {
                s.signatures = [];
              }
              s.signatures.push(sig);
              s.signatures = this._sortSignatures(s.signatures);
              s.lastResultDate = new Date().getTime();
              s.update();
            }
          }, this);

          this._publishViewModel();
        }
      },

      _sortSignatures: function(s) {
        if(!s) return;
        s.sort((a, b) => {
          var r = b.sortPrimary - a.sortPrimary;
          if(r === 0) {
            r = b.sortSecondary - a.sortSecondary;
          }
          if(r === 0) {
            r = a.signature > b.signature;
          }
          return r;
        });
        return s;
      },

      _onWhEditDialogRequested: function(e, d) {
        wormholeEditDialogUI.teardownAll();
        wormholeEditDialogUI.attachTo('#m_signatures_whdialog', {signature: d.signature, readonly: !d.editable});
      }

    });

  }
);