CREATE TABLE pending_attachment_uploads (
	r2_key TEXT PRIMARY KEY,
	created_at INTEGER NOT NULL
);

CREATE INDEX idx_pending_attachment_uploads_created
	ON pending_attachment_uploads(created_at);
