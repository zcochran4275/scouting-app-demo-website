"""Serve only public website files on loopback for local review."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class WebsiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        self.serve_public(super().do_GET)

    def do_HEAD(self):
        self.serve_public(super().do_HEAD)

    def serve_public(self, handler):
        path = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        target = (ROOT / path).resolve()
        if not target.is_relative_to(ROOT) or not (
            path in {'index.html', 'about.html', 'transfer-portal.html'}
            or (path.split('/')[0] in {'assets', 'css', 'js'} and target.is_file())
        ):
            self.send_error(404)
            return
        handler()


if __name__ == '__main__':
    print('Local preview: http://localhost:8000', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8000), WebsiteHandler).serve_forever()
