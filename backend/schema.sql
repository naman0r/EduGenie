-- Recreating the table with new fields
CREATE TABLE users (
    google_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    last_logged_in TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),

    -- New EduGenie specific fields
    academic_year INT,                         -- e.g., 1, 2, 3, 4 or 2024, 2025 etc. - null allows flexibility
    academic_level VARCHAR(50),                -- e.g., 'High School', 'Undergraduate', 'Graduate', 'Postgraduate' - Allow NULL initially
    institution VARCHAR(255),                  -- Name of the school/university - Allow NULL initially
    plan_type VARCHAR(50) DEFAULT 'basic' NOT NULL -- 'basic' or 'premium' later on
);

-- Add columns for Google Calendar OAuth Tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;

COMMENT ON COLUMN users.google_refresh_token IS 'Encrypted Google OAuth refresh token for Calendar access';
COMMENT ON COLUMN users.google_access_token IS 'Temporary Google OAuth access token';
COMMENT ON COLUMN users.google_token_expiry IS 'Expiry time for the Google access token';

-- Table to store user classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique ID for each class entry
    user_id VARCHAR NOT NULL REFERENCES users(google_id) ON DELETE CASCADE, -- Link to the user who owns the class
    name TEXT NOT NULL,                  -- Name of the class (e.g., "Introduction to AI")
    code VARCHAR(50),                    -- Course code (e.g., "CS 101"), optional
    instructor VARCHAR(255),             -- Instructor's name, optional
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) -- When the class was added
);

-- Optional: Index for faster lookups by user
CREATE INDEX idx_classes_user_id ON classes(user_id);

-- Optional: Comments for clarity
COMMENT ON TABLE classes IS 'Stores information about the classes users are enrolled in.';
COMMENT ON COLUMN classes.user_id IS 'Foreign key referencing the google_id in the users table.';
COMMENT ON COLUMN classes.name IS 'The display name of the course.';
COMMENT ON COLUMN classes.code IS 'Optional course code (e.g., MATH201).';
COMMENT ON COLUMN classes.instructor IS 'Optional name of the course instructor.';