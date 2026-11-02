-- Up

-- album_id is the catalog id ("dz-…", "mb-…" or a legacy iTunes number): no FK,
-- albums aren't stored.
CREATE TABLE IF NOT EXISTS watchlist (
  user_id    CHAR(36)    NOT NULL,
  album_id   VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id, album_id),
  CONSTRAINT watchlist_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_likes (
  review_id  CHAR(36)    NOT NULL,
  user_id    CHAR(36)    NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (review_id, user_id),
  KEY review_likes_user_idx (user_id),
  CONSTRAINT review_likes_review_fk FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The four albums pinned on a profile; position 1-4 (validated by the API).
CREATE TABLE IF NOT EXISTS profile_top (
  user_id  CHAR(36)    NOT NULL,
  position TINYINT     NOT NULL,
  album_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (user_id, position),
  UNIQUE KEY profile_top_album_uq (user_id, album_id),
  CONSTRAINT profile_top_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Down

DROP TABLE IF EXISTS profile_top;
DROP TABLE IF EXISTS review_likes;
DROP TABLE IF EXISTS watchlist;
