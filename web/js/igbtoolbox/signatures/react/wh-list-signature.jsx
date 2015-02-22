/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/wh-list-signature",
  [
  "react"
  ],

  function(React) {
    'use strict';


    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var sig = this.props.signature;
        var wh = sig.wormhole;

        var whDetails;
        if(wh && wh.details) {
          whDetails = <div className="eve_signatures_whlist_entry_details_head">{sig.wormhole.details}</div>
        }
        var whComment;
        if(wh && wh.comment) {
          whComment = <div className="eve_signatures_whlist_entry_comment_head">{sig.wormhole.comment}</div>
        }

        var wormholeSystemDesti = "No destination details entered";
        if(wh && wh.whSystem) {
          var ah = "http://www.staticmapper.com/index.php?system=" + wh.whSystem._id;
          wormholeSystemDesti = <span>Leading to <a href={ah} target="_new">{wh.whSystem._id}</a> (Class {wh.whSystem.class})</span>
        } else if (wh && wh.ksSystem) {
          wormholeSystemDesti = <span>Leading to {wh.ksSystem._id} ({wh.ksSystem.sec}) in {wh.ksSystem.region}</span>
        }

        var by = " probed by ";
        var whom = sig.createdBy;
        if(sig.updatedBy) {
          by = " last probed by ";
          whom = sig.createdBy;
        }

        var probedBy = by + " " + whom;

        return (
          <div className="eve_signatures_whlist_details_entry">
            <span className="eve_signatures_whlist_entry_sig">{sig.signature}</span>
            <span className="eve_signatures_whlist_entry_whsystem_head">{wormholeSystemDesti}</span>
            <span className="eve_createdby">{probedBy}</span>
            <span className="eve_timestamp" data-timestamp={sig.lastUpdatedTime}></span>
            {whDetails}
            {whComment}
          </div>
        );
      }
    });
  }
);