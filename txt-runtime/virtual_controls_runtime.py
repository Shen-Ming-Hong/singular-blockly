#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HTTP companion runtime for TXT virtual controls.

This server keeps a canonical JSON snapshot on the TXT controller so generated
program code can poll virtual button state from the local filesystem.
"""

# Keep this runtime compatible with the TXT controller's Python 3.6 runtime.
# Avoid future imports or syntax that requires Python 3.7+.

import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from typing import Any, Dict

RUNTIME_DIR = "/tmp/singular_blockly"
STATE_FILE = os.path.join(RUNTIME_DIR, "virtual_controls_state.json")
_STATE_LOCK = threading.RLock()
AUTH_HEADER = "X-Singular-Blockly-Token"
_AUTH_TOKEN = None
_STATE: Dict[str, Any] = {
    "sessionId": None,
    "updatedAt": 0,
    "controls": {},
}


def now_ms() -> int:
    return int(time.time() * 1000)


def set_auth_token(token: Any) -> None:
    global _AUTH_TOKEN
    if isinstance(token, str) and token.strip():
        _AUTH_TOKEN = token.strip()
        return
    _AUTH_TOKEN = None


def ensure_runtime_dir() -> None:
    os.makedirs(RUNTIME_DIR, exist_ok=True)


def reset_state() -> None:
    global _STATE
    _STATE = {
        "sessionId": None,
        "updatedAt": now_ms(),
        "controls": {},
    }


def clear_state_file() -> None:
    try:
        os.remove(STATE_FILE)
    except OSError:
        pass


def write_state_file() -> None:
    ensure_runtime_dir()
    temp_path = STATE_FILE + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as handle:
        json.dump(_STATE, handle, ensure_ascii=False, separators=(",", ":"))
    os.replace(temp_path, STATE_FILE)


def read_json_body(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    content_length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(content_length) if content_length else b"{}"
    if not raw_body:
        return {}
    try:
        parsed = json.loads(raw_body.decode("utf-8"))
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Invalid JSON body: %s" % exc)
    if not isinstance(parsed, dict):
        raise ValueError("Request body must be a JSON object")
    return parsed


def require_string(payload: Dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError("%s must be a non-empty string" % key)
    return value.strip()


def require_controls_list(payload: Dict[str, Any], key: str) -> Any:
    value = payload.get(key)
    if not isinstance(value, list):
        raise ValueError("%s must be an array" % key)
    return value


def build_session_controls(payload: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    controls_map = {}
    for entry in require_controls_list(payload, "controls"):
        if not isinstance(entry, dict):
            raise ValueError("controls entries must be objects")
        stable_id = require_string(entry, "stableId")
        identifier = require_string(entry, "identifier")
        controls_map[stable_id] = {
            "identifier": identifier,
            "pressed": False,
        }
    return controls_map


def apply_snapshot(payload: Dict[str, Any]) -> None:
    session_id = require_string(payload, "sessionId")
    with _STATE_LOCK:
        current_session_id = _STATE.get("sessionId")
        if not current_session_id:
            raise RuntimeError("No active session")
        if current_session_id != session_id:
            raise PermissionError("Session mismatch")

        updates = require_controls_list(payload, "controls")
        next_controls = dict(_STATE.get("controls", {}))
        for entry in updates:
            if not isinstance(entry, dict):
                raise ValueError("controls entries must be objects")
            stable_id = require_string(entry, "stableId")
            if stable_id not in next_controls:
                raise ValueError("Unknown control: %s" % stable_id)
            next_controls[stable_id] = {
                "identifier": next_controls[stable_id].get("identifier", stable_id),
                "pressed": bool(entry.get("pressed", False)),
            }

        _STATE["controls"] = next_controls
        _STATE["updatedAt"] = now_ms()
        write_state_file()


def is_request_authorized(handler: BaseHTTPRequestHandler) -> bool:
    if not _AUTH_TOKEN:
        return True
    return handler.headers.get(AUTH_HEADER) == _AUTH_TOKEN


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "SingularBlocklyVirtualControls/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[virtual-controls-runtime] %s\n" % (fmt % args,))

    def respond(self, status: int, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def require_auth(self) -> bool:
        if is_request_authorized(self):
            return True
        self.respond(401, {"ok": False, "error": "Unauthorized"})
        return False

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/health":
            self.respond(404, {"ok": False, "error": "Not found"})
            return

        with _STATE_LOCK:
            payload = {
                "ok": True,
                "sessionId": _STATE.get("sessionId"),
                "updatedAt": _STATE.get("updatedAt"),
                "controlCount": len(_STATE.get("controls", {})),
            }
        self.respond(200, payload)

    def do_PUT(self) -> None:  # noqa: N802
        if self.path != "/session":
            self.respond(404, {"ok": False, "error": "Not found"})
            return
        if not self.require_auth():
            return

        try:
            payload = read_json_body(self)
            session_id = require_string(payload, "sessionId")
            controls_map = build_session_controls(payload)
            with _STATE_LOCK:
                _STATE["sessionId"] = session_id
                _STATE["controls"] = controls_map
                _STATE["updatedAt"] = now_ms()
                write_state_file()
        except ValueError as exc:
            self.respond(400, {"ok": False, "error": str(exc)})
            return

        self.respond(
            200,
            {
                "ok": True,
                "sessionId": session_id,
                "controlCount": len(controls_map),
            },
        )

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/snapshot":
            self.respond(404, {"ok": False, "error": "Not found"})
            return
        if not self.require_auth():
            return

        try:
            payload = read_json_body(self)
            apply_snapshot(payload)
        except ValueError as exc:
            self.respond(400, {"ok": False, "error": str(exc)})
            return
        except RuntimeError as exc:
            self.respond(409, {"ok": False, "error": str(exc)})
            return
        except PermissionError as exc:
            self.respond(409, {"ok": False, "error": str(exc)})
            return

        self.respond(
            200,
            {
                "ok": True,
                "sessionId": _STATE.get("sessionId"),
                "updatedAt": _STATE.get("updatedAt"),
            },
        )

    def do_DELETE(self) -> None:  # noqa: N802
        if self.path != "/session":
            self.respond(404, {"ok": False, "error": "Not found"})
            return
        if not self.require_auth():
            return

        with _STATE_LOCK:
            reset_state()
            clear_state_file()
        self.respond(200, {"ok": True})


def main(argv: Any) -> int:
    port = 8081
    auth_token = None
    if len(argv) > 1:
        port = int(argv[1])
    if len(argv) > 2:
        auth_token = argv[2]

    ensure_runtime_dir()
    reset_state()
    clear_state_file()
    set_auth_token(auth_token)

    server = ThreadedHTTPServer(("0.0.0.0", port), RequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:  # pragma: no cover - manual stop
        pass
    finally:
        with _STATE_LOCK:
            reset_state()
            clear_state_file()
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
