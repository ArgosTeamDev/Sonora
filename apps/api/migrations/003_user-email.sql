-- Up

-- Private: the public User shape never exposes it. Used for login and,
-- later, account recovery. Nullable because accounts created before this
-- migration have none (they keep signing in by username); a UNIQUE index
-- allows any number of NULLs.
ALTER TABLE users
  ADD COLUMN email VARCHAR(255) NULL AFTER username,
  ADD UNIQUE KEY users_email_uq (email);

-- Down

ALTER TABLE users
  DROP INDEX users_email_uq,
  DROP COLUMN email;
