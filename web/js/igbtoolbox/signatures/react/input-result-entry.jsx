/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/input-result-entry",
  [
  "react",
  "igbtoolbox/signatures/events",
  ],

  function(React, sigEvents) {
    'use strict';


    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var sig = this.props.signature;

        var whedit;
        var details;
        if(sig.type == 'Unstable Wormhole') {
          whedit = <a className="eve_signatures_add_editwh eve_help_tooltip" onClick={this.editWormhole}>Edit Details</a>
        } else {
          if(sig.detailsHtmlBlock) {
            details = <span><span className="eve_signatures_add_list_details">?</span></span>
          }
        }

        var hcls = 'eve_signatures_add_list_notinresult';
        if(this.props.highlight) {
          hcls = 'eve_signatures_add_list_inresult';
        }
        if(this.props.isRefined) {
          hcls = hcls + " eve_signatures_add_list_refined";
        }

        return (
          <div className={hcls}>
            <span className="eve_signatures_add_list_sig">{sig.signatureDisplay}</span>
            <span className="eve_signatures_add_list_name">{sig.label}</span>
            {whedit}
            {details}
          </div>
        );

      },

      componentWillReceiveProps: function(nextProps) {
        // highlight result on refined result
        nextProps.isRefined = nextProps.signature.type != this.props.signature.type || nextProps.signature.group != this.props.signature.group;
      },

      componentDidMount: function() {
        // create tooltip component for created details elements
        var html = this.props.signature.detailsHtmlBlock;
        if(html) {
          this._tooltipDetails = $($(this.getDOMNode()).find('.eve_signatures_add_list_details')[0]);
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

      editWormhole: function() {
        var e = new sigEvents.NeedWhEditDialog(this.props.signature, true);
        $(this.getDOMNode()).trigger(sigEvents.NEED_WHEDIT_DIALOG, e);
      }
    });

  }
);