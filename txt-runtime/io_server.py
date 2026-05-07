#!/usr/bin/env python3
"""
io_server.py - fischertechnik TXT Controller I/O HTTP Server
Singular Blockly Extension Runtime - v1

Usage:
    python3 io_server.py [port]
    Default port: 8080
"""

import http.server
import json
import sys
import time

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

# Attempt ftrobopy connection at startup
try:
    import ftrobopy

    _txt = ftrobopy.ftrobopy("localhost", 65000)
    _TXT_OK = True
    sys.stdout.write("ftrobopy connected successfully\n")
except Exception as _e:
    sys.stderr.write("Warning: ftrobopy connection failed: {}\n".format(_e))
    _txt = None
    _TXT_OK = False

# Mirror state for /io snapshot (tracks last commanded values)
_motor_speeds = [0, 0, 0, 0]  # M1-M4, index 0 = M1
_output_on = [False] * 8  # O1-O8, index 0 = O1


class _IoHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass  # suppress default access log output

    def _send_json(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            return json.loads(raw) if raw.strip() else {}
        except (json.JSONDecodeError, ValueError):
            return {}

    # ------------------------------------------------------------------ GET --

    def do_GET(self):
        if self.path != "/io":
            self._send_json(404, {"error": "not found"})
            return

        if not _TXT_OK:
            self._send_json(503, {"error": "ftrobopy connection failed"})
            return

        try:
            inputs = [_txt.input(i).state() for i in range(1, 9)]
            self._send_json(
                200,
                {
                    "motors": list(_motor_speeds),
                    "outputs": list(_output_on),
                    "inputs": inputs,
                    "timestamp": int(time.time() * 1000),
                },
            )
        except Exception as e:
            self._send_json(503, {"error": str(e)})

    # ----------------------------------------------------------------- POST --

    def do_POST(self):
        data = self._read_body()

        if self.path == "/motor":
            motor = data.get("motor")
            speed = data.get("speed")
            if (
                not isinstance(motor, int)
                or not isinstance(speed, int)
                or not 1 <= motor <= 4
                or not -512 <= speed <= 512
            ):
                self._send_json(400, {"error": "invalid motor or speed value"})
                return
            if _TXT_OK:
                _txt.motor(motor).setSpeed(speed)
            _motor_speeds[motor - 1] = speed
            self._send_json(200, {"ok": True})

        elif self.path == "/output":
            output = data.get("output")
            level = data.get("level")
            if (
                not isinstance(output, int)
                or not isinstance(level, int)
                or not 1 <= output <= 8
                or level not in (0, 512)
            ):
                self._send_json(400, {"error": "invalid output or level value"})
                return
            if _TXT_OK:
                _txt.output(output).setLevel(level)
            _output_on[output - 1] = level == 512
            self._send_json(200, {"ok": True})

        elif self.path == "/stop_all":
            for i in range(1, 5):
                if _TXT_OK:
                    _txt.motor(i).setSpeed(0)
                _motor_speeds[i - 1] = 0
            for i in range(1, 9):
                if _TXT_OK:
                    _txt.output(i).setLevel(0)
                _output_on[i - 1] = False
            self._send_json(200, {"ok": True, "stopped": {"motors": 4, "outputs": 8}})

        else:
            self._send_json(404, {"error": "not found"})


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), _IoHandler)
    sys.stdout.write("io_server.py listening on port {}\n".format(PORT))
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
