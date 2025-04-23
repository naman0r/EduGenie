# this is the document for documenting and keeping track of all the progress that I made.

### google calendar integration process

- made a new project on google cloud console
- enabled google calendar API so the app can use it
- created credentials (in json format in the backend directory, included in gitignore)
- added a redirect url to localhost:8000/oauth2callback
- added my two email addresses as test users

- added a connect google calendar button to the profile page (/profile)
  - when this button is dlicked, the frontend navigates to a special backend URL /auth/google/calendar/initiate, which take in a google id of the user
  - /auth/google/calendar/initiate backend endpoint reads client*secret*...json file
  - provides an access_token (assuming 1 hr expiration) and a refresh_token (long lived key which can provide access to new access_token s)

Frontend asks Backend -> Backend asks Google -> User tells Google "Yes" -> Google tells Backend "Okay, here are the keys" -> Backend saves keys and tells Frontend "Done" -> Frontend shows "Connected".

#### progress

Okay, so I needed my backend to actually do something with the Google Calendar connection I just set up. The goal is to let users add events from my app to their own Google Calendar.

- Importing the Tools: First, I needed the right tools from Google's Python libraries. I added imports for:

- Creating a Reusable Helper (get_google_calendar_client): I realized I'd need to get an authenticated Calendar client in multiple places potentially, and the logic for checking/refreshing tokens is tricky. So, I created a helper function get_google_calendar_client that takes a user's google_id:

  - Get Tokens: It looks up the google_id in my Supabase users table and fetches the google_refresh_token, google_access_token, and google_token_expiry I stored earlier.
    - Check Connection: It first makes sure there is a refresh_token. If not, the user hasn't connected their calendar, so I raise an error telling the frontend that.
    - Build Credentials: It creates a Credentials object using the fetched tokens, plus the client_id and client_secret from my client_secrets....json file. (Self-note: Loading the secrets file every time isn't ideal, I should maybe cache that info later.)
    - Check Validity & Refresh: This is the core OAuth part. It checks if the Credentials object is still valid (has an access token) and if its expiry time is in the future. If it's invalid or expired, but I have a refresh_token, I tell the credentials object to refresh() itself. This automatically makes a secure call to Google behind the scenes to get a new access token using the refresh token.
    - Update DB After Refresh: If the refresh happened successfully, the Credentials object now has a new access token and expiry time. It's crucial to save these updated values back into my Supabase users table for that user, overwriting the old ones. This ensures the next time the function is called, it uses the latest valid token.
    - Build the Service: Finally, with valid credentials (either the original ones or freshly refreshed ones), I use the build('calendar', 'v3', credentials=creds) function to create the actual service client object. This object has methods like events().insert(), events().list(), etc., that I can use to talk to the Calendar API.
    - Return the Service: The function returns this ready-to-use service client
    - Error Handling: I wrapped the different stages (fetching tokens, refreshing, building service) in try...except blocks to catch potential issues and return appropriate error responses (like 401 Unauthorized if refresh fails, or 500 Internal Server Error for unexpected problems).

- Defining the Event Data (CalendarEventCreate): I needed a way for the frontend to tell the backend what event to create. I used Pydantic to define a CalendarEventCreate model that expects a summary (title) and ISO 8601 formatted strings for start_datetime and end_datetime (like "2024-08-15T09:00:00-07:00").

- Creating the API Endpoint (POST /users/{google_id}/calendar/events): This is the endpoint the frontend will call.
  - It takes the google_id from the URL path and the event data (CalendarEventCreate model) from the request body.
  - Get Client: It first calls my new helper function get_google_calendar_client(google_id) to get the authenticated service client for that specific user. If this fails (e.g., user hasn't connected Calendar, refresh failed), the helper function raises an error, and the endpoint stops.
  - Format Event: It creates a Python dictionary (event_body) matching the structure Google Calendar API expects for a new event, using the data received from the frontend.
  - Call Google API: It uses the service client to insert the event: calendar_service.events().insert(calendarId='primary', body=event_body).execute(). calendarId='primary' means "add it to the user's main calendar". .execute() actually sends the request to Google.
  - Call Google API: It uses the service client to insert the event: calendar_service.events().insert(calendarId='primary', body=event_body).execute(). calendarId='primary' means "add it to the user's main calendar". .execute() actually sends the request to Google.
  - Error Handling: It specifically catches HttpError from the Google client library to handle API-specific errors (like permission denied - 403, or bad request data - 400) and also catches the exceptions raised by my get_google_calendar_client helper, returning appropriate error responses to the frontend

## Resources, abstracting, and progress:

```typescript
interface Resource {
  id: string;
  class_id: string;
  user_id: string;
  type: string;
  name: string;
  created_at: string;
  content?: Record<string, any>;
}
```

/users/{google_id}/resources/{resource_id}
