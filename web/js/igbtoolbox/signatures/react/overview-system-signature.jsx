/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/overview-system-signature",
  [
  "react",
  "igbtoolbox/signatures/events"
  ],

  function(React, sigEvents) {
    'use strict';


    return React.createClass({
      render: function() {
        var sig = this.props.signature;

        var cssDetails = 'eve_signatures_overview_details_' + sig.signature;
        var cssClassClassification = 'eve_signatures_overview_details_type eve_signatures_overview_details_type_' + sig.classification;

        var updatedBy = <div>entered <span className="eve_timestamp" data-timestamp={sig.lastUpdatedTime}></span> by {sig.createdBy}</div>
        if(sig.updatedBy) {
          updatedBy = <div>updated <span className="eve_timestamp" data-timestamp={sig.lastUpdatedTime}></span> by {sig.updatedBy}</div>
        }
        var awh;
        if(sig.classification == 'wormhole' && sig.wormhole) {
          awh = <a className="eve_signatures_overview_details_show eve_help_tooltip" onClick={this.showWormholeDetails}>Show Details</a>
        }
        var tp;
        if(sig.detailsHtmlBlock) {
          tp = <span className="eve_signatures_overview_details_tooltip">?</span>
        }
        var aremove;
        if(sig.systemId == this.props.currentSystemId && sig.signature != 'XXX') {
          aremove = <a className="eve_signatures_overview_details_remove" onClick={this.removeSignature}>Remove</a>
        }

        return (
          <tr className={cssDetails}>
            <td className="eve_signatures_overview_details_system">{sig.signatureDisplay}</td>
            <td className={cssClassClassification}>{sig.label}</td>
            <td className="eve_signatures_overview_details_tt">{tp}</td>
            <td className="eve_signatures_overview_details_timestamp">{updatedBy}</td>
            <td className="eve_signatures_overview_details_remove">{aremove}</td>
            <td className="eve_signatures_overview_details_details">{awh}</td>
          </tr>
        )
      },

      componentDidMount: function() {
        // create tooltip component for created details elements
        var html = this.props.signature.detailsHtmlBlock;
        if(html) {
          this._tooltipDetails = $($(this.getDOMNode()).find('.eve_signatures_overview_details_tooltip')[0]);
          this._tooltipDetails.tooltip({
            title:html, html: true, delay: {show: 0, hide: 750}, placement: 'right'
          });
        }
      },

      componentWillUnmount: function() {
        if(this._tooltipDetails) {
          this._tooltipDetails.tooltip('destroy');
        }
      },

      removeSignature: function() {
        var e = new sigEvents.NeedSignatureRemoved(this.props.signature.systemId, this.props.signature.signature);
        $(this.getDOMNode()).trigger(sigEvents.NEED_SIGNATURE_REMOVED, e);
      },

      showWormholeDetails: function() {
        var e = new sigEvents.NeedWhEditDialog(this.props.signature, false);
        $(this.getDOMNode()).trigger(sigEvents.NEED_WHEDIT_DIALOG, e);
      }
    });

  }
);
