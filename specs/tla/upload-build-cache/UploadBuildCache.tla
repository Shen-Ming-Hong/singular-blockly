--------------------------- MODULE UploadBuildCache ---------------------------
(***************************************************************************)
(* Fast re-upload build cache (spec 077) with the spec 078 fix.           *)
(*                                                                         *)
(* Source of truth:                                                        *)
(*   src/services/arduinoUploader.ts  upload() / runCompileAndUpload       *)
(*   src/services/arduinoBuildCache.ts computeInputs / canReuseBuild /     *)
(*                                     invalidateBuild / markBuilt         *)
(*   src/webview/messageHandler.ts     handleUpdateCode: while an upload   *)
(*                                     runs, only the latest update is     *)
(*                                     kept and written when it ends       *)
(*   media/js/blocklyEdit.js           debounced updateCode; the editor    *)
(*                                     stays editable during an upload     *)
(*                                                                         *)
(* A "code" is the content of src/main.cpp.  The model keeps only what     *)
(* matters for the cache: which code the editor shows, which code is on    *)
(* disk, which code the firmware on disk was compiled from, which code the *)
(* cache record is keyed by, and which code the board runs.                *)
(***************************************************************************)
EXTENDS Naturals

CONSTANTS
    Code,               \* possible contents of src/main.cpp, e.g. {1, 2}
    MaxEdits,           \* bound on editor changes so the state space is finite
    MaxExternal,        \* edits to src/ the extension cannot see (VS Code editor, git)
    DeferWrites,        \* spec 078 fix 1: hold editor writes while an upload runs
    RecheckBeforeMark   \* spec 078 fix 2: re-hash src/ before markBuilt

None == 0

VARIABLES
    screen,     \* code the Blockly editor currently shows
    disk,       \* code in src/main.cpp
    edits,      \* number of editor changes so far
    sent,       \* code of the last updateCode the editor sent
    pending,    \* deferred updateCode content (None = nothing held)
    external,   \* number of external edits so far
    pc,         \* uploader step
    req,        \* code the user clicked Upload with (request.code)
    fp,         \* code hashed by computeInputs (the buildKey)
    compiled,   \* code SCons read while building
    art,        \* code the firmware files on disk were built from
    recKey,     \* cache record build.key (None = no record)
    recArt,     \* firmware stamps saved in the record, as the code they belong to
    board,      \* code running on the board
    lastVia,    \* "none" | "build" | "reuse": how the last flash happened
    lastSrc     \* code computeInputs hashed for the last flash

vars == <<screen, disk, edits, sent, pending, external, pc, req, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

TypeOK ==
    /\ screen \in Code /\ disk \in Code
    /\ edits \in 0..MaxEdits /\ sent \in Code
    /\ pending \in Code \cup {None} /\ external \in 0..MaxExternal
    /\ pc \in {"idle", "fingerprint", "decide", "reuse", "invalidate", "scons", "link", "flash", "mark"}
    /\ req \in Code \cup {None} /\ fp \in Code \cup {None}
    /\ compiled \in Code \cup {None} /\ art \in Code \cup {None}
    /\ recKey \in Code \cup {None} /\ recArt \in Code \cup {None}
    /\ board \in Code \cup {None}
    /\ lastVia \in {"none", "build", "reuse"} /\ lastSrc \in Code \cup {None}

Init ==
    /\ screen = CHOOSE c \in Code : TRUE
    /\ disk = screen
    /\ edits = 0 /\ sent = screen /\ pending = None /\ external = 0
    /\ pc = "idle"
    /\ req = None /\ fp = None /\ compiled = None /\ art = None
    /\ recKey = None /\ recArt = None
    /\ board = None
    /\ lastVia = "none" /\ lastSrc = None

UploaderVars == <<pc, req, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

(***************************************************************************)
(* Editor: the student keeps dragging blocks during an upload.             *)
(***************************************************************************)
Edit ==
    /\ edits < MaxEdits
    /\ \E c \in Code \ {screen} : screen' = c
    /\ edits' = edits + 1
    /\ UNCHANGED <<disk, sent, pending, external>> /\ UNCHANGED UploaderVars

\* debounced updateCode -> handleUpdateCode: writes src/main.cpp, or holds it
\* while an upload runs (DeferWrites).
AutoSave ==
    /\ sent # screen
    /\ sent' = screen
    /\ IF DeferWrites /\ pc # "idle"
         THEN /\ pending' = screen /\ UNCHANGED disk
         ELSE /\ disk' = screen /\ UNCHANGED pending
    /\ UNCHANGED <<screen, edits, external>> /\ UNCHANGED UploaderVars

