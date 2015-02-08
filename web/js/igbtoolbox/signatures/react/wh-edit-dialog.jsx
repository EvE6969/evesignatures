/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/wh-edit-dialog",
  [
  "react"
  ],

  function(React) {
    'use strict';


    return React.createClass({

      _saveSignature: function() {

        var inSystem = $(this.getDOMNode()).find('.eve_signatures_whdialog_in_whsystem')[0];
        var inType = $(this.getDOMNode()).find('.eve_signatures_whdialog_in_whtype')[0];
        var inDetails = $(this.getDOMNode()).find('.eve_signatures_whdialog_in_details')[0];
        var inComment = $(this.getDOMNode()).find('.eve_signatures_whdialog_in_comment')[0];
        this.props.onSave(inSystem.value, inType.value, inDetails.value, inComment.value);

      },

      render: function() {
        var wh = this.props.signature.wormhole;
        var readonly = this.props.readonly;

        var system;
        var comment;
        var details;
        var typ;

        if(wh) {
          if(wh['ksSystem']) {
            system = wh['ksSystem']['_id'];
          } else if(wh['whSystem']) {
            system = wh['whSystem']['_id'];
          }
          if(wh['comment']) {
            comment = wh['comment'];
          }
          if(wh['details']) {
            details = wh['details'];
          }
          if(wh['type']) {
            typ = wh['type']['wh'];
          }
        }

        if(readonly) {
          var footer = (<div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>);
        } else {
          var footer = (<div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          <button type="button" className="btn btn-primary" onClick={this._saveSignature}>Save changes</button>
          </div>);
        }

    return (
      <div id="m_signatures_whedit_dialog" className="modal fade">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span className="sr-only">Close</span></button>
              <h4 className="modal-title">Wormhole Details</h4>
            </div>
            <div className="modal-body">
              <div className="eve_signatures_whdialog_error"></div>

              <div className="form-group">
                <label htmlFor="eve_signatures_whdialog_in_whtype">Wormhole Type</label>
                <input type="text" className="form-control eve_signatures_whdialog_in_whtype" id="eve_signatures_whdialog_in_whtype"
                  defaultValue={typ} readOnly={readonly} />
                </div>
                <div className="form-group">
                  <label htmlFor="eve_signatures_whdialog_in_whsystem">Wormhole Destination System</label>
                  <input type="text" className="form-control eve_signatures_whdialog_in_whsystem" id="eve_signatures_whdialog_in_whsystem"
                    defaultValue={system} readOnly={readonly} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="eve_signatures_whdialog_in_details">Info Dialog Text (copy and paste it here)</label>
                    <textarea className="form-control eve_signatures_whdialog_in_details" id="eve_signatures_whdialog_in_details"
                      maxLength="1024" defaultValue={details} readOnly={readonly}></textarea>
                    </div>
                    <div className="form-group">
                      <label htmlFor="eve_signatures_whdialog_in_comment">Comment</label>
                      <textarea className="form-control eve_signatures_whdialog_in_comment" id="eve_signatures_whdialog_in_comment"
                        maxLength="1024" defaultValue={comment} readOnly={readonly}></textarea>
                      </div>

                      <div className="eve_signatures_whdialog_comment_help">
                        Enter all intel on hostiles, local wormholes and possible routes in the comment field.
                      </div>
                    </div>
                    {footer}
                  </div>
                </div>
              </div>
            );

          }
        });


  }
);