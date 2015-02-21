import re, os, logging
import tornado.gen
from igbtoolbox import settings


_RE_CLASS = re.compile('^Class ([0-6]) Wormhole Systems.+$')
_RE_REGION = re.compile('^Region ([0-9]+): Constellations.+$')
#_RE_CONST = re.compile('^Constellation ([0-9]+): System Static is ([A-Z][0-9]{3}) to ([Cc]lass [0-6]|High Sec|Low Sec|Null Sec) ([0-9]+ systems)$')
_RE_CONST = re.compile('^Constellation ([0-9]+): System Static is ([A-Z][0-9]{3}) to ([Cc]lass [0-6]|High Sec|Low Sec|Null Sec).*$')
_RE_CONST2 = re.compile('^Constellation ([0-9]+): System Statics are ([A-Z][0-9]{3}) to ([Cc]lass [0-6]|High Sec|Low Sec|Null Sec) and ([A-Z][0-9]{3}) to ([Cc]lass [0-6]|High Sec|Low Sec|Null Sec).*$')

_RE_DEST_CLASS = re.compile('^Wormholes to Class ([0-6])')
_RE_DEST_SEC = re.compile('^Wormholes to (\S+) Security')


_CSV_SYSTEMS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'datadumps', 'whsystems.txt')
_CSV_TYPES_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'datadumps', 'whtypes.csv')



@tornado.gen.coroutine
def parseWhs():

    db = settings.get_mongodb_client(settings.MONGODB_DATABASE_GLOBAL)
    cnt = yield db.WormholeTypes.count()
    if cnt > 0: return

    logging.info("Initializing wormhole types from datadump")

    with open(_CSV_TYPES_PATH) as fd:

        destClass = None
        destSec = None

        for line in fd:
            line = line.strip()
            if not line: continue

            m = _RE_DEST_CLASS.search(line)
            if m:
                destClass = int(m.group(1))
                destSec = None

            m = _RE_DEST_SEC.search(line)
            if m:
                destSec = m.group(1)
                destClass = None


            f = [l.strip() for l in line.split('\t')]
            if len(f[0]) != 4 or len(f) != 10: continue

            obj = {'_id': f[0], 'type': f[1], 'from': f[2], 'region': f[3], 'constellation': f[4], 'totalCount': f[5],
                'lifetime': f[6], 'massJump': f[7], 'maxMass': f[8], 'sigStr': f[9]}

            if destClass: obj['destClass'] = destClass
            elif destSec: obj['destSec'] = destSec

            #print(obj)
            db.WormholeTypes.save(obj)


@tornado.gen.coroutine
def parseSystems():

    db = settings.get_mongodb_client(settings.MONGODB_DATABASE_GLOBAL)
    cnt = yield db.WormholeSystem.count()
    if cnt > 0: return

    logging.info("Initializing wormhole systems from datadump")

    with open(_CSV_SYSTEMS_PATH) as fd:

        currentClass = -1
        currentRegion = -1
        currentConst = -1
        static1 = None
        static2 = None
        dest1 = None
        dest2 = None
        result = {}

        for line in fd:
            line = line.strip()
            if not line: continue

            print(line)

            m = _RE_CLASS.search(line)
            if m:
                currentClass = int(m.group(1))

            m = _RE_REGION.search(line)
            if m:
                currentRegion = int(m.group(1))

            m = _RE_CONST.search(line)
            if m:
                currentConst = int(m.group(1))
                static1 = m.group(2)
                dest1 = m.group(3)
                static2 = None
                dest2 = None

            m = _RE_CONST2.search(line)
            if m:
                currentConst = int(m.group(1))
                static1 = m.group(2)
                dest1 = m.group(3)
                static2 = m.group(4)
                dest2 = m.group(5)

            if line.startswith('J'):
                for sys in line.split(','):
                    statics = []
                    obj = {'_id': sys.strip(), 'region': currentRegion, 'constellation': currentConst, 'class': currentClass, 'statics': statics}
                    statics.append({'wormhole': static1, 'destination': dest1.title()})
                    if static2:
                        statics.append({'wormhole': static2, 'destination': dest2.title()})

                    result[sys.strip()] = obj
                    #print(obj)
                    db.WormholeSystem.save(obj)

