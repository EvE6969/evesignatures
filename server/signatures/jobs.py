import logging, datetime
from igbtoolbox import settings


def cleanAgedSignatures():
  """Flags all signatures as deleted based on expire date"""

  # do not clean signatures in development mode
  if not settings.DEBUG:

    db = settings.get_mongodb_client(settings.MONGODB_DATABASE_DOMAIN)

    logging.debug("Deleting aged signatures")

    dt = datetime.datetime.utcnow()

    db.Signature.update({'deleted': False, 'expires': {'$lt': dt}}, {'$set': {'deleted': True }}, multi=True)
