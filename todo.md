# Assignment tracking for EduGenie

- [x] in this route : @bp.route('/canvas/connect', methods=['POST']) (canvas.py) we need to add validation for the url that the user inputs. eg: we need to make sure it is https:// preceeding and also has a / at the end of it.

- [ ] @naman: implementing credits thing, revenueCat for payments

- [x] @naman : progress on canvas infrastructure: done

- [x] @som: Investigation: I have a class with a certain id that ONLY I should be able to access. however, if another user goes to http://localhost:3000/class/450a84f5-5480-4d94-b1e5-46da244e53d4 , they can access my class. Fix this. (need to secure end point by sending google_id and checking if user's google_id is same as the google_id trying to access resource)

- [ ] @both: overwrite the default 404 error page (figure out how to do this), and make it fit stylistically with the rest of the app

- [ ] @both: user pain point: putting personal access token for Canvas manually

- [ ] @both: user pain point: not having production ready google calendar auth so it takes them to a sketchy page

- [ ] @both: CLEAR UI/UX and Branding. the color theme needs to be solidified, logo needs to be redone.

- [x] : @som: once you complete onboarding to make sur eyou understand the whole application structure now, go to backend/routes.md and make sure you understand how everything works.

- [x] - @Som: go to frontend/app/(user)/resources/[id]/page.tsx - implement functionality for user to be able to create and view flashcards based on a text input box where the user can input CSV values for question, answer; and user should be able to UPDATE the resource, and then implement an 'ask ai' button, which is a simple chat api call which includes the current csv text content notes (stored as JSONB) and gives it to chat, asks to generate MORE flashcards in the same JSONB format inputted and then displays it on the frontend

- [ ]: @som figure out layout and only make the navbar show on the / and /profile directory (only in the files in the (landing) folder without making layout a client side component (which means we cannot export metadata))

- [ ] - @som and @naman: how can rate limiting be implemented in this? we want the user to only be able to generate around 5 videos on freemium (basic plan) and only have like 2 resources per class, and only be able to use the ai note taking capabilities per note like twice.

<!-- - [ ] YOOOO WHAT IF I WAS ABLE TO INTEGRATE THIS WITH CANVAS?????!!!! Further research required

  - documentation? : https://canvas.instructure.com/doc/api/index.html
    - [ ] : @som figure out OAuth with Canvas, figure out how to do the same shit in canvs that I did with google calendar (connect button on the /profile pahe on the frontend, /canvas/auth2callback backend route or something)
    - [ ] -->

- [ ] setting up celery runners or whatever infrastructure that allows us to deploy and ship the video feature, and also make it so if a user reloads, then the video still stays (need to set up a chat table in supabase), idk how else to do do this yet but will figure it out

- [ ] - @som and @naman: think about best deployment practices while writing code. replace all backend api calls with **process.env.NEXT_BACKEND_URL**, which's value will be stored as http://localhost:8000 for now, but will be changed to something like api.edugenie.com when we do deploy the backend with railway and deploy the frontend with vercel.

- [ ] - @som : how can we deploy with the ai video generated shit??????? docker? or do we need to find a new way for this ai generation strategy? pls investigate, bc we are looking at an around 2 weeks from now deployment timeline.

- [ ] @both: think about brainding and brand colors. Come up with a new name (EduGenie is not a great name), and come up with a consistent color theme. can migrate to a light mode theme if that is better from a branding and deployment perspective.

- [ ] both: Need to implement backend and frontend logic for all pages in the sidebar (settings, assignments, calendar to be specific), can also add new pages (need to brainstorm which would be the best)

## **IDEA**:

- point based access to features for edugenie users.
  - user can start off with a pre-determined amount of points (let's say 20 for now)
  - every time they make a new resource, or use any of the AI features, one of the points is gone.
  - users can GET more points by either purchasing first tier premium ($5 a month), or referring friends (20 credits for each friend they refer successfully).
  - i think we can do this with clever routing parameters (eg: edugenie.vercel.app/profile?uid=**\_\_\_\_**), and when user creates account, a certain number of points is added to

### completed task log and what has been done so far:

[x] COMPLETED - @Naman: implement a way where users can add more nodes in the mindmap, look through react flow documentation, the generate wiht ai button should be adding to current mindmap not creating a new one every time (can implement a upload new button)

[x] Supabase integration, schema built out (can always add more to it), schema can be found in backend/schema.sql
[x] frontend work: landing page, profile, dashboard, resources, chat, resources/resourdeId, classes/classid, about, pricing,

[x] Backend work: routes set up for video generation (not mvp level), mindmaps (not mvp level), text notes (not mvp level, we need to bring a notion-like feel to this type of resource creation), calendar setup, calendar integration (not even touched), flashcard logic and integration (not even touched), auth with google firebase, calendar auth with google cloud.

# ai strategy:

### Core functionality part 1:

frontend: Accepts either a syllabus PDF upload or raw text
backend: Extracts plain text from the pdf, this step can be skipped for raw test inputs.
backend: API call to ChatGPT (or any other cheap AI LLM) to return a JSON object of calendar events (need to define pydantic class and typescript interface)
backend: sends those calendar events to the google calendar and are marked as 'maybe'
frontend: displays a list of calendar events

**_problems_**:

- [ ] how will we make sure that the user is free when the google calendar scedules classes, tests, studdy sessions to complete homeworks or prepare for tests?
- [ ] look into further google calendar integration @som

### video generation problems with deployment:

- [ ] Video generation takes too long for a standard web request (which usally times out after 30-60 seconds)
- this will lead to flask server timeouts.
- one deployment strategy is to use docker and then deploy it using ECS, another strategy is to use celery and redis (need to research further) which provides async support to our routes (should have stuck with fastapi smh)
- ok so basically celery is a 'distributed task queue', which lets our backend logic work outside the request/response cycle, either async or on a scedule. \* note used to send emails in venu
- really only the video generation stuff might be giving us issues with deployment at the moment.

## resources:

- this seems like a good resource (gradio from huggingface) : https://www.gradio.app/
