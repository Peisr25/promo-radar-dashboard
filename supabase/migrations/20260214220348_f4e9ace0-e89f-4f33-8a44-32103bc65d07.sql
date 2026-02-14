ALTER TABLE evolution_config RENAME COLUMN instance_name TO session_name;
ALTER TABLE evolution_config ALTER COLUMN session_name SET DEFAULT 'default';