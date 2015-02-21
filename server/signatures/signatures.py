import logging, json, datetime, re
from igbtoolbox import evecommon, universe, pages
from messagebus.messaging_sockjs import MessageBusConnection
from authn_simple import access
import tornado.gen
import tornado.web


URI_SIGNATURES = '/api/signature'
URI_SIGNATURES_HISTORY = '/api/signature/logs'
URI_SYSTEM_AUTOCOMPLETE = '/api/autocomplete/whsystem'

_DEFAULT_EXPIRE_DAYS = 1
_WH_EXPIRES_NEG_TOLERANCE = 0 #60*3
_WH_DEFAULT_EXPIRE_HOURS = 24 - _WH_EXPIRES_NEG_TOLERANCE / 60
_RE_WH_SYSTEM = re.compile('^J[0-9]+$')
_RE_WH_LIFETIME = re.compile(r'^([0-9]{1,2}) hrs$')

class SignaturesAjax(evecommon.AbstractPage):

    @tornado.gen.coroutine
    @access.pilot_allowed
    def get(self):
        # query all signatures for the pilots alliance that haven't been deleted yet (happens automatically by cronjob)
        q = { 'allianceId': self._pilot.allianceId, 'deleted': False, }

        # query individual system (for signature input)
        system = self.get_argument('system', default=None)
        if system:
            q['systemId'] = universe.getSystemIdByName(system)
        # find as much non-deleted signatures as possible sorted by system and last updated desc
        sigs = yield self._domain_db.Signature.find(q).sort([('system', 1), ('lastUpdate', -1)]).to_list(10000)

        # filter by selected region if any
        region = self.get_argument('region', default=None)

        ret = []
        lastSystem = None
        lastClearSig = None
        for s in sigs:

            #if region and universe.getRegionBySystemName(s['system']) != region:
            #    continue

            # keep track of current system in result set (its order by system and date) and reset clear flag
            if s['systemId'] != lastSystem:
                lastClearSig = None

            # add system clear entry
            if s['signature'] == 'XXX' and s['type'] == 'systemclear':
                lastClearSig = s
                if s['systemId'] != lastSystem:
                    ret.append(s)

            # add non system clear entries
            if not lastClearSig or lastClearSig['systemId'] != s['systemId']:
                ret.append(s)

            # add system true sec and region along the signature (so we have it available to show e.g. in wh list)
            # s['sec'] = round(universe.getSystemTrueSecById(s['systemId']), 2)
            # s['region'] = universe.getRegionBySystemName(s['system'])

            lastSystem = s['systemId']


        # create list with all systems in region and their sec status
        region = region or universe.getRegionBySystemName(self._pilot.systemName)

        systems = []
        for s in universe.getSystemNamesByRegion(region):
            sid = universe.getSystemIdByName(s)
            sys = { 'systemName': s, 'systemId': sid, 'sec': round(universe.getSystemTrueSecById(sid), 2) }
            systems.append(sys)

        self._send_json_response(retValue={'signatures': ret, 'systems': systems})


    @tornado.gen.coroutine
    @access.pilot_allowed
    def post(self):

        payload = self.request.body
        obj = json.loads(bytes.decode(payload))
        action = obj['action']

        if action == 'save':
            signatures = obj['signatures']

            cntUpdated = 0
            cntCreated = 0
            cntCreatedWh = 0

            # find existing signatures in system
            systemIds = set([ s['systemId'] for s in signatures ])
            q = {'systemId': {'$in': list(systemIds)}, 'deleted': False}
            existing = yield self._domain_db.Signature.find(q).to_list(10000)

            for s in signatures:
                obj = {
                       'allianceId': self._pilot.allianceId, 'systemId': s['systemId'],
                       'system': s['system'], 'signature': s['signature'], 'scanGroup': s['scanGroup'],
                       'group': s['group'], 'type': s['type'], 'strength': s['strength'],
                       'lastUpdate': datetime.datetime.utcnow(),
                       'deleted': False
                }

                existingSig = None
                for e in existing:
                    if e['signature'] == obj['signature'] and e['systemId'] == obj['systemId']:
                        existingSig = e

                if existingSig:

                    # check if is refining existing entry
                    if existingSig['type'] and not obj['type']:
                        continue
                    if existingSig['group'] and not obj['group']:
                        continue
                    if existingSig['scanGroup'] and not obj['scanGroup']:
                        continue

                    existingSig.update(obj)
                    obj = existingSig
                    obj['updatedBy'] = self._pilot.charName
                    cntUpdated += 1
                else:
                    obj['createdAt'] = datetime.datetime.utcnow()
                    obj['createdBy'] = self._pilot.charName
                    if obj['type'] == 'Unstable Wormhole':
                        obj['expires'] = obj['createdAt'] + datetime.timedelta(hours=_WH_DEFAULT_EXPIRE_HOURS)
                        cntCreatedWh += 1
                    else:
                        obj['expires'] = obj['createdAt'] + datetime.timedelta(days=_DEFAULT_EXPIRE_DAYS)
                        cntCreated += 1

                # add system true sec and region along the signature (so we have it available to show e.g. in wh list)
                obj['sec'] = round(universe.getSystemTrueSecById(s['systemId']), 2)
                obj['region'] = universe.getRegionBySystemName(s['system'])

                logging.debug('Saving submitted signature: %s' % obj)
                if '_id' in obj:
                    yield self._domain_db.Signature.update({'_id': obj['_id']}, obj, upsert=True, multi=False)
                else:
                    yield self._domain_db.Signature.insert(obj)

                # broadcast saved signature
                MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_saved', 'data': obj}, self._pilot.allianceId)

            # create edit history message
            msg = { 'date': datetime.datetime.utcnow(), 'text': '%s saved %d signatures' % (self._pilot.charName, len(signatures)),
                    'charName': self._pilot.charName, 'charId': self._pilot.charId,
                    'allianceId': self._pilot.allianceId, 'allianceName': self._pilot.allianceName,
                    'corpId': self._pilot.corpId, 'corpName': self._pilot.corpName,
                    'cntUpdated': cntUpdated, 'cntCreated': cntCreated, 'cntWormholes': cntCreatedWh }

            yield self._domain_db.SignatureHistory.insert(msg)

            MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_history_added', 'data': msg}, self._pilot.allianceId)

        elif action == 'remove':

            q = { 'allianceId': self._pilot.allianceId, 'signature': obj['signature'], 'systemId': obj['systemId'], 'deleted': False }

            logging.debug('Flagging submitted signature as deleted: %s' % q)
            yield self._domain_db.Signature.update(q, {'$set': {'deleted': True}}, upsert=False)

            del q['deleted']
            MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_removed', 'data': q}, self._pilot.allianceId)

            # create edit history entry
            sys = universe.getSystemNameById(obj['systemId'])
            msg = { 'date': datetime.datetime.utcnow(), 'text': '%s removed signature %s in %s' % (self._pilot.charName, obj['signature'], sys),
                    'charName': self._pilot.charName, 'charId': self._pilot.charId,
                    'allianceId': self._pilot.allianceId, 'allianceName': self._pilot.allianceName,
                    'corpId': self._pilot.corpId, 'corpName': self._pilot.corpName }
            yield self._domain_db.SignatureHistory.insert(msg)

            MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_history_added', 'data': msg}, self._pilot.allianceId)

        elif action == 'editwh':

            q = { 'allianceId': self._pilot.allianceId, 'signature': obj['signature'], 'systemId': obj['systemId'], 'deleted': False }

            sig = yield self._domain_db.Signature.find_one(q)
            if not sig:
                logging.error('Could not find signature for wh with id: %s' % q)
                raise tornado.web.HTTPError(500)

            wh = { 'details': obj['details'], 'type': None, 'comment': obj['comment'] }
            sig['wormhole'] = wh

            sig['expires'] = sig['createdAt'] + datetime.timedelta(days=_DEFAULT_EXPIRE_DAYS) - datetime.timedelta(minutes=_WH_EXPIRES_NEG_TOLERANCE)

            system = obj.get('system')
            if system:
                m = _RE_WH_SYSTEM.search(system)
                isWh = m != None
                res = yield self._eve_db.WormholeSystem.find_one({'_id': obj['system']})
                if res:
                    wh['whSystem'] = res
                elif not isWh:
                    ks = {'_id': obj['system'], 'region': universe.getRegionBySystemName(obj['system']),
                          'sec': universe.getSystemSecById(universe.getSystemIdByName(obj['system'])) }
                    wh['ksSystem'] = ks
                else:
                    logging.warning("Could not find wormhole system in database: %s" % system)
                    wh['whSystem'] = {'_id': system}

            if obj.get('type'):
                wt = obj['type']
                whtype = yield self._eve_db.WormholeTypes.find_one({'_id': wt})
                if not whtype:
                    if wt != 'K162': logging.warning('Could not get whtype: %s' % wt)
                else:
                    wh['type'] = whtype
                    # adjust signature expire time based on wh lifetime
                    m = _RE_WH_LIFETIME.search(whtype['lifetime'])
                    if m == None:
                        logging.warning("Could not parse wh lifetime: %s", whtype['lifetime'])
                    else:
                        hrs = int(m.group(1))
                        sig['expires'] = sig['createdAt'] + datetime.timedelta(minutes=hrs*60) - datetime.timedelta(minutes=_WH_EXPIRES_NEG_TOLERANCE)
                        logging.debug("wh expires at: %s", sig['expires'])

            sig['lastUpdate'] = datetime.datetime.utcnow()
            yield self._domain_db.Signature.update(q, sig, upsert=False)

            MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_whdetails_saved', 'data': sig}, self._pilot.allianceId)

            # create edit history entry
            sys = universe.getSystemNameById(obj['systemId'])
            msg = { 'date': datetime.datetime.utcnow(), 'text': '%s updated wormhole details for %s in %s' % (self._pilot.charName, obj['signature'], sys),
                    'charName': self._pilot.charName, 'charId': self._pilot.charId,
                    'allianceId': self._pilot.allianceId, 'allianceName': self._pilot.allianceName,
                    'corpId': self._pilot.corpId, 'corpName': self._pilot.corpName  }
            yield self._domain_db.SignatureHistory.insert(msg)

            MessageBusConnection.broadcast({'module': 'signatures', 'event': 'signature_history_added', 'data': msg}, self._pilot.allianceId)

        self._send_json_response(retValue='Ok')


class SignaturesHistoryAjax(evecommon.AbstractPage):

    @tornado.gen.coroutine
    @access.pilot_allowed
    def get(self):

        res = yield self._domain_db.SignatureHistory.find({'allianceId': self._pilot.allianceId}).sort([('date', -1)]).to_list(30)
        self._send_json_response(retValue=res)


# TODO: move to SDE module
class WhSystemAutoCompleteAjax(evecommon.AbstractPage):

    @tornado.gen.coroutine
    def get(self):

        token = self.get_argument('token', None)
        if not token:
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps([]))
            self.finish()
            return

        maxResults = int(self.get_argument('max_matches', 10))

        f = token.upper().ljust(7, '0')
        t = token.upper().ljust(7, '9')

        q = {'_id': {'$gte': f, '$lte': t}}
        res = yield self._eve_db.WormholeSystem.find(q).to_list(maxResults)

        ret = [ 'eveintel.formatACRow' ]
        for r in res:
            ret.append({ 'system': r['_id'], 'region': 'Class %d' % r['class']})

        self.set_header("Content-Type", "application/json")
        #self.set_header("Content-Type", "text/plain")
        self.write(json.dumps([ret]))
        self.finish()
