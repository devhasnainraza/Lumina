---
id: 0002
title: Update constitution for Spec 3
stage: constitution
date: 2026-05-11
surface: agent
model: claude-opus-4-7
feature: none
branch: 002-rag-chat-engine
user: Muhammad Hasnain
command: /sp.constitution
labels: ["constitution", "spec-3", "frontend", "deployment", "docker", "ux"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (documentation update)
---

## Prompt

Project: AI Knowledge Chatbot (RAG+) — Spec 3 (Frontend, UX & Deployment System)

Core principles:
- Usability (clean, intuitive conversational UX)
- Responsiveness (fast, real-time interaction)
- Reliability (stable Dockerized deployment)
- Scalability (production-ready architecture)
- Consistency (frontend and backend integration reliability)

Key standards:
- Frontend must provide ChatGPT-like conversational experience
- All UI interactions must reflect real backend state
- Streaming responses must render incrementally in real time
- Source attribution must be visible and understandable
- Docker deployment must support full-stack local execution
- Environment variables must fully configure the system
- All authenticated routes must protect user data

Constraints:
- Frontend stack: Next.js 16+ App Router, TypeScript, Tailwind CSS, ShadCN UI
- Backend integration: FastAPI APIs from Spec 1 & 2
- Authentication: Better Auth (JWT-based)
- Deployment: Docker + Docker Compose required
- Chat UI must support: streaming responses, markdown rendering, citations/sources
- Entire system must run using Docker containers

Success criteria:
- Users can authenticate successfully
- Users can upload and manage documents from UI
- Chat interface streams AI responses in real time
- Source attribution displays correctly
- Chat history persists and reloads
- Dashboard displays uploaded documents
- Frontend handles loading/error states gracefully
- Entire full-stack system runs with: docker-compose up
- Frontend and backend communicate reliably

## Response snapshot

Updated AI Knowledge Chatbot (RAG+) Constitution from v1.0.0 to v1.1.0 (MINOR version bump).

**Changes Made:**
1. Added three new NON-NEGOTIABLE principles:
   - Principle VII: Frontend & User Experience (ChatGPT-like UX, streaming, error handling)
   - Principle VIII: Deployment & Configuration (Docker Compose, environment variables, no hardcoded secrets)
   - Principle IX: Authentication & Authorization (Better Auth, JWT validation, session management)

2. Updated Technical Standards:
   - Embedding Model: Changed from OpenAI to Google Gemini API (text-embedding-004)
   - Storage Architecture: Updated to include ChromaDB and chat history in PostgreSQL
   - Added Frontend Stack section: Next.js 16+, TypeScript, Tailwind CSS, ShadCN UI
   - Added Authentication section: Better Auth with JWT
   - Added Docker Deployment Architecture: Container structure, networking, volumes, environment variables

3. Enhanced Performance Requirements:
   - Added frontend performance targets (page load, streaming token render)
   - Added streaming first token latency target
   - Added chat-specific metrics

4. Expanded Success Criteria:
   - Organized into 4 categories: Backend & Data Pipeline (Spec 1), RAG Chat Engine (Spec 2), Frontend & UX (Spec 3), Deployment & Integration (Spec 3)
   - Added 18 new success criteria covering full-stack functionality

**Version Bump Rationale:**
MINOR version bump (1.0.0 → 1.1.0) because new principles and sections were added without removing or redefining existing principles. This is backward-compatible expansion of governance scope.

**Files Updated:**
- .specify/memory/constitution.md (complete rewrite with new principles)

**Templates Verified:**
- spec-template.md: Aligned with new frontend/deployment principles
- plan-template.md: Constitution check includes new principles
- tasks-template.md: Includes frontend and deployment task types

## Outcome

- ✅ Impact: Constitution expanded to cover full-stack system (backend + frontend + deployment)
- 🧪 Tests: N/A (documentation update, no code changes)
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts: /sp.specify for Spec 3 frontend requirements, /sp.plan for Spec 3 implementation
- 🧠 Reflection: Constitution now provides complete governance for all three specs (ingestion, chat engine, frontend/deployment). All principles are testable and enforceable.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (documentation)
- Prompt variant (if applicable): Standard constitution update workflow
- Next experiment (smallest change to try): Apply constitution principles to Spec 3 planning phase
