import os
import tornado
from . import signatures
from . import jobs

def routes():
        return [
            (r"/static/signatures/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), '..', '..', 'web')}),
            (signatures.URI_SIGNATURES_HISTORY, signatures.SignaturesHistoryAjax),
            (signatures.URI_SIGNATURES, signatures.SignaturesAjax),
            (signatures.URI_SYSTEM_AUTOCOMPLETE, signatures.WhSystemAutoCompleteAjax),
        ]


def tornado_templates():
    return [os.path.join(os.path.dirname(__file__),  '..', '..', 'tornado-templates', 'signature.html')]


def schedule(sched):
  sched.add_job(jobs.cleanAgedSignatures, 'interval', minutes=10)
