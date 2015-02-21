define(
  "igbtoolbox/signatures/wh-edit-dialog-ui",
  [
  "react",
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/signatures/react/wh-edit-dialog",
  "igbtoolbox/autocomplete/autocomplete-ui",
  "igbtoolbox/autocomplete/autocomplete-ui",
  "igbtoolbox/flightjs/ajax-mixin",
  "igbtoolbox/flightjs/logging-mixin",
  "igbtoolbox/sde/sde-mixin"
  ],

  function(react, _, defineComponent, whEditDialogReact,
      autocompleteWhTypeUI, autocompleteSystemsUI, withAjax, withLogging, withSDE) {
    'use strict';

    return defineComponent([withLogging, withAjax, withSDE], {

      attributes: {
        signature: null,
        readonly: true,
        acUri: '/api/autocomplete/whsystem',
        sigUri: '/api/signature',
        sigWhEditDialogSelector: "#m_signatures_whedit_dialog",
        sigACWormholeTypeSelector: '#eve_signatures_whdialog_in_whtype',
        sigACRegionSelector: '#eve_signatures_whdialog_in_whsystem'
      },

      attached: function() {

        var el = this.node;
        react.renderComponent(whEditDialogReact({
          signature: this.attr.signature,
          readonly: this.attr.readonly,
          onClose: this._close.bind(this),
          onSave: this._save.bind(this)
        }), this.node);

        $(this.attr.sigWhEditDialogSelector).modal({keyboard: true}).on('hidden.bs.modal', this._close.bind(this));


        this.withSystems(this._onSystemsLoaded, true);
        this.withTable("invTypes", this._onInvTypesLoaded);

      },

      _onSystemsLoaded: function(systems) {
        var systemNames = _.map(systems, function(s) { return s.name; });

        // create AC UI
        autocompleteSystemsUI.attachTo(this.attr.sigACRegionSelector, {
          acSource: systemNames
        });
      },

      _onInvTypesLoaded: function(result) {
        var table = result.table;
        // get wormholes by groupID
        var whs = _.filter(table.data, table.ColPred("groupID", "==", 988))
          .map(function(row) { return row[table.c.typeName]; })
          .map(function(name) {
            // cut off Wormhole prefix
            if(name.indexOf("Wormhole " == 0)) {
              return name.substring("Wormhole ".length);
            } else {
              return null;
            }
          })
          .filter(function(name) { return name != null; });

        // create AC UI
        autocompleteWhTypeUI.attachTo(this.attr.sigACWormholeTypeSelector, {
          acSource: whs
        });
      },

      dispose: function() {
        // this._acSystem.dispose();
        // this._acWh.dispose();
        $(this.attr.sigWhEditDialogSelector).modal('hide');
        react.unmountComponentAtNode(this.node);
      },

      _save: function(system, typ, details, comment) {

        var l = {'action': 'editwh', 'signature': this.attr.signature.signature, 'systemId': this.attr.signature.systemId,
            'details': details, 'comment': comment,
            'system': system, 'type': typ };

        this.ajax(this.attr.sigUri, {
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(l)
        }).done(this._close.bind(this));

        _gaq.push(['_trackEvent', 'Signatures', 'Wormhole', 'Details Edited']);
      },

      _close: function() {
        try {
          this.teardown();
        } catch(e) {
          // already destroyed
        }
      }

    });

  }
);
