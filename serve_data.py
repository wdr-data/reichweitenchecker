import contextlib
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer, test
import socket
import sys


class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPRequestHandler.end_headers(self)


# ensure dual-stack is not disabled; ref #38907
class DualStackServer(ThreadingHTTPServer):
    def server_bind(self):
        # suppress exception when protocol is IPv4
        with contextlib.suppress(Exception):
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

    def finish_request(self, request, client_address):
        self.RequestHandlerClass(request, client_address, self, directory="data")


if __name__ == "__main__":
    # HTTPServer(("localhost", 9001), CORSRequestHandler).serve_forever()
    test(
        HandlerClass=CORSRequestHandler,
        ServerClass=DualStackServer,
        port=9001,
        bind="192.168.2.69",
        protocol="HTTP/1.1",
    )
