define(
  "igbtoolbox/signatures/events",
  [],

  function() {
    'use strict';


    /**
     * Enum for events supported by the overview controller.
     * @enum {string}
     */
    var signatureEvents = {
      REGION_LOADED: 'sig_region_loaded',
      NEED_REGION: 'sig_need_region',
      NEED_SIGNATURE_REMOVED: 'sig_need_sig_removed',
      SIGNATURE_REMOVED_REQUESTED: 'sig_removed_requested',
      SYSTEMS_UPDATED: 'sig_systems_updated',
      SIGNATURES_UPDATED: 'sig_signatures_updated',
      SIGNATURE_USER_INPUT: 'sig_user_input',
      SIGNATURE_INPUT_PARSED: 'sig_input_parsed',
      SYSTEM_REPORTED_CLEAR: 'sig_system_reported_clear',
      NEED_WHEDIT_DIALOG: 'sig_need_whedit'
    };


    /**
     * Request for loading of single region.
     *
     * @final
     * @constructor
     * @param {string} region region to load
     */
    signatureEvents.NeedRegion = function(region) {
      this.region = region;
    };


    /**
     * Request that the specified signature needs to be removed.
     *
     * @final
     * @constructor
     * @param {number} systemId systemId of signature
     * @param {string} signature signature
     */
    signatureEvents.NeedSignatureRemoved = function(systemId, signature) {
      this.systemId = systemId;
      this.signature = signature;
    };

    /**
     * Loaded region overview
     *
     * @constructor
     * @param {Array.<number>} systemIds all systemIds for region
     */
    signatureEvents.RegionLoadedResult = function(systemIds) {
      this.systemIds = systemIds;
    };


    /**
     * Provides updated system view model
     *
     * @constructor
     * @param {Array.<eveintel.SignatureOverviewViewModelSystemEntry>} systems
     */
    signatureEvents.SystemViewModelUpdate = function(systems) {
      this.systems = systems;
    };


    /**
     * Provides complete list of all signatures
     *
     * @constructor
     * @param {Array.<eveintel.Signature>} signatures parsed signatures
     */
    signatureEvents.SignaturesModelUpdate = function(signatures) {
      this.signatures = signatures;
    };


    /**
     * Unparsed user copy and paste input
     *
     * @constructor
     * @param {string} txt user input
     */
    signatureEvents.SignatureUserInput = function(txt) {
      this.txt = txt;
    };

    /**
     * User input on reported clear system
     *
     * @constructor
     * @param {number} systemId id of reported system
     * @param {string} systemName name of reported system
     */
    signatureEvents.SystemReportedClear = function(systemId, systemName) {
      this.systemId = systemId;
      this.systemName = systemName;
    };

    /**
     * Parsed signatures as provided by user
     *
     * @constructor
     * @param {Array.<eveintel.Signature>} signatures parsed signatures
     */
    signatureEvents.SignatureInputParsed = function(signatures) {
      this.signatures = signatures;
    };


    /**
     * Requests wormhole edit dialog to be shown
     *
     * @constructor
     * @param {eveintel.Signature} signature signature object of wormhole
     * @param {boolean} editable can wormhole details be edited
     */
    signatureEvents.NeedWhEditDialog = function(signature, editable) {
      this.signature = signature;
      this.editable = editable;
    };

    return signatureEvents;
  }
);