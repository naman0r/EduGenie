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





-- RESOURCES TABLE: 

-- Table to store user-generated resources linked to classes
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique ID for the resource
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE, -- Link to the class
    user_id VARCHAR NOT NULL REFERENCES users(google_id) ON DELETE CASCADE, -- Link to the user who created it
    type TEXT NOT NULL CHECK (type IN ('flashcards', 'Mindmap', 'Text notes')), -- Type of resource
    name TEXT NOT NULL, -- User-defined name for the resource
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()), -- When the resource was created
    -- updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()), -- No updated_at in schema style, add if needed
    content JSONB -- Content of the resource (structure depends on type)
);

-- Optional: Indexes for faster lookups
CREATE INDEX idx_resources_class_id ON resources(class_id);
CREATE INDEX idx_resources_user_id ON resources(user_id);

-- Optional: Comments for clarity
COMMENT ON TABLE resources IS 'Stores user-generated resources like notes, mind maps, and flashcards linked to classes.';
COMMENT ON COLUMN resources.class_id IS 'Foreign key referencing the id in the classes table.';
COMMENT ON COLUMN resources.user_id IS 'Foreign key referencing the google_id in the users table.';
COMMENT ON COLUMN resources.type IS 'Type of the resource (flashcards, Mindmap, Text notes).';
COMMENT ON COLUMN resources.content IS 'JSONB content of the resource, structure depends on the type.';

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- table for canvas infrastructure attempt: 
-- essentially just adding two tables to the existing schema; 
alter table public.users
add column canvas_access_token text,
add column canvas_domain       varchar;           -- e.g. "northeastern.infrastructure.com"


-- needed for canvas infrastructure attempt this is SO FUSSY
ALTER TABLE public.classes
ADD COLUMN canvas_course_id INT8; -- Or use TEXT if Canvas IDs might not always be numbers

COMMENT ON COLUMN public.classes.canvas_course_id IS 'The unique identifier for the course from the Canvas LMS API.';