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
    credits INT DEFAULT 0; -- Number of credits the user has
);

-- Add columns for Google Calendar OAuth Tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;


-- Add credits column to users table
ALTER TABLE users
ADD COLUMN credits INT DEFAULT 20; -- default 20 credits when the user starts. 

COMMENT ON COLUMN users.credits IS 'Number of credits the user has for interacting with generative AI features.';

COMMENT ON COLUMN users.google_refresh_token IS 'Encrypted Google OAuth refresh token for Calendar access';
COMMENT ON COLUMN users.google_access_token IS 'Temporary Google OAuth access token';
COMMENT ON COLUMN users.google_token_expiry IS 'Expiry time for the Google access token';
COMMENT ON COLUMN users.credits IS 'Number of credits the user has for interacting with generative AI features.';

-- Table to store user classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique ID for each class entry
    user_id VARCHAR NOT NULL REFERENCES users(google_id) ON DELETE CASCADE, -- Link to the user who owns the class
    name TEXT NOT NULL,                  -- Name of the class (e.g., "Introduction to AI")
    code VARCHAR(50),                    -- Course code (e.g., "CS 101"), optional
    instructor VARCHAR(255),             -- Instructor's name, optional
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()), -- When the class was added
    canvas_course_id INT8 -- Or use TEXT if Canvas IDs might not always be numbers
);

-- Optional: Index for faster lookups by user
CREATE INDEX idx_classes_user_id ON classes(user_id);

-- Optional: Comments for clarity
COMMENT ON TABLE classes IS 'Stores information about the classes users are enrolled in.';
COMMENT ON COLUMN classes.user_id IS 'Foreign key referencing the google_id in the users table.';
COMMENT ON COLUMN classes.name IS 'The display name of the course.';
COMMENT ON COLUMN classes.code IS 'Optional course code (e.g., MATH201).';
COMMENT ON COLUMN classes.instructor IS 'Optional name of the course instructor.';
COMMENT ON COLUMN classes.canvas_course_id IS 'The unique identifier for the course from the Canvas LMS API.';





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



-- Chat Feature Tables


CREATE TYPE chat_sender_type AS ENUM ('user', 'ai');
CREATE TYPE chat_resource_type AS ENUM ('mindmap', 'video', 'flashcards', 'text');



-- Table to store individual chat sessions (Genies)
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(google_id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Name of the chat/Genie given by the user
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) -- Track last interaction
);

-- Index for faster lookup of chats by user
CREATE INDEX idx_chats_user_id ON chats(user_id);

COMMENT ON TABLE chats IS 'Stores individual chat sessions (Genies) initiated by users.';
COMMENT ON COLUMN chats.name IS 'User-defined name for the chat session.';


-- Table to store messages within each chat session
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender chat_sender_type NOT NULL, -- 'user' or 'ai'
    message_text TEXT, -- The textual content of the message
    resource_type chat_resource_type, -- Type of attached/generated resource (optional)
    -- resource_id UUID, -- Optional FK to a specific resource table if needed for complex linking
    content JSONB, -- Stores structured data, e.g., mind map nodes/edges, video URL, user input details
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for faster lookup of messages
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC); -- For ordering

COMMENT ON TABLE chat_messages IS 'Stores individual messages exchanged within a chat session.';
COMMENT ON COLUMN chat_messages.sender IS 'Indicates whether the message is from the user or the AI.';
COMMENT ON COLUMN chat_messages.message_text IS 'The primary textual content of the message.';
COMMENT ON COLUMN chat_messages.resource_type IS 'Indicates the type of rich content associated with the message, if any.';
COMMENT ON COLUMN chat_messages.content IS 'JSONB field to store structured data related to the message (e.g., resource details, user input parameters).';

-- Table to store tasks and assignments
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(google_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'assignment', 'personal', etc.
    assigned_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    personal_deadline TIMESTAMPTZ, -- User's personal deadline before the actual due date
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    from_canvas BOOLEAN DEFAULT FALSE, -- Indicates if imported from Canvas
    canvas_assignment_id BIGINT, -- Canvas assignment ID for imported assignments
    canvas_html_url TEXT, -- Link to the assignment in Canvas
    submission_types JSONB, -- Types of submissions accepted (array from Canvas)
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for faster lookups
CREATE INDEX idx_tasks_class_id ON tasks(class_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Comments for clarity
COMMENT ON TABLE tasks IS 'Stores assignments and personal tasks for classes';
COMMENT ON COLUMN tasks.class_id IS 'Foreign key referencing the id in the classes table';
COMMENT ON COLUMN tasks.user_id IS 'Foreign key referencing the google_id in the users table';
COMMENT ON COLUMN tasks.type IS 'Type of task (assignment, personal, etc.)';
COMMENT ON COLUMN tasks.due_date IS 'When the task is due';
COMMENT ON COLUMN tasks.personal_deadline IS 'User''s personal deadline before the actual due date';
COMMENT ON COLUMN tasks.status IS 'Current status of the task (pending, in-progress, completed)';
COMMENT ON COLUMN tasks.from_canvas IS 'Indicates if the task was imported from Canvas';
COMMENT ON COLUMN tasks.canvas_assignment_id IS 'The Canvas assignment ID for imported assignments';
COMMENT ON COLUMN tasks.canvas_html_url IS 'URL to view the assignment in Canvas';
COMMENT ON COLUMN tasks.submission_types IS 'Types of submissions accepted for this assignment';

