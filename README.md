# Enterprise Knowledge Assistant

A beginner-friendly, production-inspired MERN application for organization document Q&A using RAG, document permissions, and a simple rule engine.

## Stack

- **Frontend:** React, CSS, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (with Vector Search)
- **Auth:** JWT
- **AI:** Google Gemini API
- **Files:** pdf-parse, mammoth

## Project Structure

```
enterprise-knowledge-assistant/
├── backend/          # Express API
│   └── src/
│       ├── config/       # DB & env configuration
│       ├── models/       # Mongoose schemas
│       ├── controllers/  # HTTP request handlers
│       ├── services/     # Business logic
│       ├── middleware/   # Auth, errors, validation
│       ├── routes/       # API routes
│       ├── utils/        # Helpers
│       └── prompts/      # AI prompt templates
└── frontend/         # React SPA
    └── src/
        ├── pages/
        ├── components/
        ├── hooks/
        ├── services/
        ├── context/
        └── layouts/
```

## Getting Started

### Backend

1. Copy `backend/.env.example` to `backend/.env` and fill in values.
2. `cd backend && npm install && npm run dev`

### Frontend

1. `cd frontend && npm install && npm run dev`

Default API URL: `http://localhost:5000`

## Modules

1. **Authentication** (complete) — Signup, Login, JWT, role-based access
2. **Document Management** — Upload, chunk, embed, permissions
3. **RAG Pipeline** — Permission-aware Q&A
4. **Document Summary & Comparison**
5. **Rule Engine** — Non-AI evaluation + AI explanation
