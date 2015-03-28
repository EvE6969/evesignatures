/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/edit-history",
  [
  "react/addons",
  "igbtoolbox/signatures/react/edit-history-entry"
  ],

  function(React, historyEntryReact) {
    'use strict';


    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var entries = this.props.entries;

        var SignatureEditHistoryEntry = historyEntryReact;
        var entries = entries.map(function (s) {
          var keyId = s.text + "-" + s.timestamp;
          return (
            <SignatureEditHistoryEntry entry={s} key={keyId} />
          );
        }, this);

        if(entries.length == 0) {
          return <div>No changes found.</div>
        } else {
          return (
            <div>
              <h6>Edit History</h6>
              <ul className="list-unstyled">{entries}</ul>
            </div>
          );
        }
      }
    });

  }
);