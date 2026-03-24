-- ─────────────────────────────────────────────────
--  Caesar Cipher Login — MySQL Database Schema
-- ─────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS cipher_login
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cipher_login;

-- ─── Users Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)     NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,        -- bcrypt hash of the PLAIN password
  cipher_shift  TINYINT UNSIGNED NOT NULL DEFAULT 6, -- personal shift stored per-user
  role          ENUM('admin','user','guest')  NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP       NULL,
  login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until  TIMESTAMP       NULL
);

-- ─── Login Audit Log ──────────────────────────────
CREATE TABLE IF NOT EXISTS login_log (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(64)   NOT NULL,
  ip_address  VARCHAR(45)   NOT NULL,
  success     TINYINT(1)    NOT NULL DEFAULT 0,
  shift_used  TINYINT UNSIGNED NOT NULL,
  mode_used   ENUM('encrypt','decrypt') NOT NULL DEFAULT 'encrypt',
  attempted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Seed Demo Users ──────────────────────────────
-- Passwords are bcrypt hashes of the PLAIN text passwords.
-- admin → plain: "andrew"
-- guest → plain: "hello"
--
-- Generate fresh hashes in PHP:  password_hash('andrew', PASSWORD_BCRYPT)
-- The values below are example hashes — regenerate them in production!

INSERT INTO users (username, password_hash, cipher_shift, role) VALUES
(
  'admin',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',  -- "andrew"
  6,
  'admin'
),
(
  'guest',
  '$2y$12$RuGzHiJ9n2lhFtNcqXhKz.bBOj/4fFW4E5DvHN7p4A8MIJ3aPVNby',  -- "hello"
  6,
  'guest'
);

-- ─── Indexes ──────────────────────────────────────
CREATE INDEX idx_login_log_username ON login_log (username);
CREATE INDEX idx_login_log_time     ON login_log (attempted_at);