# ApplyZen — AI Career Operating System

<div align="center">
  <h3>Never Miss an Opportunity. We Apply. You Grow.</h3>
  <p>An event-driven AI Career Operating System that converts career-related emails into validated, traceable, and policy-controlled application workflows.</p>
</div>

---

## 🌟 Key Features

- **Automated Opportunity Detection**: Real-time integration with Gmail and Microsoft Outlook to identify job notifications, recruitment emails, and referral opportunities.
- **Deduplication & Eligibility Engine**: Deterministic & heuristic matching to filter out duplicate opportunities and verify degree, graduation year, CGPA, and skill requirements before processing.
- **Career Knowledge Base**: Structured personal repository containing education, projects, skills, and preferences serving as the zero-hallucination ground truth.
- **Targeted Resume Matching**: Automatic multi-version resume scoring with skill gap analysis, picking the highest-impact resume for each application.
- **Human-in-the-Loop Browser Automation**: Playwright-powered form filling with structured field mapping, confidence scoring, approval gating, and manual review.
- **Ethical Human CAPTCHA Handling**: Secure workflow pause and temporary context capture for user solving—zero automated bypass.
- **Full Lifecycle & Email Timeline**: Real-time tracking from application submission to online assessment, interview schedule, offer, or rejection.
- **Persistent AI Career Assistant**: Context-aware assistant providing live stats, match breakdowns, and application guidance.

---

## 🏗️ Architecture & Technology Stack

```
                          APPLYZEN
                             │
              ┌──────────────┴──────────────┐
              │                             │
          FRONTEND                       BACKEND
      React + Vite                  Python + FastAPI
       Tailwind CSS                         │
              │                      ┌──────┴──────┐
              │                      │             │
              │                   MongoDB        Redis
              │                      │             │
              │                      └──────┬──────┘
              │                             │
              │                          RabbitMQ
              │                             │
              │                ┌────────────┼─────────────┐
              │                │            │             │
              │            AI Workers   Email Workers  Browser Workers
              │            LangGraph    Gmail/Outlook    Playwright
              │                │            │             │
              └────────────────┴────────────┴─────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS (Clean Light Theme), React Router v7, Axios, Lucide Icons
- **Backend**: Python 3.10+, FastAPI (Async), Pydantic v2
- **Database**: MongoDB (Motor async driver)
- **Cache & Locks**: Redis
- **Message Broker**: RabbitMQ (aio-pika)
- **AI Orchestration**: LangGraph / LangChain
- **Browser Automation**: Playwright
- **Authentication**: JWT, Passlib (bcrypt), OAuth 2.0 (Google, Microsoft)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ & npm
- Python 3.10+
- MongoDB & Redis (or Docker)

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`.

---

## 🐳 Docker Compose Setup

Run the full platform including MongoDB, Redis, RabbitMQ, FastAPI backend, workers, and frontend:

```bash
docker-compose up --build
```

---

## 📂 Project Structure

```
ApplyZen/
├── frontend/           # React + Vite + Tailwind CSS SPA
├── backend/            # FastAPI async backend & AI workers
├── infrastructure/     # Nginx configs, MongoDB init scripts
├── docs/               # System documentation & API specs
├── .github/workflows/  # CI/CD automation pipelines
├── docker-compose.yml  # Complete multi-service docker compose
└── README.md
```
