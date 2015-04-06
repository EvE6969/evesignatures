define(
	"igbtoolbox/signatures/models",
	[
	"underscore",
	"igbtoolbox/portal/util"
	],

	function(_, util) {
		'use strict';

		var models = {};

		/**
		* Represents a single system in view model. Hold references to signatures in system.
		* @constructor
		*/
		models.SignatureOverviewViewModelSystemEntry = function(systemId, system, sec, lastResultDate, signatures) {
			/** @type {number} */ this.systemId = systemId;
			/** @type {string} */ this.system = system;
			/** @type {number} */ this.sec = sec;
			/** @type {Date} */ this.lastResultDate = lastResultDate;

			// list of all signatures in system

			/** * @type {function():Array.<models.Signature>}  */
			this.signatures = signatures || [];

			this.update();
		};

		models.SignatureOverviewViewModelSystemEntry.prototype.update = function() {

			// computed signatures stats

			/** @type {function():number} */ this.anomalies = this._countSignatureClassification(this.signatures, ['anomaly']);
			/** @type {function():number} */ this.complexes = this._countSignatureClassification(this.signatures, ['dedcomplex', 'unratedcomplex']);
			/** @type {function():number} */ this.wormholes = this._countSignatureClassification(this.signatures, ['wormhole']);
			/** @type {function():number} */ this.gravimetric = this._countSignatureClassification(this.signatures, ['gravimetric']);
			/** @type {function():number} */ this.radar = this._countSignatureClassification(this.signatures, ['radar']);
			/** @type {function():number} */ this.ladar = this._countSignatureClassification(this.signatures, ['ladar', 'ladarnebula', 'ladarfacility']);
			/** @type {function():number} */ this.magnetometric = this._countSignatureClassification(this.signatures, ['magnetometric']);
			/** @type {function():number} */ this.systemclear = this._countSignatureClassification(this.signatures, ['systemclear']);
			/** @type {function():number} */ this.unknown = this._countSignatureClassification(this.signatures, ['unknown']);
			/** @type {function():number} */ this.ore = this._countSignatureClassification(this.signatures, ['ore']);

			/** @type {function():boolean} */ this.noReportedSignatures = this.anomalies == 0 && this.complexes == 0
						&& this.wormholes == 0 && this.gravimetric == 0 && this.radar == 0 && this.ladar == 0 && this.magnetometric == 0
						&& this.unknown == 0 && this.ore == 0;
			/** @type {function():boolean} */ this.isSystemClear = this.systemclear && this.noReportedSignatures;
			/** @type {function():boolean} */ this.hasData = this.systemclear || !this.noReportedSignatures;
			/** @type {function():boolean} */ this.noData = !this.hasData;

		/**
			* All signatures being wormholes
			*/
			this.wormholeSignatures = _.filter(this.signatures, function(s) {
						return s.classification == 'wormhole';
			});
		};

		/**
		* @private
		* @param {Array.<models.Signature>} signatures
		* @param {Array.<string>} classifications
		* @return {boolean}
		*/
		models.SignatureOverviewViewModelSystemEntry.prototype._countSignatureClassification = function(signatures, classifications) {
			var r = _.reduce(signatures, function(cnt, s) {
				if(_.contains(classifications, s.classification)) {
					return cnt + 1;
				} else {
					return cnt;
				}
			}, 0);
		  return r;
		};


		/**
		* Entry in history log
		*
		* @constructor
		* @param {string} text entry text to show
		* @param {string} sdate created at utc date as string
		*/
		models.SignatureHistoryEntry = function(text, sdate) {
			this.text = text;
			var dt = util.parseUTCDate(sdate);
			this.timestamp = dt.getTime();
		};


		/**
		 * Represents a single signature in a certain systems. Provides methods to generate
		 * meaningful details.
		 *
		 * @constructor
		 * @suppress {missingProperties}
		 */
		models.Signature = function(system, systemId, signature, scanGroup, group, type, strength, createdBy, createdAt, lastUpdated, updatedBy, locked, wormhole) {
			this.system = system;
			this.systemId = systemId;
			this.signature = signature;
			this.scanGroup = scanGroup;
			this.group = group;
			this.type = type;
			this.strength = strength;
			this.createdBy = createdBy;
			this.createdAt = createdAt;
			this.lastUpdated = lastUpdated;
			this.lastUpdatedTime = this.lastUpdated.getTime();
			this.updatedBy = updatedBy;
			this.wormhole = wormhole;
		  /** @type {boolean} */ this.hasWormholeWhSystem = this.wormhole != null && this.wormhole.whSystem != null;
		  /** @type {boolean} */ this.hasWormholeKsSystem = this.wormhole != null && this.wormhole.ksSystem != null;
		  /** @type {boolean} */ this.noWormholeSystem = !this.hasWormholeWhSystem && !this.hasWormholeKsSystem;
		  /** @type {boolean} */ this.hasWormholeDetails = this.wormhole != null && !_.isEmpty(this.wormhole.details);
		  /** @type {boolean} */ this.hasWormholeComment = this.wormhole != null && !_.isEmpty(this.wormhole.comment);

			/** @type {string} */ this.classification = 'unknown';
			/** @type {number} */ this.sortPrimary = 1;
			/** @type {number} */ this.sortSecondary = 0;

			/** @type {string|null} */ this.region = null; // set in fromJSON
			/** @type {number|null} */ this.sec = null; // set in fromJSON

			/** @type {string} */ this.signatureDisplay = this.signature;
			if(this.signatureDisplay == 'XXX') {
				this.signatureDisplay = '';
			}

			/** @type {string} */ this.wiki = null;
			if(this.type && this.group != 'dummy' && this.type != 'Unstable Wormhole') {
				this.wiki = 'http://wiki.eveonline.com/en/wiki/' + this.type.replace(' ', '_', 'g');
			}

			/** @type {string} */ this.label = this.scanGroup;
			if(this.group == 'dummy' && this.type == 'systemclear') {
				this.label = "System Clear";
			} else if(!_.isEmpty(this.type)) {
				this.label = this.type;
			} else if(this.group && this.group != 'Unknown') {
				this.label = 'Unknown ' + this.group;
			}


			this._updateClassification();

			/** @type {string} */ this.detailsHtmlBlock = this._getDetailsHtmlBlock();
			/** @type {string} */ this.detailsHtml = this._getDetailsHtml();

			/**
			 * Set by input controller after this signature has been updated by the user
			 * @type {boolean}
			 */
			//this.isUpdatedByUser = goog.array.contains(models.SignaturesInputViewModel.lastInputSignatures(), this.signature);

		 /**
			* Indicates if the signature has been added by current user
			* @type {boolean}
			*/
			this.isCreatedByUser = false;


		};

		models.Signature.prototype._updateClassification = function() {

			if(this.scanGroup == 'Cosmic Signature' && (this.type == 'Unstable Wormhole' || this.group == 'Wormhole')) {

				this.classification = 'wormhole';
				this.sortPrimary = 2;
				this.sortSecondary = 0;

			} else if(this.scanGroup == 'dummy' && this.type == 'systemclear') {

				this.classification = 'systemclear';

			} else if(this.scanGroup == 'Cosmic Anomaly') {

				// ore belts
				var re = /Belt$/;
				if(this.group == 'Ore Site' || this.type && re.test(this.type)) {
					this.classification = 'ore';
					this.sortPrimary = 1;
					this.sortSecondary = 0;
				} else {
					this._parseAnomaly();
					this.classification = 'anomaly';
					this.sortPrimary = 0;
					this.sortSecondary = this._getAnomalyDifficultyValue() + (this._getAnomalyDifficultyMinorValue() / 10.);
				}

			} else if(this.scanGroup == 'Cosmic Signature') {


				if(!_.isEmpty(this.type)) {

					// unrated complex
					var lv = this.getUnratedComplexDifficulty();
					if(lv) {
						this.classification = 'unratedcomplex';
						this.sortPrimary = 10;
						this.sortSecondary = 20-lv;
						return;
					}

					// ded rated complex
					lv = this.getDedComplexDifficulty();
					if(lv) {
						this.classification = 'dedcomplex';
						this.sortPrimary = 9;
						this.sortSecondary = lv;
						return;
					}

					// gravimetrics
					var cks = _.keys(models.GRAVIMETRIC);
					for(var i = 0; i < cks.length; i++) {
						var m = new RegExp(cks[i]).exec(this.type);
						if(m) {
							this.classification = 'gravimetric';
							this.sortPrimary = 3;
							this.sortSecondary = 0;
							return;
						}
					}

					// ladar
					var t = searchStripString(this.type);
					var k1 = searchStripString("Nebula");
					var k2 = searchStripString("Reservoir");
					if(util.caseInsensitiveEndsWith(t, k1) || util.caseInsensitiveEndsWith(t, k2)) {
						this.classification = 'ladarnebula';
						this.sortPrimary = 5;
						this.sortSecondary = 0;
						return;
					} else {
						var l1 = searchStripString("Chemical Lab");
						var l2 = searchStripString("Gas Processing Site");
						var l3 = searchStripString("Distribution Base");
						var l4 = searchStripString("Production Facility");

						if(util.caseInsensitiveEndsWith(t, l1) || util.caseInsensitiveEndsWith(t, l2)
								|| util.caseInsensitiveEndsWith(t, l3) || util.caseInsensitiveEndsWith(t, l4)) {
							this.classification = 'ladarfacility';
							this.sortPrimary = 5;
							this.sortSecondary = 1;
							return;
						}
					}

				} else { // empty type

					// unknown combat site
					if(this.group == 'Combat Site') {
						this.classification = 'unratedcomplex';
						this.sortPrimary = 10;
						this.sortSecondary = 20;
						return;
					}

					// gravimetric
					if(this.group == 'Gravimetric') {
						this.classification = 'gravimetric';
						this.sortPrimary = 3;
						this.sortSecondary = 0;
						return;
					}

					// ladar
					if(this.group == 'Gas Site') {
						this.classification = 'ladar';
						this.sortPrimary = 3;
						this.sortSecondary = 0;
						return;
					}
				}

				// radar
				lv = this.getRadarDifficulty();
				if(lv || this.group == 'Data Site') {
					this.classification = 'radar';
					this.sortPrimary = 7;
					this.sortSecondary = 10-lv;
					return;
				}

				// magnetometric
				lv = this.getMagnetometricDifficulty();
				if(lv || this.group == 'Relic Site') {
					this.classification = 'magnetometric';
					this.sortPrimary = 6;
					this.sortSecondary = 10-lv;
					return;
				}

			} // scanGroup == 'Cosmic Signature'
		};



		models.Signature.prototype.toJson = function() {
			return {
				'system': this.system, 'systemId': this.systemId, 'signature': this.signature, 'scanGroup': this.scanGroup,
				'group': this.group, 'type': this.type, 'strength': this.strength,
				'createdBy': this.createdBy, 'createdAt': this.createdAt, 'lastUpdate': this.lastUpdated
				};
		};

		/**
		 * @static
		 */
		models.Signature.fromJson = function(s) {
			var r = new models.Signature(s['system'], s['systemId'], s['signature'], s['scanGroup'], s['group'], s['type'], s['strength'],
				s['createdBy'], util.parseUTCDate(s['createdAt']), util.parseUTCDate(s['lastUpdate']), s['updatedBy'], false, s['wormhole']);

			if(s['region'] !== undefined) {
				r.region = s['region'];
			}
			if(s['sec'] !== undefined) {
				r.sec = s['sec'];
			}
			return r;
		};

		models.Signature.prototype.isRefining = function(s) {

			if(!_.isEmpty(this.type) && s.type != this.type) {
				return true;
			}
			if(!_.isEmpty(this.group) && s.group != this.group) {
				return true;
			}
			if(!_.isEmpty(this.scanGroup) && s.scanGroup != this.scanGroup) {
				return true;
			}
			return false;
		};

		models.Signature.prototype._getDetailsHtmlBlock = function() {
			if(this.classification == 'anomaly') {
				var ret = "<h4>Cosmic Anomaly</h4><ul><li>Difficulty: " + this.getAnomalyDifficulty() + "</li>";
				var esc = this.getAnomalyEscalation();
				if(esc) {
					ret += "<li>Escalation: " + esc + "</li>";
				}

				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'dedcomplex') {

				var ret = "<h4>DED Rated Complex</h4><ul>";
				ret += "<li>Difficulty: " + this.getDedComplexDifficulty() + "/10</li>";
				var esc = this.getComplexEscalation();
				if(esc) {
					ret += "<li>Escalation: " + esc + "</li>";
				}

				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'unratedcomplex') {

				var ret = "<h4>Unrated Complex</h4><ul>";
				ret += "<li>Sig. Strength: " + this.getUnratedComplexDifficulty() + "%</li>";
				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'gravimetric') {

				var ret = "<h4>Gravimetric Site</h4><ul>";
				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'radar') {

				var ret = "<h4>Radar Site</h4><ul>";
				ret += "<li>Sig. Strength: " + this.getRadarDifficulty() + "%</li>";
				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'ladarnebula' || this.classification == 'ladarfacility') {

				if(this.classification == 'ladarnebula') {
					var ret = "<h4>Ladar Nebula Site (Gas Harvester)</h4><ul>";
				} else {
					var ret = "<h4>Ladar Facility Site (Code Breaker)</h4><ul>";
				}
				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;

			} else if(this.classification == 'magnetometric') {

				var ret = "<h4>Magnetometric Site</h4><ul>";
				ret += "<li>Sig. Strength: " + this.getMagnetometricDifficulty() + "%</li>";
				ret += "<li><a href='" + this.wiki + "' target='_new'>EVElopedia</a></li>"
				ret += "</ul>";
				return ret;
			}

		};

		models.Signature.prototype._getDetailsHtml = function() {
			if(this.classification == 'anomaly') {

				var ret = "Difficulty: " + this.getAnomalyDifficulty();
				var esc = this.getAnomalyEscalation();
				if(esc) {
					ret += ", escalation: " + esc;
				}
				return ret;
			} else if(this.classification == 'dedcomplex') {

				var ret = "Difficulty: " + this.getDedComplexDifficulty() + "/10";
				var esc = this.getComplexEscalation();
				if(esc) {
					ret += ", escalation: " + esc;
				}
				return ret;

			} else if(this.classification == 'unratedcomplex') {
				return "Sig. Strength: " + this.getUnratedComplexDifficulty() +"% (1.25-20%)";
			} else if(this.classification == 'gravimetric') {
				return "";
			} else if(this.classification == 'ladarnebula') {
				return "Ladar Nebula (Gas Harvester)";
			} else if(this.classification == 'ladarfacility') {
				return "Ladar Drug Facility (Code Breaker)";
			} else if(this.classification == 'radar') {
				return "Sig. Strength: " + this.getRadarDifficulty() +"% (1.25-10%)";
			} else if(this.classification == 'magnetometric') {
				return "Sig. Strength: " + this.getMagnetometricDifficulty() +"% (1.25-10%)";
			} else if(this.classification == 'wormhole') {

				if(!this.wormhole) {
					return "No details specified";

				} else if(this.wormhole['whSystem'] || this.wormhole['ksSystem']) {

					if(this.wormhole['whSystem']) {
						var ld = this.wormhole['whSystem']['_id'] +  " (Class " + this.wormhole['whSystem']['class'] + ")";
					} else if(this.wormhole['ksSystem']) {
						var ld = this.wormhole['ksSystem']['_id'] + " (" + this.wormhole['ksSystem']['sec'] + ") in " + this.wormhole['ksSystem']['region'];
					}
					if(this.wormhole['type']) {
						return "Type " + this.wormhole['type']['wh'] + " leading to " + ld;
					} else {
						return  "Leading to " + ld;
					}
				}
			} else if(this.classification == 'ore') {
				return "Ore Site (Ore/Ice Miner)";
			}

		};


		models.Signature.prototype.getComplexEscalation = function() {
			// TODO
			return null;
		};

		models.Signature.prototype.getDedComplexDifficulty = function() {
			return this.__getDifficulty(models.DED_COMPLEXES, false);
		};

		models.Signature.prototype.getUnratedComplexDifficulty = function() {
			let ret = this.__getDifficulty(models.UNRATED_COMPLEX_LEVELS);
			if(ret == 0) {
				ret = this.__getDifficulty(models.DRONES_COMPLEX_LEVELS);
			}
			return ret;
		};

		models.Signature.prototype.getRadarDifficulty = function() {
			return this.__getDifficulty(models.RADAR_LEVELS);
		};

		models.Signature.prototype.getMagnetometricDifficulty = function() {
			return this.__getDifficulty(models.MAGNETOMETRIC_LEVELS);
		};

		models.Signature.prototype.__getDifficulty = function(levels, parseFaction=true) {
			if(_.isEmpty(this.type)) {
				return 0;
			}
			let faction = null
			let normalizedType = this.type;
			if(parseFaction) {
				for(let ck of _.keys(models.__FACTION_PATTERN)) {
					const m = new RegExp(ck).exec(this.type);
					if(m) {
						faction = m[1];
						normalizedType = this.type.replace(m[0], faction);
						break;
					}
				}
			}

			for(let ck of _.keys(levels)) {
				let c = ck;
				if(faction) c = c.replace('\(Faction\)', faction);
				c = searchStripString(c);
				const t = searchStripString(normalizedType);
				if(util.caseInsensitiveCompare(c, t) === 0) {
					return levels[ck];
				}
			}
		};


		models.Signature.prototype._parseAnomaly = function() {
			this._anomalyFactionPart = 'n/a';
			this._anomalyLevelPart = 'n/a';
			this._anomalyNamePart = 'n/a';
			if(_.isEmpty(this.type)) {
				return;
			}
			var m = this._anomalyDifficultyRegex.exec(this.type);
			if(!m) {
				return;
			}
			if(m.length == 4) {
				this._anomalyFactionPart = m[1];
				this._anomalyLevelPart = m[2];
				this._anomalyNamePart = m[3];
			} else {
				this._anomalyFactionPart = m[1];
				this._anomalyLevelPart = null;
				this._anomalyNamePart = m[2];
			}

		};

		models.Signature.prototype.getAnomalyDifficulty = function() {

			var ret = '?';

			if(this._anomalyNamePart != null) {
				var dif = this._getAnomalyDifficultyValue();
				if(dif != -1) {
					ret = new String(dif);
				}
			}

			if(this._anomalyLevelPart != null) {
				var ml = this._getAnomalyDifficultyMinorValue();
				for(var i = 0; i < ml; i++) {
					ret += '+';
				}
			}

			ret += '/10';

			return ret;
		};

		models.Signature.prototype._getAnomalyDifficultyValue = function() {
			var name = this._anomalyNamePart;
			if(name == 'Hideaway' || name == 'Cluster') {
				return 1;
			} else if(name == 'Burrow' || name == 'Collection') {
				return 2;
			} else if(name == 'Refuge' || name == 'Assembly') {
				return 3;
			} else if(name == 'Den' || name == 'Gathering') {
				return 4;
			} else if(name == 'Yard' || name == 'Surveillance') {
				return 5;
			} else if(name == 'Rally Point' || name == 'Menagerie') {
				return 6;
			} else if(name == 'Port' || name == 'Herd') {
				return 7;
			} else if(name == 'Hub' || name == 'Squad') {
				return 8;
			} else if(name == 'Haven' || name == 'Patrol') {
				return 9;
			} else if(name == 'Sanctum' || name == 'Horde') {
				return 10;
			} else {
				return -1;
			}
		};

		models.Signature.prototype._getAnomalyDifficultyMinorValue = function() {
			if(this._anomalyLevelPart == 'Hidden') {
				return 1;
			} else if(this._anomalyLevelPart == 'Forsaken') {
				return 2;
			} else if(this._anomalyLevelPart == 'Forlorn') {
				return 3;
			} else {
				return 0;
			}
		};

		// http://wiki.eveonline.com/en/wiki/Cosmic_Anomaly#Escalations
		models.Signature.prototype.getAnomalyEscalation = function() {
			if(_.isEmpty(this.type)) {
				return null;
			}
			var m = this._anomalyDifficultyRegex.exec(this.type);
			if(!m) {
				return null;
			}
			if(m.length == 4) {
				var factions = m[1];
				var lvl = m[2];
				var name = m[3];
			} else {
				var factions = m[1];
				var lvl = null;
				var name = m[2];
			}

			return models.ANOMALY_ESCALATIONS[factions + " " + name];
		};

		// http://wiki.eveonline.com/en/wiki/Cosmic_Anomaly
		models.Signature.prototype._anomalyDifficultyRegex = new RegExp("(Angel|Blood|Guristas|Sansha|Serpentis|Drone)\\s?(Hidden|Forsaken|Forlorn)?\\s+(.+)");




		/**
		 * @type {Object.<string, string>}
		 * @private
		 * @const
		 */
		models.ANOMALY_ESCALATIONS = {
			"Angel Hideaway": "Minmatar Contracted Bio-Farm",
			"Serpentis Hideaway": "Serpentis Drug Outlet",
			"Angel Burrow": "Angel Creo-Corp Mining",
			"Serpentis Refuge": "Serpentis Narcotic Warehouses",
			"Angel Yard": "Angel's Red Light District",
			"Serpentis Den": "Serpentis Phi-Outpost",
			"Angel Port": "Angel Military Operations Complex",
			"Serpentis Yard": "Serpentis Corporation Hydroponics Site",
			"Angel Hub": "Cartel Prisoner Retention",
			"Serpentis Port": "Serpentis Paramilitary Complex",
			"Angel Sanctum": "Angel Cartel Naval Shipyard",
			"Serpentis Sanctum": "Serpentis Fleet Shipyard",
			"Blood Hideaway": "Old Meanie - Cultivation Center",
			"Sansha Hideaway": "Sansha Military Outpost",
			"Blood Den": "Mul-Zatah Monastery",
			"Sansha Refuge": "Sansha's Command Relay Outpost",
			"Blood Yard": "Blood Raider Psychotropics Depot",
			"Sansha Yard": "Sansha's Nation Neural Paralytic Facility",
			"Blood Rally Point": "Crimson Hand Supply Depot",
			"Sansha Rally Point": "Sansha War Supply Complex",
			"Blood Port": "Blood Raider Coordination Center",
			"Sansha Port": "Sansha Military Operations Complex",
			"Blood Hub": "Blood Raider Prison Camp",
			"Sansha Hub": "Sansha War Supply Complex",
			"Blood Sanctum": "Blood Raider Naval Shipyard",
			"Sansha Sanctum": "Centus Assembly T.P. Co.",
			"Guristas Hideaway": "Pith Robux Asteroid Mining & Co.",
			"Drone Collection": "Rogue Drone Infestation Spout ",
			"Guristas Burrow": "Pith Deadspace Depot",
			"Drone Assembly": "Rogue Drone Asteroid Infestation",
			"Guristas Den": "Guristas Scout Outpost",
			"Drone Surveillance": "Outgrowth Rogue Drone Hive",
			"Guristas Yard": "Guristas Hallucinogen Supply Waypoint",
			"Guristas Rally Point": "Guristas Troop Reinvigoration Camp",
			"Guristas Port": "Gurista Military Operations Complex",
			"Guristas Hub": "Pith's Penal Complex",
			"Guristas Sanctum": "The Maze"
		};

		/**
		 * @type {Object.<string, string>}
		 * @private
		 * @const
		 */
		models.__FACTION_PATTERN = {
			".*?(?:Arch\\s+)?(Angel).*?": "Angel Cartel",
			".*?(?:Dark\\s+)?(Blood).*?": "Blood Raiders",
			".*?(?:Dread\\s+)?(Gurista[s]?).*?": "Guristas",
			".*?(?:True\\s+)?(Sansha[s]?).*?": "Sansha's Nation",
			".*?(?:Shadow\\s+)?(Serpentis).*?": "Serpentis"
		};

		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.UNRATED_COMPLEX_LEVELS = {
				"(Faction) Hideout": 20,
				"(Faction) Lookout": 10,
				"(Faction) Watch": 5,
				"(Faction) Vigil": 2.5,
				"Provisional (Faction) Outpost": 20,
				"(Faction) Outpost": 10,
				"Minor (Faction) Annex": 5,
				"(Faction) Annex": 2.5,
				"(Faction) Base": 20,
				"(Faction) Fortress": 10,
				"(Faction) Military Complex": 5,
				"(Faction) Provincial HQ": 2.5,
				"(Faction) Fleet Staging Point": 1.25
		};

		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.DRONES_COMPLEX_LEVELS = {
				"Haunted Yard": 20,
				"Desolate Site": 10,
				"Chemical Yard": 5,
				"Rogue Trial Yard": 20,
				"Dirty Site": 10,
				"Ruins": 5,
				"Radiance": 10,
				"Hierarchy": 5,
				"Independence": 2.5
		};

		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.RADAR_LEVELS = {
				"Local (Faction) Mainframe": 10,
				"Local (Faction) Virus Test Site": 10,
			 	"Local (Faction) Data Processing Center": 5,
			 	"Local (Faction) Shattered Life-Support Unit": 5,
			 	"Local (Faction) Data Terminal": 2.5,
			 	"Local (Faction) Production Installation": 2.5,
			 	"Local (Faction) Backup Server": 1.25,
			 	"Local (Faction) Minor Shipyard": 1.25,
			 	"Regional (Faction) Data Fortress": 10,
			 	"Regional (Faction) Mainframe": 10,
			 	"Regional (Faction) Command Center": 5,
			 	"Regional (Faction) Data Processing Center": 5,
			 	"Regional (Faction) Data Mining Site": 2.5,
			 	"Regional (Faction) Data Terminal": 2.5,
			 	"Regional (Faction) Backup Server": 1.25,
			 	"Regional (Faction) Secure Server": 1.25,
			 	"Central (Faction) Sparking Transmitter": 10,
			 	"Central (Faction) Survey Site": 5,
			 	"Central (Faction) Command Center": 2.5,
			 	"Central (Faction) Data Mining Site": 1.25,
			 	// drug production
			 	"Digital Network": 1.25,
			 	"Digital Complex": 1.25,
			 	"Digital Convolution": 1.25,
			 	"Digital Circuitry": 1.25,
			 	"Digital Compound": 1.25,
			 	"Digital Matrix": 1.25,
			 	"Digital Plexus": 1.25,
			 	"Digital Tessellation": 1.25,
			 	// wormhole
			 	"Unsecured Perimeter Amplifier": 2.5,
			 	"Unsecured Perimeter Information Center": 2.5,
			 	"Unsecured Perimeter Comms Relay": 2.5,
			 	"Unsecured Frontier Database": 2.5,
			 	"Unsecured Perimeter Transponder Farm": 2.5,
			 	"Unsecured Frontier Receiver": 2.5,
			 	"Unsecured Frontier Digital Nexus": 2.5,
			 	"Unsecured Frontier Trinary Hub": 2.5,
			 	"Unsecured Frontier Enclave Relay": 2.5,
			 	"Unsecured Frontier Server Bank": 2.5,
			 	"Unsecured Core Backup Array": 2.5,
			 	"Unsecured Core Emergence": 2.5
		};

		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.MAGNETOMETRIC_LEVELS = {
				"Crumbling (Faction) Antiquated Outpost": 10,
				"Crumbling (Faction) Excavation": 10,
				"Looted (Faction) Collision Site": 10,
				"Looted (Faction) Explosive Debris": 10,
				"Crumbling (Faction) Crystal Quarry": 5,
				"Crumbling (Faction) Solar Harvesters": 5,
				"Looted (Faction) Abandoned Station": 5,
				"Looted (Faction) Battle Remnants": 5,
				"Crumbling (Faction) Explosive Debris": 2.5,
				"Crumbling (Faction) Stone Formation": 2.5,
				"Looted (Faction) Lone Vessel": 2.5,
				"Looted (Faction) Pod Cluster": 2.5,
				"Crumbling (Faction) Abandoned Colony": 1.25,
				"Crumbling (Faction) Mining Installation": 1.25,
				"Looted (Faction) Ruined Station": 1.25,
				"Looted (Faction) Ship Graveyard": 1.25,

				"Decayed (Faction) Excavation": 10,
				"Decayed (Faction) Particle Accelerator": 10,
				"Ransacked (Faction) Explosive Debris": 10,
				"Ransacked (Faction) Ship Remnants": 10,
				"Decayed (Faction) Collision Site": 5,
				"Decayed (Faction) Mass Grave": 5,
				"Ransacked (Faction) Abandoned Station": 5,
				"Ransacked (Faction) Dumped Cargo": 5,
				"Decayed (Faction) Lone Vessel": 2.5,
				"Decayed (Faction) Rock Formations": 2.5,
				"Ransacked (Faction) Collision Site": 2.5,
				"Ransacked (Faction) Demolished Station": 2.5,
				"Decayed (Faction) Mining Installation": 1.25,
				"Decayed (Faction) Quarry": 1.25,
				"Ransacked (Faction) Ruined Station": 1.25,
				"Ransacked (Faction) Ship Graveyard": 1.25,

				"Pristine (Faction) Ship Remnants": 20,
				"Pristine (Faction) Pod Cluster": 10,
				"Ruined (Faction) Monument Site": 10,
				"Pristine (Faction) Dumped Cargo": 5,
				"Pristine (Faction) Abandoned Colony": 5,
				"Ruined (Faction) Temple Site": 5,
				"Pristine (Faction) Ship Graveyard": 2.5,
				"Pristine (Faction) Collision Site": 2.5,
				"Ruined (Faction) Science Outpost": 2.5,
				"Pristine (Faction) Battle Remnants": 1.25,
				"Pristine (Faction) Explosive Debris": 1.25,
				"Ruined (Faction) Crystal Quarry": 1.25,

				// Rogue Drones
				"Bloated Ruins": 1,
				"Forgotten Ruins": 1,
			 	"Ancient Ruins": 1,
			 	"Festering Ruins": 1,
			 	"Whispy Ruins": 1,
			 	"Crumbling Ruins": 1,
			 	"Hidden Ruins": 1,
				"Murky Ruins": 1,

			 	// Wormhole
			 	"Forgotten Perimeter Coronation Platform": 2.5,
			 	"Forgotten Perimeter Power Array": 2.5,
			 	"Forgotten Perimeter Gateway": 2.5,
			 	"Forgotten Perimeter Habitation Coils": 2.5,
			 	"Forgotten Frontier Recursive Depot": 2.5,
			 	"Forgotten Frontier Quarantine Outpost": 2.5,
			 	"Forgotten Frontier Conversion Module": 2.5,
			 	"Forgotten Frontier Evacuation Center": 2.5,
			 	"Forgotten Core Data Field": 2.5,
			 	"Forgotten Core Information Pen": 2.5,
			 	"Forgotten Core Assembly Hall": 2.5,
			 	"Forgotten Core Circuitry Disassembler": 2.5
		};

		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.GRAVIMETRIC = {
				"^(Small|Average|Moderate|Large)\\s+(.+?)\\s(Cluster|Deposit)$": 1,
				// wormhole
				"Common Perimeter Deposit": 1,
				"Ordinary Perimeter Deposit": 1,
				"Unexceptional Frontier Deposit": 1,
				"Average Frontier Deposit": 1,
				"Infrequent Core Deposit": 1,
				"Uncommon Core Deposit": 1,
				"Unusual Core Deposit": 1,
				"Isolated Core Deposit": 1,
				"Exceptional Core Deposit": 1,
				"Rarified Core Deposit": 1
		};

		// http://wiki.eveonline.com/en/wiki/DED_Complex_List
		/**
		 * @type {Object.<string, number>}
		 * @private
		 * @const
		 */
		models.DED_COMPLEXES = {
			"Minmatar Contracted Bio-Farm": 1,
			"Old Meanie - Cultivation Center": 1,
			"Pith Robux Asteroid Mining & Co.": 1,
			"Sansha Military Outpost": 1,
			"Serpentis Drug Outlet": 1,
			"Angel Creo-Corp Mining": 2,
			"Blood Raider Human Farm": 2,
			"Pith Deadspace Depot": 2,
			"Sansha Acclimatization Facility": 2,
			"Serpentis Live Cargo Distribution Facilities": 2,
			"Rogue Drone Infestation Sprout": 2,
			"Angel Repurposed Outpost": 3,
			"Blood Raider Intelligence Collection Point": 3,
			"Guristas Guerilla Grounds": 3,
			"Sansha's Command Relay Outpost": 3,
			"Serpentis Narcotic Warehouses": 3,
			"Rogue Drone Asteroid Infestation": 3,
			"Angel Cartel Occupied Mining Colony": 4,
			"Mul-Zatah Monastery": 4,
			"Guristas Scout Outpost": 4,
			"Sansha's Nation Occupied Mining Colony": 4,
			"Serpentis Phi-Outpost": 4,
			"Angel's Red Light District": 5,
			"Blood Raider Psychotropics Depot": 5,
			"Guristas Hallucinogen Supply Waypoint": 5,
			"Sansha's Nation Neural Paralytic Facility": 5,
			"Serpentis Corporation Hydroponics Site": 5,
			"Outgrowth Rogue Drone Hive": 5,
			"Crimson Hand Supply Depot": 6,
			"Guristas Troop Reinvigoration Camp": 6,
			"Sansha War Supply Complex": 6,
			"Angel Military Operations Complex": 7,
			"Blood Raider Coordination Center": 7,
			"Gurista Military Operations Complex": 7,
			"Sansha Military Operations Complex": 7,
			"Serpentis Paramilitary Complex": 7,
			"Cartel Prisoner Retention": 8,
			"Blood Raider Prison Camp": 8,
			"Pith's Penal Complex": 8,
			"Sansha Prison Camp": 8,
			"Serpentis Prison Camp": 8,
			"Angel Cartel Naval Shipyard": 10,
			"Blood Raider Naval Shipyard": 10,
			"The Maze": 10,
			"Centus Assembly T.P. Co.": 10,
			"Serpentis Fleet Shipyard": 10
		};


		/**
		 * @type {Object.<number, string>}
		 * @private
		 * @const
		 */
		models.DED_DROPS = {
				1: "Frigate C-Type",
				2: "Frigate B-Type",
				3: "Frigate A-Type",
				4: "Cruiser C-Type",
				5: "Cruiser B-Type",
				6: "Cruiser A-Type",
				7: "Battleship C-Type",
				8: "Battleship B-Type",
				9: "Battleship X-Type"
		};

		return models;

		/**
		* Removes whitespace and special characters
		*
		* @private
		* @param {string} s
		* @return {string}
		*/
		function searchStripString(s) {
			return s.replace(/[\s.'-]/g, '');
		}

	}
);