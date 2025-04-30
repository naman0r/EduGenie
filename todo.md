# Assignment tracking for EduGenie

[ ] - @Som: go to frontend/app/(user)/resources/[id]/page.tsx - implement functionality for user to be able to create and view flashcards based on a text input box where the user can input CSV values for question, answer; and user should be able to UPDATE the resource, and then implement an 'ask ai' button, which is a simple chat api call which includes the current csv text content notes (stored as JSONB) and gives it to chat, asks to generate MORE flashcards in the same JSONB format inputted and then displays it on the frontend

[ ] - @som and @naman: how can rate limiting be implemented in this? we want the user to only be able to generate around 5 videos on freemium (basic plan) and only have like 2 resources per class, and only be able to use the ai note taking capabilities per note like twice.

[ ] - @som and @naman: think about best deployment practices while writing code. replace all backend api calls with **process.env.NEXT_BACKEND_URL**, which's value will be stored as http://localhost:8000 for now, but will be changed to something like api.edugenie.com when we do deploy the backend with railway and deploy the frontend with vercel.

[ ] - @som : how can we deploy with the ai video generated shit??????? docker? or do we need to find a new way for this ai generation strategy? pls investigate, bc we are looking at an around 2 weeks from now deployment timeline.

## **IDEA**:

- point based access to features for edugenie users.
  - user can start off with a pre-determined amount of points (let's say 20 for now)
  - every time they make a new resource, or use any of the AI features, one of the points is gone.
  - users can GET more points by either purchasing first tier premium ($5 a month), or referring friends (20 credits for each friend they refer successfully).
  - i think we can do this with clever routing parameters (eg: edugenie.vercel.app/profile?uid=**\_\_\_\_**), and when user creates account, a certain number of points is added to

[X] COMPLETED - @Naman: implement a way where users can add more nodes in the mindmap, look through react flow documentation, the generate wiht ai button should be adding to current mindmap not creating a new one every time (can implement a upload new button)
