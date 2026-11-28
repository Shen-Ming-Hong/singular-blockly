------------------------- MODULE CyberBrickOtaUpload -------------------------
(***************************************************************************)
(* CyberBrick Wi-Fi (OTA) upload of /app/rc_main.py as it works today.     *)
(*                                                                         *)
(* Source of truth:                                                        *)
(*   src/services/cyberbrickOtaUploader.ts                                 *)
(*     upload(): direct attempt with a 2 s window, then reopenUploadWindow *)
(*       (POST /reset + health) and a second attempt with a 30 s window    *)
(*     withTimeout(): Promise.race; the fetch is NOT aborted on timeout    *)
(*     tryRecoverFromUploadTimeout(): after a final timeout, a health      *)
(*       reply from the same deviceId is reported as "OTA upload complete" *)
(*   src/services/cyberbrickOtaAgentSource.ts (device side)                *)
(*     F(): open(R,'wb') on /app/rc_main.py itself, streams the body into  *)
(*       it and always close()s, so a short body leaves a cut file behind  *)
(*     U(): 200 + machine.reset() only when the SHA-256 matches            *)
(*     S(): one connection at a time; boot.py imports rc_main, and the     *)
(*       OTA agent itself is started from the bootstrap inside rc_main.py  *)
(*                                                                         *)
(* flash   = committed /app/rc_main.py: "old", "new" or "torn" (cut).     *)
(* running = what the board runs now; "none" means boot failed (a torn     *)
(*           Python file does not compile), so the OTA agent is gone too.  *)
(***************************************************************************)
EXTENDS Naturals

CONSTANTS
    MaxFaults,      \* Wi-Fi drops / resets that cut a request body
    MaxPowerCycles  \* times the student switches the board off and on

Attempts == {1, 2}

VARIABLES
    flash, running,
    cpc,            \* client step
    ui,             \* what the editor shows: "idle" | "busy" | "success" | "failed"
    body,           \* per attempt: "none" | "sending" | "full" | "cut"
    srv,            \* per attempt, agent side: "waiting" | "receiving" | "done" | "dropped"
    resp,           \* per attempt, what reached the client: "none" | "ok" | "bad" | "err" | "conn"
    active,         \* attempt the agent is handling (0 = none)
    pendingReset,   \* agent wrote a good file and will machine.reset()
    faults, powerCycles

vars == <<flash, running, cpc, ui, body, srv, resp, active, pendingReset, faults, powerCycles>>

Boot(f) == IF f = "torn" THEN "none" ELSE f
AgentUp == running # "none"

TypeOK ==
    /\ flash \in {"old", "new", "torn"}
    /\ running \in {"old", "new", "none"}
    /\ cpc \in {"idle", "a1", "reopen", "a2", "recover", "done"}
    /\ ui \in {"idle", "busy", "success", "failed"}
    /\ body \in [Attempts -> {"none", "sending", "full", "cut"}]
    /\ srv \in [Attempts -> {"waiting", "receiving", "done", "dropped"}]
    /\ resp \in [Attempts -> {"none", "ok", "bad", "err", "conn"}]
    /\ active \in {0} \cup Attempts
    /\ pendingReset \in BOOLEAN
    /\ faults \in 0..MaxFaults /\ powerCycles \in 0..MaxPowerCycles

Init ==
    /\ flash = "old" /\ running = "old"
    /\ cpc = "idle" /\ ui = "idle"
    /\ body = [i \in Attempts |-> "none"]
    /\ srv = [i \in Attempts |-> "waiting"]
    /\ resp = [i \in Attempts |-> "none"]
    /\ active = 0 /\ pendingReset = FALSE
    /\ faults = 0 /\ powerCycles = 0

\* Every live connection is dropped when the board resets. A write that has not
\* reached close() is lost and the old file stays (LittleFS; see README).
ResetBoard ==
    /\ running' = Boot(flash)
    /\ active' = 0
    /\ pendingReset' = FALSE
    /\ srv' = [i \in Attempts |-> IF srv[i] = "receiving" THEN "dropped" ELSE srv[i]]
    /\ body' = [i \in Attempts |-> IF body[i] = "sending" THEN "cut" ELSE body[i]]
    /\ resp' = [i \in Attempts |->
                  IF resp[i] = "none" /\ body[i] # "none" /\ srv[i] # "done" THEN "conn" ELSE resp[i]]

