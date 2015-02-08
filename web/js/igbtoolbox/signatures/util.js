define(
  "igbtoolbox/signatures/util",
  [
    "underscore",
    "igbtoolbox/portal/util"
  ],

  function(_, util) {
    'use strict';

    var ret = {};


    ret.signatureSortByDistanceOrName = function(systemsAndDistances, pilot, distances) {

      // add distances to systems so we can sort them accordingly
      if(pilot.igb) {
        var currentSystemId = pilot.systemId;

        return _.sortBy(systemsAndDistances, function(a, b) {
          var adis = distances[a.systemId];
          if(!adis) {
            if(a.systemId == currentSystemId) {
              adis = 0;
            } else {
              adis = 11;
            }
          }
          var bdis = distances[b.systemId];
          if(!bdis) {
            if(b.systemId == currentSystemId) {
              bdis = 0;
            } else {
              bdis = 11;
            }
          }

          if(adis == bdis) {
            return util.caseInsensitiveCompare(a.system, b.system);
          } else {
            return adis - bdis;
          }
        }, this);

      } else {
        return _.sortBy(systemsAndDistances, function(a, b) {
          return util.caseInsensitiveCompare(a.system, b.system);
        });
      }

    };

    return ret;
  }
);
