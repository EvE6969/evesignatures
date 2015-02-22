/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/wh-list-system",
  [
  "react",
  "underscore",
  "igbtoolbox/portal/util",
  "igbtoolbox/signatures/react/wh-list-signature"
  ],

  function(React, _, igbUtil, whListSignatureReact) {
    'use strict';


    return React.createClass({
      mixins: [React.addons.PureRenderMixin],
      render: function() {
        var whSystem = this.props.system;
        var systemId = whSystem.systemId;

        var secCategory = 'zerozero';
        if(whSystem.sec >= 0.5) {
          secCategory = 'highsec';
        } else if(whSystem.sec > 0) {
          secCategory = 'lowsec';
        }

        var cssClassSec = 'eve_secstatus eve_' + secCategory;
        var cssClassExpand = 'eve_scanning_expand_icon_' + systemId;

        // only add wormhole signatures as children
        var whsigs = whSystem.signatures;

        // create stats based on desti system
        var stats = [];
        _.reduce(whsigs, function(memo, s) {
          if(s.wormhole && s.wormhole.ksSystem) {
            memo.push(" → " + s.wormhole.ksSystem._id + " (" + s.wormhole.ksSystem.sec + ") in " + s.wormhole.ksSystem.region + " ");
          } else if(s.wormhole && s.wormhole.whSystem) {
            memo.push(" → " + s.wormhole.whSystem._id + " (Class " + s.wormhole.whSystem.class + ")");
          }
          return memo;

        }, stats);
        var sstats = stats.join(",");

        var SignatureWormholeListSignature = whListSignatureReact;
        var signatures = whsigs.map(function (s) {
          return <SignatureWormholeListSignature signature={s} key={s.signature}/>
        }, this);

        var st = {'display':'none'};
        return (
          <div className="eve_signatures_whlist_entry">
            <img onClick={igbUtil.toggleShowNodes} src="/static/common/im/icon_expand.png"
              width="16" height="16" className="eve_scanning_expand_icon"/>
              <span className="eve_system" data-system={systemId}>{whSystem.system}</span>
              <span className="eve_distance eve_distance_brackets" data-system={systemId}></span>
              <span className={cssClassSec} title="Security status">{whSystem.sec}</span>
              <span className="eve_signatures_overview_list_wormholes">{whsigs.length} Wormholes</span>
              <span className="eve_signatures_overview_list_destinations">{sstats}</span>
              <div className="eve_signatures_whlist_details eve_toggle_container" style={st}>{signatures}</div>
            </div>
        );
      }
    });
  }
);