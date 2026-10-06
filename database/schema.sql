CREATE DATABASE IF NOT EXISTS FRAapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE FRAapp;

CREATE TABLE registrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_name VARCHAR(255) NOT NULL,
  founder_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX registrations_email_idx (email)
 ) ENGINE=InnoDB;

-- Scoring config (weights, option values, bands, gates) as seeded data, so a
-- weight change is a data edit, not a deployment. Seed with
-- `npm run seed:scoring` from database/seed/tier1-scoring-config.json.
CREATE TABLE IF NOT EXISTS fra_scoring_config (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tier TINYINT UNSIGNED NOT NULL,
  version VARCHAR(50) NOT NULL,
  config JSON NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY fra_scoring_config_version (tier, version)
) ENGINE=InnoDB;

-- Free audit (Tier 1): the "About your business" profile plus the computed
-- result. Scores are DECIMAL, never FLOAT (decision S7). overall_score is
-- server-only: it must never be sent to the browser or put in an email.
CREATE TABLE IF NOT EXISTS audit_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_name VARCHAR(255) NOT NULL,
  founder_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  category VARCHAR(100) NOT NULL,
  outlets VARCHAR(20) NOT NULL,
  city VARCHAR(255) NOT NULL,
  scoring_version VARCHAR(50) NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  range_low TINYINT UNSIGNED NOT NULL,
  range_high TINYINT UNSIGNED NOT NULL,
  -- Band codes (B1–B5): before gates, and after gates.
  score_band CHAR(2) NOT NULL,
  band CHAR(2) NOT NULL,
  gate ENUM('pass', 'capped', 'hard') NOT NULL,
  weakest_pillar CHAR(2) NULL,
  -- Set when the founder taps "I'm interested" in the paid report.
  report_interest_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX audit_submissions_email_idx (email)
) ENGINE=InnoDB;

-- One row per question. A skipped answer is NULL, never 0 (decision S6).
CREATE TABLE IF NOT EXISTS audit_answers (
  submission_id BIGINT UNSIGNED NOT NULL,
  question_code VARCHAR(10) NOT NULL,
  answer_label VARCHAR(255) NULL,
  answer_value TINYINT UNSIGNED NULL,
  PRIMARY KEY (submission_id, question_code),
  CONSTRAINT audit_answers_submission FOREIGN KEY (submission_id)
    REFERENCES audit_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Server-only, for analysis and calibration. Never shown at Tier 1 (decision R3).
CREATE TABLE IF NOT EXISTS audit_pillar_scores (
  submission_id BIGINT UNSIGNED NOT NULL,
  pillar_code CHAR(2) NOT NULL,
  score DECIMAL(5,2) NULL,
  status ENUM('Good', 'Average', 'Weak') NULL,
  PRIMARY KEY (submission_id, pillar_code),
  CONSTRAINT audit_pillar_scores_submission FOREIGN KEY (submission_id)
    REFERENCES audit_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;