/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/wh-region-list",
  [
  "react",
  "underscore",
  "igbtoolbox/signatures/react/wh-list-system"
  ],

  function(React, _, whListSystemReact) {
    'use strict';


    return React.createClass({displayName: 'SignatureRegionList',
    render: function() {
      var signaturesByRegion = this.props.signaturesByRegion;
      var regions = _.keys(this.props.signaturesByRegion);

      if(regions.length == 0) {
        return <div className='eve_signatures_whlist_noresults'>No wormholes have been reported.</div>
      } else {

        var dr = _.map(regions, function(region) {

          var systems = signaturesByRegion[region];

          var SignatureWormholeListSystem = whListSystemReact;
          var entries = systems.map(function (s) {
            return <SignatureWormholeListSystem system={s} key={s.systemId}/>
          }, this);

          return (
            <div className='eve_signatures_wh_region' key={region}>
              <h4>{region}</h4>
              {entries}
            </div>
          );
        });

        return <div>{dr}</div>
      }

    }
    });

  }
);