-- Up

-- IF NOT EXISTS so a database created by hand adopts this migration cleanly.
-- Timestamps are DATETIME(3) in UTC. Ids are CHAR(36) UUIDs; album_id is the
-- iTunes collectionId (no FK: albums aren't stored).
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  bio           TEXT NULL,
  avatar_url    VARCHAR(2048) NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME(3)  NOT NULL,
  version       INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS album_overlays (
  id                    VARCHAR(64) NOT NULL PRIMARY KEY,
  is_album_of_the_month TINYINT(1)  NOT NULL DEFAULT 0,
  editorial_note        TEXT NULL,
  created_at            DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id          CHAR(36)    NOT NULL PRIMARY KEY,
  user_id     CHAR(36)    NOT NULL,
  album_id    VARCHAR(64) NOT NULL,
  rating      DECIMAL(2,1) NOT NULL,
  `text`      TEXT NULL,
  is_relisten TINYINT(1)  NOT NULL DEFAULT 0,
  listened_at DATETIME(3) NOT NULL,
  version     INT         NOT NULL DEFAULT 1,
  created_at  DATETIME(3) NOT NULL,
  updated_at  DATETIME(3) NOT NULL,
  UNIQUE KEY reviews_user_album_uq (user_id, album_id),
  KEY reviews_album_idx (album_id),
  KEY reviews_user_recent_idx (user_id, created_at),
  CONSTRAINT reviews_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_ck CHECK (rating >= 0.5 AND rating <= 5 AND rating * 2 = FLOOR(rating * 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No CHECK (follower_id <> following_id): MySQL forbids CHECKs on columns that
-- have an FK with ON DELETE CASCADE. The API validates it (FollowSchema).
CREATE TABLE IF NOT EXISTS follows (
  follower_id  CHAR(36)    NOT NULL,
  following_id CHAR(36)    NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_follower_fk  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT follows_following_fk FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
  user_id    CHAR(36)    NOT NULL,
  album_id   VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id, album_id),
  CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Down

DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS album_overlays;
DROP TABLE IF EXISTS users;
