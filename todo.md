# Assignment tracking for EduGenie

[ ] - @Som: go to frontend/app/(user)/resources/[id]/page.tsx - implement functionality for user to be able to create and view flashcards based on a text input box where the user can input CSV values for question, answer; and user should be able to UPDATE the resource, and then implement an 'ask ai' button, which is a simple chat api call which includes the current csv text content notes (stored as JSONB) and gives it to chat, asks to generate MORE flashcards in the same JSONB format inputted and then displays it on the frontend

[ ] - @som and naman: how can rate limiting be implemented in this? we want the user to only be able to generate around 5 videos on freemium (basic plan) and only have like 2 resources per class, and only be able to use the ai note taking capabilities per note like twice.

[X] COMPLETED - @Naman: implement a way where users can add more nodes in the mindmap, look through react flow documentation, the generate wiht ai button should be adding to current mindmap not creating a new one every time (can implement a upload new button)
