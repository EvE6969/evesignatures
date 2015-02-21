/** @jsx React.DOM */

define(
  "igbtoolbox/signatures/react/overview-system",
  [
  "react",
  "igbtoolbox/portal/util",
  "igbtoolbox/signatures/events",
  "igbtoolbox/signatures/react/overview-system-signature"
  ],

  function(React, igbUtil, sigEvents, systemSignatureReact) {
    'use strict';


    return React.createClass({
      render: function() {
        var system = this.props.system;
        var sec = system.sec;
        var systemId = system.systemId;
        var spacer;
        var imgExpand;
        var cssEntryBase;

        if(system.noData) {
          spacer = <span className="eve_expand_spacer"></span>
          cssEntryBase = 'eve_signatures_overview_nodata';
        } else {
          imgExpand = <img onClick={igbUtil.toggleShowNodes} className="eve_scanning_expand_icon eve_scanning_expand_icon_{systemId}"
          src="/static/common/im/icon_expand.png" width="16" height="16"/>
          cssEntryBase = 'eve_signatures_overview_expand';
        }

        var secCategory = 'zerozero';
        if(system.sec >= 0.5) {
          secCategory = 'highsec';
        } else if(system.sec > 0) {
          secCategory = 'lowsec';
        }

        var cssClassSec = 'sc_normal eve_secstatus eve_' + secCategory;
        var cssClassExpand = 'eve_scanning_expand_icon_' + systemId;

        var systemNoData;
        var systemProbedDate;
        var anomalies, complexes, wormholes, gravimetric, ladar, radar, magnetometric, unknown, clear;
        var sigList;
        if(system.noData) {
          systemNoData = <span className="eve_system_nodata">no data</span>;
        } else {
          var lastDate;
          if(system.lastResultDate) {
            systemProbedDate = <span className="sc_small eve_signatures_overview_list_time">
              last probed <span className="eve_timestamp" data-timestamp={system.lastResultDate}></span>
            </span>
          }

          // signature stats
          if(system.anomalies > 0) {
            anomalies = <span className="eve_signatures_overview_list_anomaly label label-anomaly" >{system.anomalies} Anomalies</span>
          }
          if(system.complexes > 0) {
            complexes = <span className="eve_signatures_overview_list_complex label label-complex">{system.complexes} Complexes</span>
          }
          if(system.wormholes > 0) {
            wormholes = <span className="eve_signatures_overview_list_wormholes label label-wh" >{system.wormholes} Wormholes</span>
          }
          if(system.gravimetric > 0) {
            gravimetric = <span className="eve_signatures_overview_list_gravimetric label label-gravimetric" >{system.gravimetric} Gravimetric</span>
          }
          if(system.ladar > 0) {
            ladar = <span className="eve_signatures_overview_list_ladar label label-ladar" >{system.ladar} Ladar</span>
          }
          if(system.radar > 0) {
            radar = <span className="eve_signatures_overview_list_radar label label-radar" >{system.radar} Radar</span>
          }
          if(system.magnetometric > 0) {
            magnetometric = <span className="eve_signatures_overview_list_magnetometric label label-magnetometric" >{system.magnetometric} Magnetometric</span>
          }
          if(system.unknown > 0) {
            unknown = <span className="eve_signatures_overview_list_unknown label label-unknown" >{system.unknown} Unknown</span>
          }
          if(system.isSystemClear) {
            clear = <span className="eve_signatures_overview_list_clear label label-clear" >Clear</span>
          }

          // create signature list entries
          var sigs = system.signatures.map(function (s) {
            var keyId = s.system + "_" + s.signature;
            var SignatureOverviewSystemSignature = systemSignatureReact;
            return (
              <SignatureOverviewSystemSignature signature={s} currentSystemId={this.props.currentSystemId} key={keyId}/>
            );
          }, this);

          // wrap signatures in toggle container
          var cssSigList = "eve_signatures_overview_details_cnt eve_toggle_container eve_signatures_overview_details_cnt_" + systemId;
          var st = {'display':'none'};
          sigList = <div className={cssSigList} style={st}><table><tbody>{sigs}</tbody></table></div>

        }


        return (
          <div className="eve_signature_overview_list_entry">
            {spacer}
            {imgExpand}
            <div className={cssEntryBase}>
              <span className="eve_system" data-system={systemId}>{system.system}</span>
              <span className="sc_small eve_distance eve_distance_brackets" data-system={systemId}></span>
              <span className={cssClassSec} title="Security status">{sec}</span>
              <img className="sc_normal" width="16" height="16" src="/static/signatures/im/icon75_10.png" title="NPCs killed last hour"></img>
              <span className="sc_normal eve_stats eve_stats_factionkills" data-system={systemId} title="NPCs killed last hour">0</span>
              {systemNoData}
              {systemProbedDate}
              {anomalies}
              {complexes}
              {wormholes}
              {gravimetric}
              {ladar}
              {radar}
              {magnetometric}
              {unknown}
              {clear}
            </div>
            {sigList}
          </div>
        );
      }
    });

  }
);