\* Someone changes src/main.cpp outside the Blockly editor.
ExternalEdit ==
    /\ external < MaxExternal
    /\ \E c \in Code \ {disk} : disk' = c
    /\ external' = external + 1
    /\ UNCHANGED <<screen, edits, sent, pending>> /\ UNCHANGED UploaderVars

\* When the upload ends, the held update is written (handleRequestUpload finally).
Flush(d) == IF pending # None THEN pending ELSE d

(***************************************************************************)
(* Uploader: one upload at a time (the webview disables the button).       *)
(***************************************************************************)
\* handleUploadClick sends request.code; upload() stage 2 saveCode(request.code)
Click ==
    /\ pc = "idle"
    /\ req' = screen
    /\ disk' = screen
    /\ pc' = "fingerprint"
    /\ UNCHANGED <<screen, edits, sent, pending, external, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* computeBuildInputs() -> buildCache.computeInputs(): hashes src/ as it is now
Fingerprint ==
    /\ pc = "fingerprint"
    /\ fp' = disk
    /\ pc' = "decide"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* findReuse(): canReuseBuild compares build.key and the firmware stamps
Decide ==
    /\ pc = "decide"
    /\ IF recKey = fp /\ recKey # None /\ recArt = art
         THEN pc' = "reuse"
         ELSE pc' = "invalidate"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* runPlatformio(true, port): pio run -t nobuild -t upload flashes the files on disk
ReuseFlash ==
    /\ pc = "reuse"
    /\ board' = art
    /\ lastVia' = "reuse" /\ lastSrc' = fp
    /\ pc' = "idle"
    /\ disk' = Flush(disk) /\ pending' = None
    /\ UNCHANGED <<screen, edits, sent, external, req, fp, compiled, art, recKey, recArt>>

\* buildCache.invalidateBuild() before a full build
Invalidate ==
    /\ pc = "invalidate"
    /\ recKey' = None /\ recArt' = None
    /\ pc' = "scons"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, fp, compiled, art, board, lastVia, lastSrc>>

\* pio run: about half a minute of dependency scan, then SCons reads src/main.cpp
SconsRead ==
    /\ pc = "scons"
    /\ compiled' = disk
    /\ pc' = "link"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, fp, art, recKey, recArt, board, lastVia, lastSrc>>

Link ==
    /\ pc = "link"
    /\ art' = compiled
    /\ pc' = "flash"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, fp, compiled, recKey, recArt, board, lastVia, lastSrc>>

Flash ==
    /\ pc = "flash"
    /\ board' = art
    /\ lastVia' = "build" /\ lastSrc' = fp
    /\ pc' = "mark"
    /\ UNCHANGED <<screen, disk, edits, sent, pending, external, req, fp, compiled, art, recKey, recArt>>

\* buildCache.markBuilt(fingerprint.inputs, ...) with the key computed before the
\* build; with RecheckBeforeMark only when src/ still hashes to that key.
MarkBuilt ==
    /\ pc = "mark"
    /\ IF ~RecheckBeforeMark \/ disk = fp
         THEN recKey' = fp /\ recArt' = art
         ELSE UNCHANGED <<recKey, recArt>>
    /\ pc' = "idle"
    /\ disk' = Flush(disk) /\ pending' = None
    /\ UNCHANGED <<screen, edits, sent, external, req, fp, compiled, art, board, lastVia, lastSrc>>

UploaderStep == Fingerprint \/ Decide \/ ReuseFlash \/ Invalidate \/ SconsRead \/ Link \/ Flash \/ MarkBuilt

Next == Edit \/ AutoSave \/ ExternalEdit \/ Click \/ UploaderStep

\* The student uploads again whenever the board does not run what the screen shows.
ClickStale == board # screen /\ Click

Spec ==
    /\ Init /\ [][Next]_vars
    /\ WF_vars(UploaderStep)
    /\ WF_vars(AutoSave)
    /\ WF_vars(ClickStale)

(***************************************************************************)
(* Properties                                                              *)
(***************************************************************************)

\* The firmware the cache record vouches for was built from the code it is keyed by.
RecordSound == recKey # None => recArt = recKey

\* "Uploading previous build (no changes)" flashes the code that is in src/ right now.
ReuseFlashesCurrentSource == lastVia = "reuse" => board = lastSrc

\* Once the student stops editing and keeps pressing Upload, the board ends up
\* running what the screen shows.
EventuallyConsistent == <>[](board = screen)

=============================================================================
