# Attempt to make the codebase properly designed , more modular, and follow a solid design pattern.

## goals:

- service layer for API calls: All communication with our backend should and will be handled by functions within frontent/src/services; and components and pages will NOT fetch directly.
- Global State Management: React Context API for application-wide state and user authentication and credits. Avoid prop drilling and unnesecary API calls. `AuthContext` but idk how to use this yet
- Custom hooks in frontend/src/hooks for encapsulating reurable state logic and side effects (idk how to do this yet either)
- clear type definitions in existing frontend/src/types folder (work in progress but needs to be worked on more. )

## steps:

- Establish core functionality in Services, Types and Context.
- Loosely use OOD concept of MVC (view, or page.tsx or components should NOT have fetching directly)
- Controller is api.ts or services/ which interracts with backend on one point.
- model is the backend (flask server) ??
-

1. create frontend/src/services/api.ts (wil lhouse all functions making calls to my backend)
2. intial needed: syncUserWithBackend(userData: User [model from firebase/auth]): Promise<Type> (POST auth/google)
3. fetchUserCredits(googleId: String): Promise<{credits: number}> -> GET /credits/{google_id}/get_credits
4. fetchUserClasses(googleId: String): Promise<ClassData[]> (GET /users/{google_id}/classes)
5. addClass (googleId: String, classDetails: {name: String; code?:string; incstuctor?:string}) : Promise<ClassData> (POST /users/{google_id}/classes) - for AddClassForm.

- AUTH TO-DO

* Storing google_id in localStorage is a very unsafe and stupid way to accomplish user auth.

1. Create frontend/src/context/AuthContext.tsx
   - this will manage user (Firebase User Object), credits (number), isLoading (boolean for authState), and authError (string | null)
   - it will use auth.onAuthStateChanged from Firebase.
   - when a user logs in (or is found to be logged in), it will automatically call fetchUserCredits from `api.ts` service.

- Update frontend/src/app/layout.tsx:
  - wrap the main content of the application with AuthProvider from AuthContext.tsx

## Phase 2:

1. Refactor core components:
   - use all the shit we just made.
