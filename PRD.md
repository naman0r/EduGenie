**Product Requirements Document (PRD)**

**Product Name**: EduGenie (working title)

---

## 1. Purpose & Background

**Objective:** Build an AI-powered study planning web application that helps students streamline academic preparation by automatically transforming course materials into personalized study plans, question decks, and calendar events.

**Background:** Students juggle multiple courses each semester, manually extracting key dates, creating flashcards, and devising study schedules. This process is time-consuming and often suboptimal. StudyGenie leverages AI to automate syllabus analysis and generate actionable study resources, freeing students to focus on learning.

---

## 2. MVP Scope & Goals

- **Scope:** Deliver a lean, usable version focusing on core workflows: class enrollment input, syllabus ingestion, AI-driven study plan creation, flashcard deck generation, and calendar synchronization.
- **Goals:**
  1. Validate demand for AI-backed syllabus parsing.
  2. Ensure generated plans and decks are accurate and usable.
  3. Achieve seamless Google Calendar integration for key dates.

---

## 3. Target Audience & Personas

**Primary Users:**

- Undergraduate and graduate students managing 3–6 courses per semester.
- Busy learners seeking automated study aids.

**Persona Example:**

- **Name:** Alex, Junior Computer Science Student
- **Pain Points:** Forgetting assignment deadlines, creating flashcards from scratch, ad-hoc study sessions.
- **Needs:** Consolidated overview of syllabus, auto-generated study timeline, review materials.

---

## 4. User Stories

1. **Semester Setup:**
   - As a student, I want to input my courses for the semester so that the app knows which syllabi to process.
2. **Syllabus Upload:**
   - As a student, I want to upload PDF or DOCX syllabus files so that the system can extract dates, topics, and assessment details.
3. **Study Plan Generation:**
   - As a student, I want the AI to create a personalized week-by-week study plan so that I have structured preparation for lectures, assignments, and exams.
4. **Flashcard Deck Creation:**
   - As a student, I want AI-generated quizlet-style decks based on syllabus topics and my notes so that I can review effectively.
5. **Calendar Sync:**
   - As a student, I want to sync key dates (assignments, exams) to my Google Calendar so that I receive timely reminders.

---

## 5. Features & Requirements

### 5.1 Core MVP Features

| Feature                     | Description                                                | Priority |
| --------------------------- | ---------------------------------------------------------- | -------- |
| Course Input Form           | Manual entry of course code, title, instructor             | High     |
| Syllabus Upload & Parser    | Upload multiple file types; extract dates/topics using NLP | High     |
| AI Study Plan Generator     | Generate multi-week schedule mapped to syllabus content    | High     |
| Flashcard Deck Export       | Auto-create decks exportable in Quizlet format             | High     |
| Google Calendar Integration | OAuth-based sync of extracted dates                        | High     |

### 5.2 In-Scope (MVP)

- PDF & DOCX syllabus support
- Basic natural language date/topic extraction
- Plan broken into weekly milestones
- Exportable CSV or JSON deck for Quizlet import
- Two-way Google Calendar write (user approves events)

### 5.3 Out-of-Scope (Future)

- Mobile app native clients
- Rich media flashcards (images/audio)
- Collaboration or group study modes
- Advanced analytics / progress tracking

---

## 6. Functional Requirements

1. **Authentication & Authorization**
   - Students sign up via email/password or Google OAuth.
2. **Course Dashboard**
   - Display list of registered courses and status of syllabus processing.
3. **File Management**
   - Secure storage of uploaded syllabi; user can re-upload or remove.
4. **Parsing Engine**
   - NLP service identifies dates, topics, deliverables from syllabus text.
5. **AI Module**
   - Generates study plan and question prompts using GPT-based APIs.
6. **Export & Integration**
   - Provide JSON/CSV export for flashcard decks.
   - Connect to Google Calendar API to push events.

---

## 7. Non-Functional Requirements

- **Performance:** Syllabus parsing and plan generation complete within 30 seconds per course.
- **Security:** All uploads and calendar tokens stored encrypted; comply with OAuth best practices.
- **Usability:** Intuitive UI with guided onboarding for first-time users.
- **Scalability:** Modular architecture to support adding more AI functions.

---

## 8. Success Metrics

- **Adoption:** 200 MVP sign-ups in first month.
- **Engagement:** 80% of users complete at least one study plan.
- **Accuracy:** ≥90% of calendar events correctly parsed.
- **Satisfaction:** Avg. user rating ≥4/5 via in-app survey.

---

## 9. Timeline & Milestones (Q2 2025)

| Week | Milestone                             | Deliverable                 |
| ---- | ------------------------------------- | --------------------------- |
| 1    | Project kickoff & architecture design | System design doc           |
| 2–3  | Auth & course dashboard               | User login; course CRUD UI  |
| 4–5  | Syllabus upload & parsing             | Parser prototype, tests     |
| 6–7  | AI study plan module                  | Plan generator API, UI      |
| 8    | Flashcard export functionality        | Export tested, validated    |
| 9    | Google Calendar sync                  | OAuth flow, event push      |
| 10   | End-to-end MVP demo & user testing    | Internal demo, feedback log |

---

## 10. Risks & Assumptions

- **Assumptions:**
  - Access to high-quality NLP & GPT APIs.
  - Students have digital syllabi.
- **Risks:**
  - Parsing inaccuracies on varied syllabus formats.
  - Calendar API rate limits; OAuth friction.

---

_End of PRD for EduGenie MVP._
