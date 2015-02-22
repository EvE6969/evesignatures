import logging, datetime
import tornado.gen
from igbtoolbox import settings
from tornado.ioloop import IOLoop


def cleanAgedSignatures():
  """Flags all signatures as deleted based on expire date"""

  # do not clean signatures in development mode
  if not settings.DEBUG:
      # we need to make this call happen on IOLoop when executed by apscheduler
      IOLoop.instance().spawn_callback(_cleanAgedSignatures)


@tornado.gen.coroutine
def _cleanAgedSignatures():

  db = settings.get_mongodb_client(settings.MONGODB_DATABASE_DOMAIN)

  logging.debug("Deleting aged signatures")

  dt = datetime.datetime.utcnow()

  yield db.Signature.update({'deleted': False, 'expires': {'$lt': dt}}, {'$set': {'deleted': True }}, multi=True)

  logging.debug("Done deleting aged signatures")
