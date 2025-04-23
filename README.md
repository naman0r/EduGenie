# EduGenie (or StudyOS) Readme

### features to be implemented:

- PDF upload for users sylabus; make backend logic for splitting PDF into chunks, storing it into a vector DB, and then process it and return a JSON object of course

- chat feature (rate limiting to be implemented)

- set up AI logic

- google calendar login

- Notes page, notes table in supabase, abstracting

### resources logic:

- A resource has....
  - classId FK classes table
  - userId FK users table
  - type -> [flashcards, Mindmap, Text notes] has to be one of these
  - name (string)
  - createdAt -> default time.now
  - updatedAt -> default time.now -> triggered on control s
  - content -> JSONB content. if text notes, it is just content: text, else mindmap is a collection of nodes and edges, else flashcards is a collection of question answer pairs.

routes needed in backend:

- GET /{class_id}/resources : all resources for a class for a user
- POST /{class_id}/resources : Adds a new resource for a specific user for a class
- PUT /{class_id}/resources/{resource_id} : Edits a new resource for a specific user for a class (triggered by control s or hitting the save button)
- DELETE /{class_id}/resources/{resource_id} : Deletes a study resource
- GET /resources : gets ALL resources for a specific user (for the /resources route)
