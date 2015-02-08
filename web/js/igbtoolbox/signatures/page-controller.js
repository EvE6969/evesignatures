define(
  "igbtoolbox/signatures/page-controller",
  [
  "jquery",
  "underscore",
  "igbtoolbox/flightjs/define",
  "igbtoolbox/portal/nav-events"
  ],

  function($, _, defineComponent, navEvents) {
    'use strict';


    return defineComponent([], {

      attributes: {
        sigOverviewPageSelector: '#pageSignatureOverview',
        sigAddPageSelector: '#pageSignatureAdd',
        sigWhlistPageSelector: '#pageSignatureWhlist',
        sigNavSelector: 'ul.nav',
        sigHrefOverviewId: 'eve_signatures_tab_overview',
        sigHrefAddId: 'eve_signatures_tab_add',
        sigHrefWhId: 'eve_signatures_tab_wormholes',
        sigWhlistSelector: '#m_signatures_whlist',
        sigActivatedEventId: "nav_sig_activated"
      },

      attached: function() {

        this._isActivated = false;

        this.trigger(navEvents.NEED_NAV_ITEM, new navEvents.NavItem("Signatures", this.attr.sigActivatedEventId));

        this.on(document, navEvents.NAV_ITEM_ACTIVATED, this._activated);

        this.on(this.$node.find(this.attr.sigNavSelector), 'click', this._onInternalNavSelection);

      },

      _activated: function(e, obj) {

        if(obj.eventId != this.attr.sigActivatedEventId) {
          this.$node.hide();
          return;
        }

        if(this._isActivated) {
          this.$node.show();
          return;
        }

        // define chunk for webpack so we can lazy load signature tool js code
        require.ensure([
          "igbtoolbox/signatures/events",
          "igbtoolbox/signatures/overview-controller",
          "igbtoolbox/signatures/input-controller",
          "igbtoolbox/signatures/wh-list-ui",
          "signatures.css"], (function(require) {

          // update badge with wormhole count on tab
          var sigEvents = require("igbtoolbox/signatures/events");
          this.on(sigEvents.SIGNATURES_UPDATED, this._updateWhCount);

          // signature overview page
          var overviewController = require("igbtoolbox/signatures/overview-controller");
          overviewController.attachTo(this.attr.sigOverviewPageSelector);

          // signature input page
          var inputController = require("igbtoolbox/signatures/input-controller");
          inputController.attachTo(this.attr.sigAddPageSelector);

          // wormhole overview list (gets data from overview controller)
          var wormholeListUI = require("igbtoolbox/signatures/wh-list-ui");
          wormholeListUI.attachTo(this.attr.sigWhlistSelector);

          // include css
          require('signatures.css');

        }).bind(this), "signatures");

        this._isActivated = true;
        this.$node.show();
      },

      _onInternalNavSelection: function(e) {

        // hide all pages
        $(this.attr.sigOverviewPageSelector).hide();
        $(this.attr.sigAddPageSelector).hide();
        $(this.attr.sigWhlistPageSelector).hide();

        // remove activated class and set again for target
        $(this.attr.sigNavSelector).find('.active').removeClass('active');
        $(e.target).parent().addClass('active');

        // show based on clicked nav item
        var tab = e.target.id;
        if(tab == this.attr.sigHrefOverviewId) {
          $(this.attr.sigOverviewPageSelector).show().parent().addClass('active');
        } else if(tab == this.attr.sigHrefAddId) {
          $(this.attr.sigAddPageSelector).show();
        } else if(tab == this.attr.sigHrefWhId) {
          $(this.attr.sigWhlistPageSelector).show().parent().addClass('active');
        }
      },

      _updateWhCount: function(e, data) {
        var whs = _.filter(data.signatures, function(t) {
          return t.classification == 'wormhole';
        });
        $('#' + this.attr.sigHrefWhId + ' .badge').text(whs.length);
      }

    });

  }
);