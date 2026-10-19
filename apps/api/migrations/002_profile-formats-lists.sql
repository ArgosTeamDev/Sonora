-- Up

-- MySQL 8 has no ADD COLUMN IF NOT EXISTS, so the ALTERs are not re-runnable:
-- if this file fails halfway, check `status` and revert by hand before retrying.
ALTER TABLE users
  ADD COLUMN location       VARCHAR(80) NULL AFTER avatar_url,
  ADD COLUMN badge          VARCHAR(24) NULL AFTER location,
  ADD COLUMN is_pro_curator TINYINT(1)  NOT NULL DEFAULT 0 AFTER badge;

ALTER TABLE reviews
  ADD COLUMN format        VARCHAR(16) NULL AFTER is_relisten,
  ADD COLUMN format_detail VARCHAR(32) NULL AFTER format,
  ADD CONSTRAINT reviews_format_ck CHECK (format IS NULL OR format IN ('vinyl', 'cassette', 'cd', 'digital', 'hi-res'));

CREATE TABLE IF NOT EXISTS lists (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  name        VARCHAR(80)  NOT NULL,
  description VARCHAR(300) NULL,
  created_at  DATETIME(3)  NOT NULL,
  KEY lists_user_idx (user_id, created_at),
  CONSTRAINT lists_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- album_id is the iTunes/Deezer catalog id (no FK: albums aren't stored).
CREATE TABLE IF NOT EXISTS list_items (
  list_id    CHAR(36)    NOT NULL,
  album_id   VARCHAR(64) NOT NULL,
  position   INT         NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (list_id, album_id),
  KEY list_items_order_idx (list_id, position),
  CONSTRAINT list_items_list_fk FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Down

DROP TABLE IF EXISTS list_items;
DROP TABLE IF EXISTS lists;

ALTER TABLE reviews
  DROP CONSTRAINT reviews_format_ck,
  DROP COLUMN format_detail,
  DROP COLUMN format;

ALTER TABLE users
  DROP COLUMN is_pro_curator,
  DROP COLUMN badge,
  DROP COLUMN location;
