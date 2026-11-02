-- Up

-- MySQL 8 has no ADD COLUMN IF NOT EXISTS, so this ALTER is not re-runnable.
-- NULL means "no tags"; the API reads it back as an empty list.
ALTER TABLE reviews
  ADD COLUMN tags JSON NULL AFTER format_detail;

-- Down

ALTER TABLE reviews
  DROP COLUMN tags;