(***************************************************************************)
(* Client (Extension Host)                                                 *)
(***************************************************************************)
Start ==
    /\ cpc = "idle"
    /\ cpc' = "a1" /\ ui' = "busy"
    /\ body' = [body EXCEPT ![1] = "sending"]
    /\ UNCHANGED <<flash, running, srv, resp, active, pendingReset, faults, powerCycles>>

A1Ok ==
    /\ cpc = "a1" /\ resp[1] = "ok"
    /\ cpc' = "done" /\ ui' = "success"
    /\ UNCHANGED <<flash, running, body, srv, resp, active, pendingReset, faults, powerCycles>>

A1Bad ==
    /\ cpc = "a1" /\ resp[1] = "bad"
    /\ cpc' = "done" /\ ui' = "failed"
    /\ UNCHANGED <<flash, running, body, srv, resp, active, pendingReset, faults, powerCycles>>

\* 5xx, connection error, or the 2 s window ran out (the fetch keeps going).
A1Retry ==
    /\ cpc = "a1" /\ resp[1] \in {"none", "err", "conn"}
    /\ cpc' = "reopen"
    /\ UNCHANGED <<flash, running, ui, body, srv, resp, active, pendingReset, faults, powerCycles>>

\* reopenUploadWindow(): POST /reset may or may not reset the board, then the second attempt.
ReopenWithReset ==
    /\ cpc = "reopen" /\ AgentUp
    /\ cpc' = "a2"
    /\ running' = Boot(flash)
    /\ active' = 0 /\ pendingReset' = FALSE
    /\ srv' = [i \in Attempts |-> IF srv[i] = "receiving" THEN "dropped" ELSE srv[i]]
    /\ body' = [i \in Attempts |-> IF i = 2 THEN "sending" ELSE IF body[i] = "sending" THEN "cut" ELSE body[i]]
    /\ resp' = resp
    /\ UNCHANGED <<flash, ui, faults, powerCycles>>

ReopenNoReset ==
    /\ cpc = "reopen"
    /\ cpc' = "a2"
    /\ body' = [body EXCEPT ![2] = "sending"]
    /\ UNCHANGED <<flash, running, ui, srv, resp, active, pendingReset, faults, powerCycles>>

A2Result ==
    /\ cpc = "a2" /\ resp[2] # "none"
    /\ cpc' = "done"
    /\ ui' = IF resp[2] = "ok" THEN "success" ELSE "failed"
    /\ UNCHANGED <<flash, running, body, srv, resp, active, pendingReset, faults, powerCycles>>

\* 30 s window ran out: go to tryRecoverFromUploadTimeout().
A2Timeout ==
    /\ cpc = "a2" /\ resp[2] = "none"
    /\ cpc' = "recover"
    /\ UNCHANGED <<flash, running, ui, body, srv, resp, active, pendingReset, faults, powerCycles>>

\* Wait 5 s, then GET /health. The agent serves one connection at a time, so it
\* answers only when it is up and not busy with an upload. A reply from the same
\* deviceId counts as success; nothing checks what rc_main.py now holds.
Recover ==
    /\ cpc = "recover"
    /\ cpc' = "done"
    /\ ui' = IF AgentUp /\ active = 0 THEN "success" ELSE "failed"
    /\ UNCHANGED <<flash, running, body, srv, resp, active, pendingReset, faults, powerCycles>>

Client == Start \/ A1Ok \/ A1Bad \/ A1Retry \/ ReopenWithReset \/ ReopenNoReset
          \/ A2Result \/ A2Timeout \/ Recover

