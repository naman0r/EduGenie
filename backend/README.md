# set up instrictions

- python3 -m venv venv
  - set up a virtual environment (only needed once)
- source venv/bin/activate

- fastapi dev main.py => runs the backend server.

## DDL for the Supabase Tables:

create table users (
google_id varchar primary key,
email varchar unique not null,
full_name varchar,
avatar_url text,
created_at timestamp with time zone default timezone('utc'::text, now()),
last_logged_in timestamp with time zone default timezone('utc'::text, now())
);
