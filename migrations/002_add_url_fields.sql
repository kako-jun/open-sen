-- Migration: Add URL and description fields
-- Run with: npx wrangler d1 execute open-sen-db --remote --file=migrations/002_add_url_fields.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  bio TEXT,
  url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Add description and url to projects table
ALTER TABLE projects ADD COLUMN description TEXT;
ALTER TABLE projects ADD COLUMN url TEXT;
