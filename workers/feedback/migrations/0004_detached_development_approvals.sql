CREATE TABLE development_approvals_v2 (
	approval_id TEXT PRIMARY KEY,
	feedback_id TEXT UNIQUE REFERENCES feedback(id) ON DELETE SET NULL,
	proposed_summary TEXT NOT NULL CHECK (length(proposed_summary) BETWEEN 20 AND 4000),
	approved_by TEXT NOT NULL,
	approved_at INTEGER NOT NULL,
	public_repo_id TEXT,
	public_issue_number INTEGER,
	link_severed_at INTEGER
);

INSERT INTO development_approvals_v2 (
	approval_id, feedback_id, proposed_summary, approved_by, approved_at,
	public_repo_id, public_issue_number, link_severed_at
)
SELECT
	feedback_id, feedback_id, proposed_summary, approved_by, approved_at,
	public_repo_id, public_issue_number, link_severed_at
FROM development_approvals;

DROP TABLE development_approvals;

ALTER TABLE development_approvals_v2 RENAME TO development_approvals;

CREATE UNIQUE INDEX idx_development_approvals_public_issue
	ON development_approvals(public_repo_id, public_issue_number)
	WHERE public_repo_id IS NOT NULL AND public_issue_number IS NOT NULL;