(***************************************************************************)
(* Agent (MicroPython thread on the board)                                 *)
(***************************************************************************)
\* accept(); a request cut before accept never opens the file.
Accept(i) ==
    /\ AgentUp /\ active = 0 /\ ~pendingReset
    /\ srv[i] = "waiting" /\ body[i] # "none"
    /\ IF body[i] = "cut"
         THEN /\ srv' = [srv EXCEPT ![i] = "dropped"]
              /\ resp' = [resp EXCEPT ![i] = IF resp[i] = "none" THEN "conn" ELSE resp[i]]
              /\ UNCHANGED <<flash, active>>
         ELSE /\ srv' = [srv EXCEPT ![i] = "receiving"]
              /\ active' = i
              /\ UNCHANGED <<flash, resp>>  \* open(R, 'wb'); LittleFS commits on close()
    /\ UNCHANGED <<running, cpc, ui, body, pendingReset, faults, powerCycles>>

\* recv loop ends and `finally: f.close()` commits what was written:
\* full body -> hash ok -> 200 and reset; short body -> rc_main.py is now cut short.
Finish(i) ==
    /\ active = i /\ srv[i] = "receiving" /\ body[i] \in {"full", "cut"}
    /\ srv' = [srv EXCEPT ![i] = "done"]
    /\ active' = 0
    /\ IF body[i] = "full"
         THEN /\ flash' = "new"
              /\ pendingReset' = TRUE
              /\ resp' = [resp EXCEPT ![i] = IF resp[i] = "none" THEN "ok" ELSE resp[i]]
         ELSE /\ flash' = "torn"
              /\ UNCHANGED pendingReset
              /\ resp' = [resp EXCEPT ![i] = IF resp[i] = "none" THEN "conn" ELSE resp[i]]
    /\ UNCHANGED <<running, cpc, ui, body, faults, powerCycles>>

\* time.sleep_ms(200); machine.reset()
AgentReset ==
    /\ pendingReset /\ active = 0
    /\ ResetBoard
    /\ UNCHANGED <<flash, cpc, ui, faults, powerCycles>>

Agent == (\E i \in Attempts : Accept(i) \/ Finish(i)) \/ AgentReset

(***************************************************************************)
(* Network and the student                                                 *)
(***************************************************************************)
Deliver(i) ==
    /\ body[i] = "sending"
    /\ body' = [body EXCEPT ![i] = "full"]
    /\ UNCHANGED <<flash, running, cpc, ui, srv, resp, active, pendingReset, faults, powerCycles>>

Cut(i) ==
    /\ body[i] = "sending" /\ faults < MaxFaults
    /\ body' = [body EXCEPT ![i] = "cut"]
    /\ resp' = [resp EXCEPT ![i] = IF resp[i] = "none" THEN "conn" ELSE resp[i]]
    /\ faults' = faults + 1
    /\ UNCHANGED <<flash, running, cpc, ui, srv, active, pendingReset, powerCycles>>

PowerCycle ==
    /\ cpc = "done" /\ powerCycles < MaxPowerCycles
    /\ ResetBoard
    /\ powerCycles' = powerCycles + 1
    /\ UNCHANGED <<flash, cpc, ui, faults>>

Network == \E i \in Attempts : Deliver(i)

Next == Client \/ Agent \/ Network \/ (\E i \in Attempts : Cut(i)) \/ PowerCycle

Spec ==
    /\ Init /\ [][Next]_vars
    /\ WF_vars(Client) /\ WF_vars(Agent) /\ WF_vars(Network)

(***************************************************************************)
(* Properties                                                              *)
(***************************************************************************)

\* rc_main.py is always a whole program (the old one or the new one).
NoTornFile == flash # "torn"

\* "OTA upload complete" means the new program is what the board will boot.
SuccessMeansNewProgram == ui = "success" => flash = "new"

\* Never report success while rc_main.py is cut short.
SuccessNeverOnTornFile == ui = "success" => flash # "torn"

\* "Upload failed" must not leave a board that can no longer boot (or be reached over Wi-Fi).
FailureKeepsBoardBootable == ui = "failed" => Boot(flash) # "none"

\* Every upload ends with a result.
UploadEnds == <>(cpc = "done")

\* In the end, what the editor said matches what the board boots.
Consistent ==
    /\ ui = "success" => Boot(flash) = "new"
    /\ ui = "failed"  => Boot(flash) # "none"
EventuallyConsistent == <>[](cpc = "done" /\ Consistent)

=============================================================================
