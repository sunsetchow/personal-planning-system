# Personal Planning System

An AI-native web service for personal planning that combines OKR (Objectives and Key Results) tracking with daily journaling and reflection, powered by Claude AI.

## Features

### Core Features (MVP)

- **OKR Tracking**
  - Set objectives for quarterly, semi-annual, or annual periods
  - Define and track key results with measurable progress
  - AI-powered key result suggestions based on your objectives
  - Visual progress dashboards and charts
  - Status tracking (on track, at risk, behind, completed)

- **Daily Journaling**
  - Customizable journal templates with personalized questions
  - Daily entry tracking with mood and energy scores
  - AI-powered feedback and insights on your entries
  - Automatic OKR update suggestions based on journal entries (with user confirmation)
  - Calendar and list views for easy navigation

- **Dashboard & Analytics**
  - Overall progress visualization
  - Trend analysis for mood and energy levels
  - Achievement highlights
  - AI-generated insights

### Future Features

- Google Calendar integration
- Pomodoro timer for time tracking
- Mobile app (React Native)
- Team/shared OKRs
- Export/import functionality
- Notifications and reminders

## Technology Stack

### Backend
- **Framework**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt
- **AI**: Claude API (Anthropic)

### Frontend
- **Framework**: Next.js 14+ (React + TypeScript)
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + React Query
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-planning-system
   ```

2. **Set up the backend**
   ```bash
   cd backend

   # Install dependencies
   npm install

   # Copy environment variables
   cp .env.example .env

   # Edit .env and configure:
   # - DATABASE_URL: Your PostgreSQL connection string
   # - JWT_SECRET: A secure random string (min 32 characters)
   # - ANTHROPIC_API_KEY: Your Claude API key

   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend

   # Install dependencies
   npm install

   # Copy environment variables
   cp .env.local.example .env.local

   # Edit .env.local and configure:
   # - NEXT_PUBLIC_API_URL: Your backend API URL (default: http://localhost:5000/api)
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on http://localhost:3000

3. **Access the application**
   Open your browser and navigate to http://localhost:3000

## Project Structure

```
personal-planning-system/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models (future use)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── app.ts          # Express app setup
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # Frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # Utilities and API client
│   ├── hooks/            # Custom React hooks
│   └── package.json
├── plan.md               # Implementation plan
├── CLAUDE.md            # Code quality guidelines
└── README.md            # This file
```

## Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The application uses PostgreSQL with the following main models:

- **Users** - User authentication and profile
- **Objectives** - OKR objectives
- **KeyResults** - Measurable key results
- **JournalTemplates** - Custom journal question templates
- **JournalEntries** - Daily journal entries
- **OkrUpdates** - Audit trail for OKR changes

See `backend/prisma/schema.prisma` for the complete schema.

## API Documentation

Once the backend is running, you can explore the API endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### OKRs
- `GET /api/objectives` - List all objectives
- `POST /api/objectives` - Create objective
- `GET /api/objectives/:id` - Get objective details
- `PUT /api/objectives/:id` - Update objective
- `DELETE /api/objectives/:id` - Delete objective
- `POST /api/objectives/:id/key-results` - Add key result
- `PATCH /api/key-results/:id/progress` - Update progress

### Journal
- `GET /api/journal-templates` - List templates
- `POST /api/journal-templates` - Create template
- `GET /api/journal-entries` - List entries
- `POST /api/journal-entries` - Create entry

### AI
- `POST /api/ai/suggest-key-results` - Get AI key result suggestions
- `POST /api/ai/suggest-template` - Get AI template suggestions
- `POST /api/ai/analyze-entry` - Get AI feedback on entry

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/personal_planning
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Code Quality

This project follows strict code quality guidelines. See [CLAUDE.md](./CLAUDE.md) for details.

Key principles:
1. **Readable** - Clear, self-documenting code
2. **Maintainable** - Easy to modify and extend
3. **Testable** - Dependency injection and pure functions
4. **Scalable** - SOLID principles and design patterns

## Contributing

1. Follow the code quality guidelines in CLAUDE.md
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## License

MIT

## Support

For issues or questions:
- Check the [plan.md](./plan.md) for implementation details
- Review the [CLAUDE.md](./CLAUDE.md) for code guidelines
- Open an issue on GitHub

## Roadmap

See [plan.md](./plan.md) for the complete implementation roadmap and current progress.

**Current Phase**: Phase 1 - Project Setup & Foundation ✓

**Next Phase**: Phase 2 - Authentication System
