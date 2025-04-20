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
