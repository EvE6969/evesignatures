/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/input-result",
  [
  "react",
  "underscore",
  "igbtoolbox/signatures/react/input-result-entry"
  ],

  function(React, _, inputResultEntry) {
    'use strict';

    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var sigs = this.props.signatures;

        var SignatureInputResultEntry = inputResultEntry;
        var entries = _.map(sigs, function (s) {
          var highlight = _.contains(this.props.lastEnteredSignatures, s.signature);
          var keyId = s.systemId + "-" + s.signature;
          return <SignatureInputResultEntry signature={s} highlight={highlight} key={keyId}/>
        }, this);

        if(sigs.length == 0) {
          return <div>No signatures have been reported in system.</div>
        } else {
          return (
            <div className="eve_signatures_add_list_cnt">
              {entries}
            </div>
          );
        }
      }
    });
  }
);