# Hackverse.ai - Project Requirements Document (PRD)

## **1. Overview**

**Hackverse.ai** is a real-time collaborative whiteboard and project management tool designed for hackathons and team projects. It enables seamless brainstorming, coding collaboration, and task tracking while integrating AI-powered research, GitHub connectivity, and Figma imports.

## **2. Objectives**

- Provide a **real-time, interactive** whiteboard for teams to collaborate.
- Enable **seamless brainstorming, code collaboration, and research assistance**.
- Integrate with **GitHub for code review, Figma for design sync, and Firebase for real-time updates**.
- Include **AI-powered project idea generation, workflow automation, and market research**.
- Offer **task management and progress tracking** to enhance productivity.
- Implement **Google OAuth authentication and Stripe for premium features**.

## **3. Key Features**

### **3.1 Whiteboard & Collaboration**

- Live **drawing, sticky notes, and text-based brainstorming**.
- **Multi-user synchronization** using WebSockets.
- **Save and reload** boards for ongoing projects.
- **Real-time annotation and commenting**.

### **3.2 AI-Powered Research & Assistance**

- **Project idea generation** based on themes and timelines.
- **AI-assisted code review & formatting suggestions**.
- **Market research and feasibility analysis** for projects.
- **Workflow visualization with AI-powered flowcharts**.

### **3.3 GitHub Integration**

- **Live code review** with AI-driven feedback.
- **Push updates directly from the whiteboard** to GitHub.
- **Edit repository files** like `README.md` directly within the app.

### **3.4 Task Management & Progress Tracking**

- Assign tasks like `@user, implement API, due: March 20`.
- **Track project phases** (Idea > MVP > Testing > Deployment).
- **Auto-generated editable flowcharts**.

### **3.5 Figma Plugin & Design-to-Code Workflow**

- **Import/export Figma designs** to the whiteboard.
- **Live updates between Figma and Hackverse.ai**.

### **3.6 Google OAuth & Payment Integration**

- **User authentication via Google OAuth**.
- **Subscription-based premium features using Stripe API**.

### **3.7 Video & Media Support**

- **Embedded video recording** for async updates.
- **Screen capture with annotation tools**.

## **4. Tech Stack**

### **Frontend**

- **Next.js (React)**
- **TailwindCSS / Chakra UI**
- **Socket.io-client for WebSockets**

### **Backend**

- **FastAPI / Flask** (FastAPI preferred for async support)
- **WebSockets (Socket.io)**
- **Supabase for database management**
- **Stripe API for payments**
- **Google OAuth for authentication**

### **Database**

- **Firebase (for real-time updates & board storage)**
- **Supabase (for structured data: user profiles, task management, project metadata)**

## **5. API Endpoints**

### **Authentication & User Management**

| Method | Endpoint            | Functionality                |
| ------ | ------------------- | ---------------------------- |
| `POST` | `/api/auth/login`   | User login with Google OAuth |
| `GET`  | `/api/user/profile` | Retrieve user profile        |

### **Whiteboard Collaboration**

| Method | Endpoint          | Functionality                           |
| ------ | ----------------- | --------------------------------------- |
| `POST` | `/api/board/save` | Save board data                         |
| `GET`  | `/api/board/load` | Load a saved board                      |
| `WS`   | `/ws/board/:id`   | WebSocket connection for real-time sync |

### **AI Assistance & GitHub Integration**

| Method | Endpoint                 | Functionality          |
| ------ | ------------------------ | ---------------------- |
| `POST` | `/api/ai/generate-ideas` | AI project suggestions |
| `POST` | `/api/github/review`     | AI code review         |
| `POST` | `/api/github/push`       | Push changes to GitHub |

### **Task Management & Progress Tracking**

| Method | Endpoint         | Functionality        |
| ------ | ---------------- | -------------------- |
| `POST` | `/api/tasks/add` | Assign a new task    |
| `GET`  | `/api/tasks`     | Fetch assigned tasks |

### **Figma & Stripe Integration**

| Method | Endpoint                  | Functionality          |
| ------ | ------------------------- | ---------------------- |
| `POST` | `/api/figma/import`       | Import Figma design    |
| `POST` | `/api/payments/subscribe` | Handle Stripe payments |

## **6. Deployment Plan**

- **Frontend:** Deploy on **Vercel**.
- **Backend:** Deploy on **Railway/Render**.
- **Database:** Firebase & Supabase for data persistence.

## **7. Challenges & Considerations**

- **WebSocket Optimization**: Reducing latency in real-time collaboration.
- **Data Conflicts**: Handling concurrent edits to whiteboards & files.
- **GitHub API Rate Limits**: Managing API calls efficiently.
- **AI Accuracy**: Ensuring relevant AI suggestions for projects.

## **8. Roadmap & Timeline**

| Phase       | Tasks                                               | Timeline  |
| ----------- | --------------------------------------------------- | --------- |
| **Phase 1** | Core Infrastructure (Frontend, Backend, WebSockets) | 2-3 weeks |
| **Phase 2** | Whiteboard & Collaboration                          | 3-4 weeks |
| **Phase 3** | AI Research & GitHub Integration                    | 4-5 weeks |
| **Phase 4** | Task Management & UI Enhancements                   | 3-4 weeks |
| **Phase 5** | Figma Plugin & Stripe Payments                      | 3-4 weeks |
| **Phase 6** | Testing & Deployment                                | 2-3 weeks |

## **9. Next Steps**

1. **Set up Next.js & FastAPI with WebSockets.**
2. **Develop UI Wireframes & Component Design.**
3. **Integrate Firebase & Supabase for real-time storage.**
4. **Build WebSocket-based whiteboard sync.**
5. **Implement AI-powered features and GitHub API.**

---

This PRD provides a structured blueprint for developing Hackverse.ai. Let me know if you want any refinements or additional details! 🚀
