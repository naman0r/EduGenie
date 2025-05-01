# EduGenie Backend API Endpoints

Documentation for all the backend routes, keep updating as new routes are added.

## Auth (`auth.py`)

- `POST /auth/google`
  - Handles user login/signup via Google OAuth token, creating or updating the user in the database.

## Calendar (`calendar.py`)

- `GET /auth/google/calendar/initiate`
  - Starts the OAuth 2.0 flow to get permission to access a user's Google Calendar.
- `GET /oauth2callback`
  - Handles the redirect from Google after user authorization, exchanges the code for tokens, and stores them.
- `POST /users/<google_id>/calendar/events`
  - Creates a new event in the Google Calendar of the specified user.

## Classes (`classes.py`)

- `GET /users/<google_id>/classes`
  - Retrieves a list of all classes associated with the specified user ID.
- `POST /users/<google_id>/classes`
  - Creates a new class for the specified user.
- `GET /classes/<class_id>`
  - Retrieves the details of a specific class by its ID.

## Notes (`notes.py`)

- `GET /users/<google_id>/notes`
  - Retrieves all text notes for the specified user. Can be filtered by `class_id` query parameter.
- `POST /users/<google_id>/notes`
  - Creates a new text note associated with the specified user and class.
- `PUT /users/<google_id>/notes/<note_id>`
  - Updates the content of an existing text note.
- `DELETE /users/<google_id>/notes/<note_id>`
  - Deletes a specific text note.

## Resources (`resources.py`)

- `GET /users/<google_id>/resources`
  - Retrieves all resources (notes, mindmaps, etc.) for the specified user. Can be filtered by `class_id` query parameter.
- `POST /users/<google_id>/resources`
  - Creates a new resource (e.g., mind map, flashcard set) associated with a user and class.
- `GET /users/<google_id>/resources/all`
  - Retrieves all resources for the specified user ID (potentially redundant, review needed).
- `GET /users/<google_id>/resources/<resource_id>`
  - Retrieves details for a specific resource, including its associated class name.
- `PUT /users/<google_id>/resources/<resource_id>`
  - Updates the `content` field of a specific resource (e.g., saving edited text notes or mind map structure).
- `POST /users/<google_id>/resources/<resource_id>/generate-mindmap`
  - Uses AI to generate a new mind map or enhance an existing one based on a text prompt and optionally the current mind map structure.

## Users (`users.py`)

- `GET /users/<google_id>`
  - Retrieves the profile information for the specified user.
- `PUT /users/<google_id>`
  - Updates the profile information (academic year, level, institution, name) for the specified user.

## Video (`video.py`)

- `POST /generate-video`
  - (Assumes background task implementation) Initiates the AI video generation process based on a provided text prompt. Should ideally return a task ID for status checking.
