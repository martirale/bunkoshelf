CREATE TABLE IF NOT EXISTS offline_sync_operations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_operation_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_operation_id)
);

CREATE INDEX IF NOT EXISTS offline_sync_operations_user_id_idx
  ON offline_sync_operations (user_id);
