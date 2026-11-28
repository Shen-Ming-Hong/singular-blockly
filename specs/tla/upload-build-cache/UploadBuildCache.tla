--------------------------- MODULE UploadBuildCache ---------------------------
(***************************************************************************)
(* Fast re-upload build cache (spec 077) as it works today.                *)
(*                                                                         *)
(* Source of truth:                                                        *)
(*   src/services/arduinoUploader.ts  upload() / runCompileAndUpload       *)
(*   src/services/arduinoBuildCache.ts computeInputs / canReuseBuild /     *)
(*                                     invalidateBuild / markBuilt         *)
(*   src/webview/messageHandler.ts     handleUpdateCode (auto-save of      *)
(*                                     src/main.cpp, not serialized with   *)
(*                                     the upload)                         *)
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
    Code,       \* possible contents of src/main.cpp, e.g. {1, 2}
    MaxEdits    \* bound on editor changes so the state space is finite

None == 0

VARIABLES
    screen,     \* code the Blockly editor currently shows
    disk,       \* code in src/main.cpp
    edits,      \* number of editor changes so far
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

vars == <<screen, disk, edits, pc, req, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

TypeOK ==
    /\ screen \in Code /\ disk \in Code
    /\ edits \in 0..MaxEdits
    /\ pc \in {"idle", "fingerprint", "decide", "reuse", "invalidate", "scons", "link", "flash", "mark"}
    /\ req \in Code \cup {None} /\ fp \in Code \cup {None}
    /\ compiled \in Code \cup {None} /\ art \in Code \cup {None}
    /\ recKey \in Code \cup {None} /\ recArt \in Code \cup {None}
    /\ board \in Code \cup {None}
    /\ lastVia \in {"none", "build", "reuse"} /\ lastSrc \in Code \cup {None}

Init ==
    /\ screen = CHOOSE c \in Code : TRUE
    /\ disk = screen
    /\ edits = 0
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
    /\ UNCHANGED <<disk>> /\ UNCHANGED UploaderVars

\* debounced updateCode -> handleUpdateCode -> fileService.writeFile('src/main.cpp')
AutoSave ==
    /\ disk # screen
    /\ disk' = screen
    /\ UNCHANGED <<screen, edits>> /\ UNCHANGED UploaderVars

(***************************************************************************)
(* Uploader: one upload at a time (the webview disables the button).       *)
(***************************************************************************)
\* handleUploadClick sends request.code; upload() stage 2 saveCode(request.code)
Click ==
    /\ pc = "idle"
    /\ req' = screen
    /\ disk' = screen
    /\ pc' = "fingerprint"
    /\ UNCHANGED <<screen, edits, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* computeBuildInputs() -> buildCache.computeInputs(): hashes src/ as it is now
Fingerprint ==
    /\ pc = "fingerprint"
    /\ fp' = disk
    /\ pc' = "decide"
    /\ UNCHANGED <<screen, disk, edits, req, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* findReuse(): canReuseBuild compares build.key and the firmware stamps
Decide ==
    /\ pc = "decide"
    /\ IF recKey = fp /\ recKey # None /\ recArt = art
         THEN pc' = "reuse"
         ELSE pc' = "invalidate"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, art, recKey, recArt, board, lastVia, lastSrc>>

\* runPlatformio(true, port): pio run -t nobuild -t upload flashes the files on disk
ReuseFlash ==
    /\ pc = "reuse"
    /\ board' = art
    /\ lastVia' = "reuse" /\ lastSrc' = fp
    /\ pc' = "idle"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, art, recKey, recArt>>

\* buildCache.invalidateBuild() before a full build
Invalidate ==
    /\ pc = "invalidate"
    /\ recKey' = None /\ recArt' = None
    /\ pc' = "scons"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, art, board, lastVia, lastSrc>>

\* pio run: about half a minute of dependency scan, then SCons reads src/main.cpp
SconsRead ==
    /\ pc = "scons"
    /\ compiled' = disk
    /\ pc' = "link"
    /\ UNCHANGED <<screen, disk, edits, req, fp, art, recKey, recArt, board, lastVia, lastSrc>>

Link ==
    /\ pc = "link"
    /\ art' = compiled
    /\ pc' = "flash"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, recKey, recArt, board, lastVia, lastSrc>>

Flash ==
    /\ pc = "flash"
    /\ board' = art
    /\ lastVia' = "build" /\ lastSrc' = fp
    /\ pc' = "mark"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, art, recKey, recArt>>

\* buildCache.markBuilt(fingerprint.inputs, ...): the key computed BEFORE the build
MarkBuilt ==
    /\ pc = "mark"
    /\ recKey' = fp /\ recArt' = art
    /\ pc' = "idle"
    /\ UNCHANGED <<screen, disk, edits, req, fp, compiled, art, board, lastVia, lastSrc>>

UploaderStep == Fingerprint \/ Decide \/ ReuseFlash \/ Invalidate \/ SconsRead \/ Link \/ Flash \/ MarkBuilt

Next == Edit \/ AutoSave \/ Click \/ UploaderStep

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
