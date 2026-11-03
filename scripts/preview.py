"""Serve only public website files on loopback for local review."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = {'index.html', 'about.html', 'transfer-portal.html', '404.html', 'robots.txt', 'sitemap.xml', 'favicon.ico'}


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
            path in PUBLIC_FILES
            or (path.split('/')[0] in {'assets', 'css', 'js'} and target.is_file())
        ):
            self.send_not_found()
            return
        handler()

    def send_not_found(self):
        """Answer unknown paths with the site's own 404 page, as GitHub Pages does."""
        page = (ROOT / '404.html').read_bytes()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(page)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(page)


if __name__ == '__main__':
    print('Local preview: http://localhost:8000', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8000), WebsiteHandler).serve_forever()
