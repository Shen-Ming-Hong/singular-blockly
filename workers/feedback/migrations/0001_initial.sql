PRAGMA foreign_keys = ON;

CREATE TABLE reporters (
	id TEXT PRIMARY KEY,
	secret_hmac TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL,
	last_seen_at INTEGER NOT NULL,
	revoked_at INTEGER
);

CREATE INDEX idx_reporters_revoked_at ON reporters(revoked_at);

CREATE TABLE feedback (
	id TEXT PRIMARY KEY,
	public_reference TEXT NOT NULL UNIQUE,
	reporter_id TEXT NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK (kind IN ('bug', 'feature', 'question', 'other')),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 120),
	description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 8000),
	steps TEXT CHECK (steps IS NULL OR length(steps) <= 4000),
	expected TEXT CHECK (expected IS NULL OR length(expected) <= 2000),
	diagnostics_json TEXT NOT NULL DEFAULT '{}',
	public_status TEXT NOT NULL DEFAULT 'received' CHECK (public_status IN ('received', 'triaging', 'needs-info', 'planned', 'in-progress', 'resolved', 'closed')),
	decision TEXT NOT NULL DEFAULT 'unreviewed' CHECK (decision IN ('unreviewed', 'actionable', 'not-actionable')),
	resolution TEXT CHECK (resolution IS NULL OR resolution IN ('duplicate', 'not-product', 'unsupported', 'out-of-scope', 'cannot-reproduce', 'insufficient-info', 'spam')),
	public_reason TEXT CHECK (public_reason IS NULL OR length(public_reason) BETWEEN 20 AND 2000),
	delete_state TEXT NOT NULL DEFAULT 'active' CHECK (delete_state IN ('active', 'delete-pending')),
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	CHECK (
		(decision = 'not-actionable' AND resolution IS NOT NULL AND public_reason IS NOT NULL)
		OR (decision <> 'not-actionable' AND resolution IS NULL)
	)
);

CREATE INDEX idx_feedback_reporter_created ON feedback(reporter_id, created_at DESC);
CREATE INDEX idx_feedback_decision_created ON feedback(decision, created_at);
CREATE INDEX idx_feedback_status_updated ON feedback(public_status, updated_at);
CREATE INDEX idx_feedback_kind ON feedback(kind);

CREATE TABLE attachments (
	id TEXT PRIMARY KEY,
	feedback_id TEXT NOT NULL UNIQUE REFERENCES feedback(id) ON DELETE CASCADE,
	r2_key TEXT NOT NULL UNIQUE,
	media_type TEXT NOT NULL CHECK (media_type IN ('image/png', 'image/jpeg')),
	size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 3145728),
	width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 1920),
	height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 1920),
	sha256 TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE feedback_messages (
	id TEXT PRIMARY KEY,
	feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
	author_type TEXT NOT NULL CHECK (author_type IN ('reporter', 'maintainer')),
	visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility = 'public'),
	body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
	github_comment_id INTEGER UNIQUE,
	created_at INTEGER NOT NULL
);

CREATE INDEX idx_feedback_messages_feedback_created ON feedback_messages(feedback_id, created_at);

CREATE TABLE triage_assessments (
	id TEXT PRIMARY KEY,
	feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
	source TEXT NOT NULL CHECK (source IN ('agent', 'maintainer')),
	kind_suggestion TEXT CHECK (kind_suggestion IS NULL OR kind_suggestion IN ('bug', 'feature', 'question', 'other')),
	area TEXT,
	impact TEXT CHECK (impact IS NULL OR impact IN ('low', 'medium', 'high', 'critical')),
	recommendation TEXT CHECK (recommendation IS NULL OR recommendation IN ('investigate', 'duplicate', 'plan', 'decline', 'ask-info')),
	duplicate_feedback_id TEXT REFERENCES feedback(id) ON DELETE SET NULL,
	rationale TEXT NOT NULL CHECK (length(rationale) BETWEEN 1 AND 2000),
	created_at INTEGER NOT NULL,
	CHECK (duplicate_feedback_id IS NULL OR duplicate_feedback_id <> feedback_id)
);

CREATE TABLE development_approvals (
	feedback_id TEXT PRIMARY KEY REFERENCES feedback(id) ON DELETE CASCADE,
	proposed_summary TEXT NOT NULL CHECK (length(proposed_summary) BETWEEN 20 AND 4000),
	approved_by TEXT NOT NULL,
	approved_at INTEGER NOT NULL,
	public_repo_id TEXT,
	public_issue_number INTEGER,
	link_severed_at INTEGER
);

CREATE TABLE sessions (
	id_hmac TEXT PRIMARY KEY,
	reporter_id TEXT NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
	csrf_hmac TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL,
	revoked_at INTEGER,
	CHECK (expires_at > created_at AND expires_at <= created_at + 86400)
);

CREATE INDEX idx_sessions_reporter ON sessions(reporter_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE idempotency_records (
	reporter_id TEXT NOT NULL REFERENCES reporters(id) ON DELETE CASCADE,
	route TEXT NOT NULL,
	key TEXT NOT NULL,
	request_sha256 TEXT NOT NULL,
	response_status INTEGER NOT NULL,
	response_json TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL,
	PRIMARY KEY (reporter_id, route, key)
);

CREATE INDEX idx_idempotency_expires ON idempotency_records(expires_at);

CREATE TABLE github_mappings (
	feedback_id TEXT PRIMARY KEY REFERENCES feedback(id) ON DELETE CASCADE,
	repository_id TEXT NOT NULL,
	issue_number INTEGER NOT NULL UNIQUE,
	issue_node_id TEXT NOT NULL,
	last_synced_at INTEGER NOT NULL
);

CREATE TABLE outbox_events (
	id TEXT PRIMARY KEY,
	aggregate_type TEXT NOT NULL CHECK (aggregate_type IN ('feedback', 'message', 'tombstone')),
	aggregate_id TEXT NOT NULL,
	event_type TEXT NOT NULL CHECK (event_type IN ('create', 'update', 'public-message', 'delete', 'create-public-issue')),
	payload_json TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'dead')),
	attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
	next_attempt_at INTEGER NOT NULL,
	last_error_code TEXT,
	created_at INTEGER NOT NULL,
	completed_at INTEGER
);

CREATE INDEX idx_outbox_claim ON outbox_events(status, next_attempt_at);
CREATE INDEX idx_outbox_completed ON outbox_events(completed_at);

CREATE TABLE webhook_deliveries (
	delivery_id TEXT PRIMARY KEY,
	event_name TEXT NOT NULL CHECK (event_name IN ('issues', 'issue_comment', 'ping')),
	repository_id TEXT NOT NULL,
	payload_sha256 TEXT NOT NULL,
	processed_at INTEGER NOT NULL
);

CREATE INDEX idx_webhook_deliveries_processed ON webhook_deliveries(processed_at);

CREATE TABLE feedback_tombstones (
	public_reference_hash TEXT PRIMARY KEY,
	private_issue_number INTEGER,
	delete_state TEXT NOT NULL CHECK (delete_state IN ('pending', 'scrubbed')),
	deleted_at INTEGER NOT NULL
);

CREATE TABLE audit_events (
	id TEXT PRIMARY KEY,
	event_code TEXT NOT NULL,
	target_hash TEXT,
	outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'error')),
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_events_expires ON audit_events(expires_at);
