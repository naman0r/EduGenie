# EduGenie Backend API Endpoints

Documentation for all the backend routes, keep updating as new routes are added.

## General

- `GET /`
  - Root endpoint, returns a welcome message.

## Auth (`auth.py`)

- `POST /auth/google`
  - Handles user login/signup via Google OAuth token, creating or updating the user in the database. Expects user details in the request body.

## Calendar (`calendar.py`)

- `GET /auth/google/calendar/initiate`
  - Starts the OAuth 2.0 flow to get permission to access a user's Google Calendar. Requires `google_id` as a query parameter. Redirects the user to Google's authorization page.
- `GET /oauth2callback`
  - Handles the redirect from Google after user authorization. Exchanges the authorization code for tokens, stores them for the user (identified by the `state` parameter, which should be `google_id`), and then redirects the user back to the frontend (e.g., `/profile` page with status).
- `POST /users/<google_id>/calendar/events`
  - Creates a new event in the Google Calendar of the specified user. Expects event details (summary, description, start/end datetimes) in the request body.

## Canvas (`canvas.py`)

- `POST /canvas/connect`
  - Connects or disconnects Canvas integration for a user. Expects `google_id` and, for connection, `domain` and `access_token`. If `domain` and `access_token` are null/omitted, it disconnects.
- `GET /canvas/courses`
  - Retrieves a list of active Canvas courses for the user. Requires `google_id` as a query parameter.
- `GET /canvas/assignments/<course_id>`
  - Fetches upcoming assignments from Canvas for a specific `course_id`. Requires `google_id` as a query parameter.
- `POST /classes/<class_id>/canvas/import-assignments`
  - Imports selected Canvas assignments into the application's tasks system for a specific internal `class_id`. Expects `google_id` and a list of `assignment_ids` (Canvas assignment IDs) in the request body. The class must be linked to a Canvas course.
- `GET /classes/<class_id>/tasks`
  - Retrieves all tasks (including those imported from Canvas) for a specific internal `class_id`. Requires `google_id` as a query parameter.

## Classes (`classes.py`)

- `GET /users/<google_id>/classes`
  - Retrieves a list of all classes associated with the specified user ID.
- `POST /users/<google_id>/classes`
  - Creates a new class for the specified user. Expects class details (name, code, instructor) in the request body.
- `GET /classes/<class_id>`
  - Retrieves the details of a specific class by its ID.
- `POST /classes/batch`
  - Adds multiple classes in a batch for a user. Expects `google_id` and a list of `courses` (each with name, code, etc.) in the request body.
- `GET /classes/<class_id>/check-access/<google_id>`
  - Checks if the specified user (`google_id`) has access to (owns) the specified `class_id`.

## Credits (`credits.py`)

- `GET /credits/<google_id>/get_credits`
  - Retrieves the current credit balance for the specified user.
- `POST /credits/<google_id>/add_credits`
  - Adds or subtracts credits for a user. Expects an `amount` (integer) in the request body. A negative amount will subtract credits.

## Notes (`notes.py`)

- `GET /users/<google_id>/notes`
  - Retrieves all text notes for the specified user.
- `POST /users/<google_id>/notes`
  - Creates a new text note associated with the specified user. Expects `content` in the request body.
- `PUT /users/<google_id>/notes/<note_id>`
  - Updates the content of an existing text note. Expects `content` in the request body.
- `DELETE /users/<google_id>/notes/<note_id>`
  - Deletes a specific text note.

## Resources (`resources.py`)

- `GET /users/<google_id>/resources`
  - Retrieves all resources (notes, mindmaps, etc.) for the specified user. Can be filtered by `class_id` query parameter.
- `POST /users/<google_id>/resources`
  - Creates a new resource (e.g., mind map, flashcard set) associated with a user and class. Expects resource details (class_id, user_id, type, name, content) in the request body.
- `GET /users/<google_id>/resources/all`
  - Retrieves all resources for the specified user ID (potentially redundant, review needed, as `/users/<google_id>/resources` without `class_id` does the same).
- `GET /users/<google_id>/resources/<resource_id>`
  - Retrieves details for a specific resource, including its associated class name.
- `PUT /users/<google_id>/resources/<resource_id>`
  - Updates the `name` and/or `content` field of a specific resource (e.g., saving edited text notes or mind map structure). Expects `name` and/or `content` in the request body.
- `POST /users/<google_id>/resources/<resource_id>/generate-mindmap`
  - Uses AI to generate a new mind map or enhance an existing one for a 'Mindmap' type resource. Expects a `prompt` and optionally `existing_nodes` and `existing_edges` in the request body. Updates the resource's content with the generated/enhanced mind map.
- `DELETE /users/<google_id>/resources/<resource_id>`
  - Deletes a specific resource.

## Users (`users.py`)

- `GET /users/<google_id>`
  - Retrieves the profile information for the specified user.
- `PUT /users/<google_id>`
  - Updates the profile information (academic year, level, institution, name) for the specified user. Expects fields to update in the request body.

## Video (`video.py`)

- `POST /chat/generate-video`
  - Initiates AI video generation based on a provided text prompt. The process involves script generation, TTS audio creation, and video rendering with captions. Returns a URL to the statically served MP4 video file upon completion. Expects `text` in the request body.
