-- PostgreSQL Database Initialization Script for Photo Gallery Library
-- Character set and timezone
SET client_encoding = 'UTF8';
SET timezone = 'Asia/Ho_Chi_Minh';

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notice: Table schemas are managed by SQLAlchemy (db.create_all()), 
-- but this script ensures the database is prepped with proper permissions and indexing.

CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_public ON photos (is_public);
