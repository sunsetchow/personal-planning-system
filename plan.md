# Personal Planning System - Implementation Plan

## Project Overview
An AI-native web service for personal planning combining OKR (Objectives and Key Results) tracking with daily journaling and reflection.

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js (TypeScript)
  - Reasons: Fast development, excellent async support, large ecosystem, TypeScript for type safety
- **Database**: PostgreSQL
  - Reasons: ACID compliance, relational data (OKRs, journals, users), JSON support for flexible schemas
- **ORM**: Prisma
  - Reasons: Type-safe, excellent TypeScript integration, easy migrations
- **Authentication**: JWT with bcrypt
- **AI Integration**: Claude API (Anthropic) (for suggestions and feedback)
  - Reasons: Superior reasoning capabilities, better context understanding, safer outputs

### Frontend
- **Framework**: Next.js 14+ (React with TypeScript)
  - Reasons: Server-side rendering, built-in routing, API routes, excellent developer experience
- **UI Library**: Tailwind CSS + shadcn/ui
  - Reasons: Rapid development, consistent design, accessible components
- **State Management**: React Context + React Query
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form + Zod validation

### Development Tools
- **Testing**: Jest + React Testing Library + Supertest
- **Linting**: ESLint + Prettier
- **API Documentation**: OpenAPI/Swagger
- **Version Control**: Git

## Architecture Design

### System Architecture
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│      Next.js Frontend           │
│  - React Components             │
│  - Client-side State            │
│  - UI/UX                        │
└──────┬──────────────────────────┘
       │
       │ REST API
       ▼
┌─────────────────────────────────┐
│      Express.js Backend         │
│  - API Routes                   │
│  - Business Logic               │
│  - Authentication               │
│  - AI Integration               │
└──────┬────────────┬─────────────┘
       │            │
       │            │
       ▼            ▼
