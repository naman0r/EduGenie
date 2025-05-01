# ai strategy:

### Core functionality part 1:

frontend: Accepts either a syllabus PDF upload or raw text
backend: Extracts plain text from the pdf, this step can be skipped for raw test inputs.
backend: API call to ChatGPT (or any other cheap AI LLM) to return a JSON object of calendar events (need to define pydantic class and typescript interface)
backend: sends those calendar events to the google calendar and are marked as 'maybe'
frontend: displays a list of calendar events

**_problems_**:

- how will we make sure that the user is free when the google calendar scedules classes, tests, studdy sessions to complete homeworks or prepare for tests?
- look into further google calendar integration.
-
