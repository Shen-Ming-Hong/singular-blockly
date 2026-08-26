ALTER TABLE feedback ADD COLUMN last_status_command_id INTEGER;

ALTER TABLE webhook_deliveries ADD COLUMN command_result_code TEXT;

ALTER TABLE webhook_deliveries ADD COLUMN command_acknowledged_at INTEGER;

CREATE INDEX idx_feedback_last_status_command
	ON feedback(last_status_command_id);
