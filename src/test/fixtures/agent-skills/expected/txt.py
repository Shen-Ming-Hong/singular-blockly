# === TXT Controller Python ===

import threading as _t, sys as _s
_t.excepthook = lambda a: None if _s.is_finalizing() else _t.__excepthook__(a)

# [1] Imports
import ftrobopy

# [3] Main Program
txt = ftrobopy.ftrobopy('auto')
