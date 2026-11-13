/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CYBERBRICK_OTA_PROTOCOL_VERSION, CYBERBRICK_OTA_REMOTE_PATH, CYBERBRICK_OTA_AGENT_TARGET_VERSION } from '../types/cyberbrickUpload';

export const CYBERBRICK_OTA_AGENT_VERSION = CYBERBRICK_OTA_AGENT_TARGET_VERSION;
export const CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START = '# Singular Blockly CyberBrick OTA bootstrap START';
export const CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END = '# Singular Blockly CyberBrick OTA bootstrap END';
export const CYBERBRICK_OTA_BOOTSTRAP_READY_MARKER = '[Singular Blockly] OTA bootstrap ready';
export const CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_START = '# Singular Blockly CyberBrick OTA keep-alive START';
export const CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_END = '# Singular Blockly CyberBrick OTA keep-alive END';
export const CYBERBRICK_OTA_KEEP_ALIVE_MARKER = '[Singular Blockly] Program finished; Wi-Fi upload stays ready';

export interface CyberBrickOtaAgentConfig {
	deviceId: string;
	otaToken: string;
	otaPort: number;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function indentPythonBlock(code: string): string {
	const normalized = code || 'pass\n';
	return normalized
		.split('\n')
		.map(line => (line ? `    ${line}` : ''))
		.join('\n');
}

export function buildCyberBrickRcMainOtaBootstrap(): string {
	return [
		CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START,
		'def _singular_blockly_ota_yield(ms=1):',
		'    try:',
		'        import time as _singular_blockly_ota_time',
		'        _singular_blockly_ota_time.sleep_ms(ms)',
		'    except Exception:',
		'        pass',
		'try:',
		'    import cyberbrick_ota_agent as _singular_blockly_ota_agent',
		'    _singular_blockly_ota_agent.start_background(False)',
		'    try:',
		'        for _singular_blockly_ota_wait_idx in range(50):',
		'            if getattr(_singular_blockly_ota_agent, "Y", [0])[0] > 1:',
		'                break',
		'            _singular_blockly_ota_yield(10)',
		'    except Exception:',
		'        _singular_blockly_ota_yield(500)',
		'    _singular_blockly_ota_yield(300)',
		'    try:',
		'        import network as _singular_blockly_ota_net',
		'        _singular_blockly_ota_wlan = _singular_blockly_ota_net.WLAN(_singular_blockly_ota_net.STA_IF)',
		'        for _singular_blockly_ota_wait_idx in range(50):',
		'            if _singular_blockly_ota_wlan.isconnected():',
		'                break',
		'            if getattr(_singular_blockly_ota_agent, "Y", [0])[0] > 1:',
		'                break',
		'            _singular_blockly_ota_yield(100)',
		'        if not _singular_blockly_ota_wlan.isconnected():',
		'            _singular_blockly_ota_wlan.disconnect()',
		'            _singular_blockly_ota_wlan.config(reconnects=0)',
		'    except Exception:',
		'        pass',
		'except Exception:',
		'    pass',
		CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END,
	].join('\n');
}

/**
 * Keeps the CyberBrick program alive after the student's `main()` returns.
 *
 * The official CyberBrick `boot.py` runs `import rc_main` and then `rc_main.main()`.
 * Once `main()` returns, `boot.py` ends and the background OTA agent thread is no longer
 * reliably reachable, so students had to add a trailing forever loop to keep Wi-Fi uploads
 * working. Like Arduino's `loop()` keeping `ArduinoOTA.handle()` alive, this block wraps
 * `main()` so the program idles after it finishes (or after an uncaught error is printed)
 * and the OTA agent keeps listening. Ctrl+C (KeyboardInterrupt) still stops the idle loop
 * so USB tools such as mpremote can take over.
 */
export function buildCyberBrickRcMainOtaKeepAlive(): string {
	return [
		CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_START,
		'def _singular_blockly_ota_keep_alive():',
		'    try:',
		`        print(${JSON.stringify(CYBERBRICK_OTA_KEEP_ALIVE_MARKER)})`,
		'    except Exception:',
		'        pass',
		'    import time as _singular_blockly_ota_idle_time',
		'    while True:',
		'        _singular_blockly_ota_idle_time.sleep_ms(200)',
		'_singular_blockly_ota_user_main = globals().get("main")',
		'def main():',
		'    if callable(_singular_blockly_ota_user_main):',
		'        try:',
		'            _singular_blockly_ota_user_main()',
		'        except KeyboardInterrupt:',
		'            raise',
		'        except Exception as _singular_blockly_ota_main_exc:',
		'            try:',
		'                import sys as _singular_blockly_ota_main_sys',
		'                _singular_blockly_ota_main_sys.print_exception(_singular_blockly_ota_main_exc)',
		'            except Exception:',
		'                pass',
		'    _singular_blockly_ota_keep_alive()',
		CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_END,
	].join('\n');
}

function stripMarkedBlock(code: string, start: string, end: string): string {
	const pattern = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
	return code.replace(pattern, '\n');
}

export function stripCyberBrickRcMainOtaBootstrap(code: string): string {
	const withoutBootstrap = stripMarkedBlock(code, CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START, CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END);
	return stripMarkedBlock(withoutBootstrap, CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_START, CYBERBRICK_OTA_RC_MAIN_KEEP_ALIVE_END).replace(/^\n+/, '');
}

export function withCyberBrickRcMainOtaBootstrap(code: string): string {
	const cleanedCode = stripCyberBrickRcMainOtaBootstrap(code).replace(/^\n+/, '');
	const wrappedCode = indentPythonBlock(cleanedCode);
	return `${buildCyberBrickRcMainOtaBootstrap()}\n\ntry:\n${wrappedCode}\nexcept KeyboardInterrupt:\n    raise\nexcept Exception as _singular_blockly_ota_exc:\n    try:\n        import sys as _singular_blockly_ota_sys\n        _singular_blockly_ota_sys.print_exception(_singular_blockly_ota_exc)\n    except Exception:\n        pass\n    raise\n\n${buildCyberBrickRcMainOtaKeepAlive()}\n`;
}

/**
 * Builds the device-side MicroPython OTA agent source.
 * The returned string intentionally contains device-side credentials so callers must never log it.
 */
function buildCyberBrickOtaAgentRuntimeSource(config: CyberBrickOtaAgentConfig): string {
	return `import ubinascii as a,uhashlib as h,ujson as j
try:import usocket as s
except:import socket as s
try:import cyberbrick_ota_config as c
except:c=0
def _cfg(n,d):
	return getattr(c,n,d) if c else d
D=_cfg('DEVICE_ID','')
OTA_TOKEN=_cfg('OTA_TOKEN','')
P=_cfg('OTA_PORT',${JSON.stringify(config.otaPort)})
N=_cfg('SSID','')
W=_cfg('WIFI_PASSWORD','')
A=${JSON.stringify(CYBERBRICK_OTA_AGENT_VERSION)}
V=${JSON.stringify(CYBERBRICK_OTA_PROTOCOL_VERSION)}
R=${JSON.stringify(CYBERBRICK_OTA_REMOTE_PATH)}
X=[0];Y=[0]
Z=lambda ip:{'started':True,'ipAddress':ip or I(),'mode':'thread'}
def J(n,p):
	p=j.dumps(p).encode();return ('HTTP/1.1 %s\\r\\nContent-Length:%d\\r\\n\\r\\n'%(n,len(p))).encode()+p

def T(c,b):
	o=0
	while o<len(b):
		n=c.send(b[o:])
		if not n:raise OSError('short-send')
		o+=n
def K(d):
	return d.get('authorization')=='Bearer '+OTA_TOKEN and d.get('x-cyberbrick-device-id')==D and d.get('x-cyberbrick-protocol-version')=='${String(CYBERBRICK_OTA_PROTOCOL_VERSION)}'
def I():
	try:
		import network
		w=network.WLAN(network.STA_IF)
		return w.ifconfig()[0] if w.isconnected() else ''
	except:return ''
def C():
	try:
		import network,time
		w=network.WLAN(network.STA_IF);w.active(1)
		if w.isconnected():return w.ifconfig()[0]
		if N:
			w.connect(N,W)
			for _ in range(40):
				if w.isconnected():return w.ifconfig()[0]
				time.sleep(.25)
	except:return ''
	return ''
def F(c,l,n,p):
	q=h.sha256();m=0;f=open(p,'wb')
	try:
		if l:
			x=l[:n]
			if x:f.write(x);q.update(x);m=len(x)
		while m<n:
			x=c.recv(1024 if n-m>1024 else n-m)
			if not x:break
			f.write(x);q.update(x);m+=len(x)
		return m,a.hexlify(q.digest()).decode()
	finally:f.close()
def H(c):
	r=b''
	while b'\\r\\n\\r\\n' not in r:
		x=c.recv(256)
		if not x:break
		r+=x
	x=r.split(b'\\r\\n\\r\\n',1);u=x[0];l=x[1] if len(x)>1 else b'';z=u.decode().split('\\r\\n');e=z[0] if z else '';d={}
	for i in z[1:]:
		if ':' in i:
			k,v=i.split(':',1);d[k.lower()]=v.strip()
	return e,d,l
def U(c,d,l):
	e=d.get('x-singular-content-sha256','');o=d.get('x-singular-operation-id','');n,s=F(c,l,int(d.get('content-length',0)),R)
	if s!=e:return J(400,{'error':'write','contentSha256':s})
	X[0]=1
	return J(200,{'operationId':o,'deviceId':D,'remotePath':R,'contentSha256':s})
def M(c,d,l):
	e=d.get('x-singular-content-sha256','');n,s=F(c,l,int(d.get('content-length',0)),'cyberbrick_ota_agent.py')
	if s!=e:return J(400,{'error':'write','contentSha256':s})
	X[0]=1
	return J(200,{'contentSha256':s})
def S():
	if not I():C()
	z=s.socket();z.setsockopt(s.SOL_SOCKET,s.SO_REUSEADDR,1);z.bind(('0.0.0.0',P));z.listen(1);Y[0]=2
	while 1:
		c,_=z.accept()
		try:
			r,d,l=H(c)
			if not K(d):T(c,J(401,{'error':'auth'}))
			elif r.startswith('GET /api/v1/health'):T(c,J(200,{'deviceId':D,'agentVersion':A,'protocolVersion':V,'appPath':R}))
			elif r.startswith('POST /api/v1/upload-agent'):T(c,M(c,d,l))
			elif r.startswith('POST /api/v1/upload'):T(c,U(c,d,l))
			else:T(c,J(404,{'error':'nf'}))
		except Exception as e:
			try:T(c,J(500,{'error':'agent-error','message':str(e)}))
			except:pass
		c.close()
		if X[0]:
			try:
				import time;time.sleep_ms(200)
			except:pass
			import machine;machine.reset()
def start_background(wait_for_wifi=True):
	ip=C() if wait_for_wifi else I()
	if Y[0]:return Z(ip)
	Y[0]=1
	try:
		import _thread;_thread.start_new_thread(S,())
		return Z(ip)
	except Exception as e:
		Y[0]=0
		return {'started':False,'error':str(e)}
if __name__ == '__main__':
	S()
`;
}

export function buildCyberBrickOtaAgentSource(config: CyberBrickOtaAgentConfig): string {
	return buildCyberBrickOtaAgentRuntimeSource(config);
}
