#!/usr/bin/env python
import sys

import mimetypes

mimetypes.init()
if ".wasm" not in mimetypes.types_map:
    print(
        "WARNING: wasm mimetype unsupported on that system, trying to correct",
        file=sys.stderr,
    )
    mimetypes.types_map[".wasm"] = "application/wasm"

import argparse
from http import server


parser = argparse.ArgumentParser(
    description="Start a local webserver with a Python terminal."
)
parser.add_argument(
    "--port", type=int, default=8000, help="port for the http server to listen on"
)
args = parser.parse_args()


class MyHTTPRequestHandler(server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()

        super().end_headers()

    def send_my_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")


server.test(HandlerClass=MyHTTPRequestHandler, protocol="HTTP/1.1", port=args.port)