┌──────────┐  ┌──────────────┐
│PostgreSQL│  │  Claude API  │
│ Database │  │  (Anthropic) │
└──────────┘  └──────────────┘
```

### Database Schema

#### Users Table
```sql
users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Objectives Table
```sql
objectives
- id (UUID, PK)
- user_id (UUID, FK -> users)
- title (VARCHAR)
- description (TEXT)
- period_type (ENUM: 'quarterly', 'semi-annual', 'annual')
- start_date (DATE)
- end_date (DATE)
- status (ENUM: 'active', 'completed', 'cancelled')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Key Results Table
```sql
key_results
- id (UUID, PK)
- objective_id (UUID, FK -> objectives)
- title (VARCHAR)
- description (TEXT)
- target_value (DECIMAL)
- current_value (DECIMAL)
- unit (VARCHAR) -- e.g., '%', 'count', 'hours'
- status (ENUM: 'on_track', 'at_risk', 'behind', 'completed')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Journal Templates Table
```sql
journal_templates
- id (UUID, PK)
- user_id (UUID, FK -> users)
- name (VARCHAR)
- questions (JSONB) -- Array of question objects
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Journal Entries Table
```sql
journal_entries
- id (UUID, PK)
- user_id (UUID, FK -> users)
- template_id (UUID, FK -> journal_templates)
- entry_date (DATE)
- responses (JSONB) -- Question-answer pairs
- mood_score (INTEGER) -- 1-10
- energy_score (INTEGER) -- 1-10
- ai_feedback (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### OKR Updates Table (Audit Trail)
```sql
okr_updates
- id (UUID, PK)
- key_result_id (UUID, FK -> key_results)
- journal_entry_id (UUID, FK -> journal_entries, nullable)
- previous_value (DECIMAL)
- new_value (DECIMAL)
- update_type (ENUM: 'manual', 'journal_suggested', 'journal_auto')
- notes (TEXT)
- created_at (TIMESTAMP)
```

## API Design

### Authentication Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### OKR Endpoints
```
GET    /api/objectives
POST   /api/objectives
GET    /api/objectives/:id
PUT    /api/objectives/:id
DELETE /api/objectives/:id

GET    /api/objectives/:id/key-results
POST   /api/objectives/:id/key-results
PUT    /api/key-results/:id
DELETE /api/key-results/:id
PATCH  /api/key-results/:id/progress

POST   /api/ai/suggest-key-results (AI-powered suggestions)
```

### Journal Endpoints
```
GET    /api/journal-templates
POST   /api/journal-templates
GET    /api/journal-templates/:id
PUT    /api/journal-templates/:id
DELETE /api/journal-templates/:id

GET    /api/journal-entries
POST   /api/journal-entries
GET    /api/journal-entries/:id
PUT    /api/journal-entries/:id
DELETE /api/journal-entries/:id

POST   /api/ai/suggest-template (AI-powered template suggestions)
POST   /api/ai/analyze-entry (AI-powered feedback)
POST   /api/ai/suggest-okr-updates (AI-powered OKR update suggestions)
```

### Dashboard Endpoints
```
GET    /api/dashboard/overview
GET    /api/dashboard/okr-progress
GET    /api/dashboard/journal-stats
GET    /api/dashboard/insights
```

## Frontend Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (landing page)
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── page.tsx (overview)
│   │   ├── okrs/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   └── journal/
│   │       ├── page.tsx (list)
│   │       ├── new/
│   │       └── [id]/
├── components/
│   ├── ui/ (shadcn components)
│   ├── okr/
│   │   ├── ObjectiveCard.tsx
│   │   ├── KeyResultItem.tsx
│   │   ├── OKRDashboard.tsx
│   │   └── ProgressChart.tsx
│   ├── journal/
│   │   ├── JournalForm.tsx
│   │   ├── TemplateEditor.tsx
│   │   ├── EntryList.tsx
│   │   └── AIFeedback.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts (API client)
│   ├── auth.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useOKRs.ts
│   └── useJournal.ts
└── types/
    └── index.ts
```

## Implementation Phases

### Phase 1: Project Setup & Foundation ✅
- [x] Initialize repository
- [x] Set up project structure (backend + frontend)
- [x] Configure TypeScript, ESLint, Prettier
- [x] Set up PostgreSQL database
- [x] Configure Prisma ORM
- [x] Create database schema and migrations
- [x] Set up basic Express server
- [x] Set up Next.js application
- [x] Configure environment variables

### Phase 2: Authentication System ✅
- [x] Implement user registration
- [x] Implement user login/logout
- [x] JWT token generation and validation
- [x] Protected route middleware (backend)
- [x] Auth context and protected routes (frontend)
- [x] Basic user profile management

### Phase 3: OKR Core Features ✅
- [x] Create Objective CRUD endpoints
- [x] Create Key Result CRUD endpoints
- [x] Implement progress tracking
- [x] Build OKR forms (frontend)
- [x] Build OKR dashboard/visualization
- [x] Implement OKR list and detail views
- [x] Add progress charts/graphs
- [ ] AI-powered key result suggestions (Phase 5)

### Phase 4: Daily Journal Features
- [ ] Create Journal Template CRUD endpoints
- [ ] Create Journal Entry CRUD endpoints
- [ ] Build template editor (frontend)
- [ ] Build journal entry form (frontend)
- [ ] Implement journal entry list/calendar view
- [ ] AI-powered template suggestions
- [ ] AI-powered entry analysis/feedback

### Phase 5: AI Integration & Automation
- [ ] Set up Claude API (Anthropic) integration
- [ ] Implement AI feedback on journal entries
- [ ] Implement AI-powered OKR suggestions from journal entries
- [ ] Build confirmation UI for AI-suggested updates
- [ ] Create insights and trends analysis

### Phase 6: Dashboard & Analytics
- [ ] Overall progress dashboard
- [ ] OKR progress visualization
- [ ] Journal statistics and trends
- [ ] Mood and energy tracking charts
- [ ] Achievement highlights

### Phase 7: Testing & Quality Assurance
- [ ] Write unit tests for backend API
- [ ] Write integration tests
- [ ] Write frontend component tests
- [ ] E2E testing with Cypress/Playwright
- [ ] Performance optimization
- [ ] Security audit

### Phase 8: Deployment & Documentation
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production (Vercel/Railway/AWS)
- [ ] API documentation
- [ ] User documentation
- [ ] README with setup instructions

### Future Enhancements (Post-MVP)
- [ ] Google Calendar integration
- [ ] Pomodoro timer feature
- [ ] Mobile app (React Native)
- [ ] Team/shared OKRs
- [ ] Export/import functionality
- [ ] Notifications and reminders

## Development Steps (Detailed)

### Step 1: Backend Foundation
1. Initialize Node.js project with TypeScript
2. Install dependencies:
   - express, cors, helmet, dotenv
   - prisma, @prisma/client
   - bcrypt, jsonwebtoken
   - zod (validation)
   - @anthropic-ai/sdk
3. Set up folder structure
4. Configure Prisma schema
5. Create initial migration
6. Set up basic Express server with middleware

### Step 2: Frontend Foundation
1. Initialize Next.js project with TypeScript
2. Install dependencies:
   - tailwindcss
   - shadcn/ui components
   - react-query
   - react-hook-form
   - zod
   - axios
   - recharts
3. Configure Tailwind CSS
4. Set up basic layout and routing

### Step 3: Authentication Implementation
1. Create User model and migration
2. Implement registration endpoint
3. Implement login endpoint
4. Create JWT middleware
5. Build auth pages (login/register)
6. Implement auth context
7. Protected route wrapper

### Step 4: OKR Implementation
1. Create Objectives and KeyResults models
2. Implement CRUD endpoints
3. Add validation with Zod
4. Create OKR services
5. Build OKR components
6. Implement progress tracking
7. Add visualization charts

### Step 5: Journal Implementation
1. Create JournalTemplate and JournalEntry models
2. Implement CRUD endpoints
3. Build template editor
4. Build journal entry form
5. Implement calendar/list view
6. Add search and filtering

### Step 6: AI Features
1. Set up Claude API service with Anthropic SDK
2. Implement key result suggestions using Claude
3. Implement journal entry analysis with Claude
4. Implement OKR update suggestions powered by Claude
5. Build UI for AI interactions
6. Add confirmation flows

## Code Quality Checklist (per CLAUDE.md)

For each feature implementation:
- [ ] Code is readable with clear, descriptive names
- [ ] Functions follow single responsibility principle
- [ ] No code duplication (DRY)
- [ ] Dependencies are injected for testability
- [ ] Comprehensive error handling
- [ ] Input validation with Zod
- [ ] Unit tests included
- [ ] API endpoints documented
- [ ] TypeScript types properly defined
- [ ] SOLID principles followed

## Project Timeline Estimate

- **Phase 1**: 1-2 days
- **Phase 2**: 2-3 days
- **Phase 3**: 3-4 days
- **Phase 4**: 3-4 days
- **Phase 5**: 2-3 days
- **Phase 6**: 2-3 days
- **Phase 7**: 2-3 days
- **Phase 8**: 1-2 days

**Total MVP**: ~3-4 weeks

## Next Steps

1. Set up backend project structure
2. Set up frontend project structure
3. Configure databases and migrations
4. Implement authentication
5. Build OKR features
6. Build journal features
7. Integrate AI capabilities
8. Test and deploy

---

## Progress Tracking

**Completed Phases:**
- ✅ Phase 1 - Project Setup & Foundation
- ✅ Phase 2 - Authentication System
- ✅ Phase 3 - OKR Core Features

**Current Phase:** Phase 4 - Daily Journal Features

**Next Steps:**
1. Create Journal Template CRUD endpoints
2. Create Journal Entry CRUD endpoints
3. Build template editor with customizable questions
4. Build journal entry form with date selection
5. Implement calendar/list view for journal entries
6. Add AI-powered feedback (Phase 5)

Last Updated: 2025-11-18
