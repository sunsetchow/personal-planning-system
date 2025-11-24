# Personal Planning System - Standalone Application Plan

**Last Updated**: November 24, 2025
**Purpose**: Complete standalone personal development system with OKR tracking, daily journaling, Pomodoro time tracking, and weekly check-in workflow

---

## 📋 Executive Summary

This plan transforms the Personal Planning System into a comprehensive standalone application that:
1. **Tracks** daily journals with mood, energy, and accomplishments
2. **Records** Pomodoro sessions with category mapping to OKRs
3. **Manages** OKR progress with visual dashboards
4. **Executes** weekly check-in workflow with AI-powered insights
5. **Generates** beautiful weekly reports, journals, and newsletters
6. **Visualizes** all data in a rich, modern web interface

**Key Feature**: All data lives in the application database - no external file dependencies.

---

## 🎯 Current State Analysis

### Completed Features (Phases 1-7)
- ✅ User authentication with JWT
- ✅ OKR CRUD operations and progress tracking
- ✅ Customizable journal templates
- ✅ Daily journaling with mood/energy scores
- ✅ AI-powered insights and suggestions
- ✅ Analytics dashboard with visualizations
- ✅ Comprehensive test coverage (70 tests)

### Missing Features for Complete System
- ❌ Built-in Pomodoro timer and session recording
- ❌ OKR category mapping for time sessions
- ❌ Weekly check-in workflow automation
- ❌ Multi-source activity correlation (journals + Pomodoro → OKRs)
- ❌ Weekly report generation (markdown)
- ❌ Weekly journal generation (narrative format)
- ❌ Newsletter generation (HTML newspaper style)
- ❌ Advanced time analytics and focus quality metrics

---

## 🏗️ Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│    (Next.js - Dashboard, OKR, Journal, Pomodoro, Reports)    │
└────────────┬─────────────────────────────────────────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Backend                         │
│   - API Routes         - Weekly Check-in Orchestrator        │
│   - Business Logic     - Report Generators                   │
│   - AI Integration     - Time Analytics                      │
└────────┬──────────────────────────┬─────────────────────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────────────┐
│  PostgreSQL DB     │    │    Claude AI (Anthropic)   │
│  - Users & Auth    │    │  - Journal Analysis        │
│  - OKRs & Progress │    │  - OKR Insights            │
│  - Journal Entries │    │  - Report Generation       │
│  - Pomodoro Sessions│   │  - Newsletter Creation     │
│  - AI Insights     │    └────────────────────────────┘
└────────────────────┘
```

### Data Flow

1. **User Input**: Daily journals, OKR updates, Pomodoro sessions
2. **Storage**: All data persists in PostgreSQL database
3. **Analysis**: Weekly check-in aggregates and analyzes data
4. **AI Processing**: Claude generates insights and recommendations
5. **Output**: Reports, journals, newsletters generated and stored
6. **Visualization**: Rich dashboards display all metrics and trends

---

## 📝 Implementation Phases

### Phase 9: Pomodoro Timer & Session Recording
**Timeline**: 3-4 days
**Priority**: HIGH - Core time tracking feature

#### 9.1 Database Schema for Pomodoro

**Extend TimeSession Model**:

```prisma
model TimeSession {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  title           String
  category        String?  // User-defined category
  okrCategory     String?  @map("okr_category") // Maps to: Relationship, Career, Leadership, Academic
  objectiveId     String?  @map("objective_id") // Optional link to specific objective
  startTime       DateTime @map("start_time")
  endTime         DateTime @map("end_time")
  duration        Int      // Duration in seconds
  pauseDuration   Int      @default(0) @map("pause_duration") // Total pause time in seconds
  focusQuality    FocusQuality @map("focus_quality")
  tags            Json?    // Array of custom tags
  notes           String?  @db.Text
  isCompleted     Boolean  @default(true) @map("is_completed")
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  objective Objective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, startTime])
  @@index([okrCategory])
  @@index([objectiveId])
  @@map("time_sessions")
}

enum FocusQuality {
  FULL_FOCUS      // Uninterrupted focus session
  PARTIAL_FOCUS   // Some interruptions but productive
  INTERRUPTED     // Frequently interrupted
  REST            // Break/rest session
}
```

**Category Configuration Model**:

```prisma
model CategoryMapping {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  categoryName    String   @map("category_name")
  okrCategory     String   @map("okr_category") // Relationship, Career, Leadership, Academic, Personal
  defaultObjectiveId String? @map("default_objective_id")
  hexColor        String   @default("#2C50CF") @map("hex_color")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryName])
  @@index([userId, isActive])
  @@map("category_mappings")
}
```

**Update User Model**:

```prisma
model User {
  // ... existing fields ...

  // Add relations
  timeSessions      TimeSession[]
  categoryMappings  CategoryMapping[]
}

model Objective {
  // ... existing fields ...

  // Add relation
  timeSessions TimeSession[]
}
```

#### 9.2 Pomodoro Timer Service

**Backend Service**:

```typescript
// backend/src/services/pomodoro/pomodoroService.ts
interface PomodoroSessionConfig {
  workDuration: number;    // Default: 25 minutes
  shortBreak: number;      // Default: 5 minutes
  longBreak: number;       // Default: 15 minutes
  sessionsBeforeLongBreak: number; // Default: 4
}

interface StartSessionRequest {
  userId: string;
  title: string;
  category?: string;
  okrCategory?: string;
  objectiveId?: string;
  duration?: number; // Custom duration in minutes
}

interface SessionInProgress {
  id: string;
  userId: string;
  startTime: Date;
  plannedDuration: number;
  isPaused: boolean;
  pauseStartTime?: Date;
  totalPauseDuration: number;
}

class PomodoroService {
  private activeSessions: Map<string, SessionInProgress> = new Map();

  async startSession(request: StartSessionRequest): Promise<TimeSession> {
    // Create session in database with status 'in_progress'
    const session = await prisma.timeSession.create({
      data: {
        userId: request.userId,
        title: request.title,
        category: request.category,
        okrCategory: request.okrCategory || await this.inferOKRCategory(request.category),
        objectiveId: request.objectiveId,
        startTime: new Date(),
        endTime: new Date(Date.now() + (request.duration || 25) * 60 * 1000),
        duration: 0, // Will update on completion
        focusQuality: 'FULL_FOCUS',
        isCompleted: false,
      }
    });

    // Track in memory for active session management
    this.activeSessions.set(session.id, {
      id: session.id,
      userId: request.userId,
      startTime: session.startTime,
      plannedDuration: request.duration || 25,
      isPaused: false,
      totalPauseDuration: 0,
    });

    return session;
  }

  async pauseSession(sessionId: string): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) throw new Error('Session not found');

    activeSession.isPaused = true;
    activeSession.pauseStartTime = new Date();
  }

  async resumeSession(sessionId: string): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession || !activeSession.isPaused) throw new Error('Invalid state');

    const pauseDuration = Date.now() - activeSession.pauseStartTime!.getTime();
    activeSession.totalPauseDuration += pauseDuration;
    activeSession.isPaused = false;
    activeSession.pauseStartTime = undefined;
  }

  async completeSession(
    sessionId: string,
    focusQuality: FocusQuality,
    notes?: string
  ): Promise<TimeSession> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) throw new Error('Session not found');

    const now = new Date();
    const totalDuration = Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000);
    const actualWorkDuration = totalDuration - activeSession.totalPauseDuration;

    const session = await prisma.timeSession.update({
      where: { id: sessionId },
      data: {
        endTime: now,
        duration: actualWorkDuration,
        pauseDuration: activeSession.totalPauseDuration,
        focusQuality,
        notes,
        isCompleted: true,
      }
    });

    this.activeSessions.delete(sessionId);
    return session;
  }

  async getActiveSession(userId: string): Promise<TimeSession | null> {
    return await prisma.timeSession.findFirst({
      where: {
        userId,
        isCompleted: false,
      },
      orderBy: { startTime: 'desc' }
    });
  }

  async getUserSessions(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSession[]> {
    return await prisma.timeSession.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        isCompleted: true,
      },
      orderBy: { startTime: 'desc' }
    });
  }

  private async inferOKRCategory(category?: string): Promise<string | null> {
    if (!category) return null;

    // Try to find existing mapping
    const mapping = await prisma.categoryMapping.findFirst({
      where: { categoryName: category, isActive: true }
    });

    return mapping?.okrCategory || null;
  }
}
```

#### 9.3 Category Mapping Service

```typescript
// backend/src/services/pomodoro/categoryMapper.ts
interface CategoryMappingConfig {
  categoryName: string;
  okrCategory: 'Relationship' | 'Career' | 'Leadership' | 'Academic' | 'Personal';
  defaultObjectiveId?: string;
  hexColor?: string;
}

class CategoryMapperService {
  async createMapping(userId: string, config: CategoryMappingConfig): Promise<CategoryMapping> {
    return await prisma.categoryMapping.create({
      data: {
        userId,
        categoryName: config.categoryName,
        okrCategory: config.okrCategory,
        defaultObjectiveId: config.defaultObjectiveId,
        hexColor: config.hexColor || this.getDefaultColor(config.okrCategory),
      }
    });
  }

  async getUserMappings(userId: string): Promise<CategoryMapping[]> {
    return await prisma.categoryMapping.findMany({
      where: { userId, isActive: true },
      orderBy: { categoryName: 'asc' }
    });
  }

  async updateMapping(mappingId: string, updates: Partial<CategoryMappingConfig>): Promise<CategoryMapping> {
    return await prisma.categoryMapping.update({
      where: { id: mappingId },
      data: updates,
    });
  }

  async createDefaultMappings(userId: string): Promise<void> {
    const defaultMappings: CategoryMappingConfig[] = [
      // Academic
      { categoryName: 'Study', okrCategory: 'Academic', hexColor: '#2C50CF' },
      { categoryName: 'Course Revision', okrCategory: 'Academic', hexColor: '#2C50CF' },
      { categoryName: 'Assignment', okrCategory: 'Academic', hexColor: '#2C50CF' },
      { categoryName: 'Exam Prep', okrCategory: 'Academic', hexColor: '#2C50CF' },

      // Career
      { categoryName: 'Career Research', okrCategory: 'Career', hexColor: '#7C3AED' },
      { categoryName: 'Interview Prep', okrCategory: 'Career', hexColor: '#7C3AED' },
      { categoryName: 'Networking', okrCategory: 'Career', hexColor: '#7C3AED' },
      { categoryName: 'Job Application', okrCategory: 'Career', hexColor: '#7C3AED' },

      // Leadership
      { categoryName: 'Presentation Prep', okrCategory: 'Leadership', hexColor: '#DC2626' },
      { categoryName: 'Club Activities', okrCategory: 'Leadership', hexColor: '#DC2626' },
      { categoryName: 'PDP Work', okrCategory: 'Leadership', hexColor: '#DC2626' },

      // Relationship
      { categoryName: 'Social', okrCategory: 'Relationship', hexColor: '#059669' },
      { categoryName: 'Community', okrCategory: 'Relationship', hexColor: '#059669' },
      { categoryName: 'Events', okrCategory: 'Relationship', hexColor: '#059669' },

      // Personal
      { categoryName: 'Personal Dev', okrCategory: 'Personal', hexColor: '#EA580C' },
      { categoryName: 'Automation', okrCategory: 'Personal', hexColor: '#EA580C' },
      { categoryName: 'Reading', okrCategory: 'Personal', hexColor: '#EA580C' },
    ];

    await Promise.all(
      defaultMappings.map(mapping => this.createMapping(userId, mapping))
    );
  }

  private getDefaultColor(okrCategory: string): string {
    const colors = {
      'Academic': '#2C50CF',
      'Career': '#7C3AED',
      'Leadership': '#DC2626',
      'Relationship': '#059669',
      'Personal': '#EA580C',
    };
    return colors[okrCategory] || '#6B7280';
  }
}
```

#### 9.4 API Endpoints

```typescript
// backend/src/routes/pomodoro.routes.ts
const router = express.Router();

// Session management
POST   /api/pomodoro/sessions/start          // Start new Pomodoro session
POST   /api/pomodoro/sessions/:id/pause      // Pause active session
POST   /api/pomodoro/sessions/:id/resume     // Resume paused session
POST   /api/pomodoro/sessions/:id/complete   // Complete session
GET    /api/pomodoro/sessions/active         // Get current active session
DELETE /api/pomodoro/sessions/:id            // Cancel/delete session

// Session history
GET    /api/pomodoro/sessions                // Get sessions (with date filters)
GET    /api/pomodoro/sessions/:id            // Get specific session
PUT    /api/pomodoro/sessions/:id            // Update session (title, notes, etc.)

// Category mappings
GET    /api/pomodoro/categories              // Get user's category mappings
POST   /api/pomodoro/categories              // Create new category mapping
PUT    /api/pomodoro/categories/:id          // Update category mapping
DELETE /api/pomodoro/categories/:id          // Delete category mapping
POST   /api/pomodoro/categories/init         // Initialize default mappings

// Analytics
GET    /api/pomodoro/stats/weekly            // Weekly time statistics
GET    /api/pomodoro/stats/by-category       // Time breakdown by category
GET    /api/pomodoro/stats/by-objective      // Time breakdown by objective
GET    /api/pomodoro/stats/focus-quality     // Focus quality analysis
```

#### 9.5 Frontend Components

**Pomodoro Timer Component**:

```typescript
// frontend/components/pomodoro/PomodoroTimer.tsx
export function PomodoroTimer() {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);

  return (
    <Card className="pomodoro-timer">
      <h2>Pomodoro Timer</h2>

      {!activeSession ? (
        <div className="timer-idle">
          <div className="timer-display">25:00</div>
          <Button onClick={() => setShowStartDialog(true)}>
            Start Session
          </Button>
        </div>
      ) : (
        <div className="timer-active">
          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>

          <div className="session-info">
            <p>{activeSession.title}</p>
            <Badge>{activeSession.category}</Badge>
          </div>

          <div className="timer-controls">
            {!isPaused ? (
              <Button onClick={handlePause}>Pause</Button>
            ) : (
              <Button onClick={handleResume}>Resume</Button>
            )}
            <Button variant="secondary" onClick={handleComplete}>
              Complete
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Start Session Dialog */}
      <StartSessionDialog
        open={showStartDialog}
        onClose={() => setShowStartDialog(false)}
        onStart={handleStartSession}
      />
    </Card>
  );
}

function StartSessionDialog({ open, onClose, onStart }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(25);

  const { data: categories } = useQuery({
    queryKey: ['pomodoro-categories'],
    queryFn: fetchCategories
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Pomodoro Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>What are you working on?</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finance Assignment 7"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.categoryName}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.hexColor }}
                      />
                      {cat.categoryName} ({cat.okrCategory})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <div className="flex gap-2">
              {[15, 25, 30, 45, 60].map((mins) => (
                <Button
                  key={mins}
                  variant={duration === mins ? 'default' : 'outline'}
                  onClick={() => setDuration(mins)}
                >
                  {mins}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onStart({ title, category, duration })}>
            Start Timer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Session History Component**:

```typescript
// frontend/components/pomodoro/SessionHistory.tsx
export function SessionHistory() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });

  const { data: sessions } = useQuery({
    queryKey: ['pomodoro-sessions', dateRange],
    queryFn: () => fetchSessions(dateRange)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </CardHeader>

      <CardContent>
        <div className="session-list">
          {sessions?.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({ session }: { session: TimeSession }) {
  return (
    <div className="session-card">
      <div className="session-header">
        <h4>{session.title}</h4>
        <Badge variant={getFocusQualityVariant(session.focusQuality)}>
          {session.focusQuality}
        </Badge>
      </div>

      <div className="session-details">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(session.duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <span>{session.category}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDateTime(session.startTime)}</span>
        </div>
      </div>

      {session.notes && (
        <p className="session-notes">{session.notes}</p>
      )}
    </div>
  );
}
```

**Category Management Component**:

```typescript
// frontend/components/pomodoro/CategoryManager.tsx
export function CategoryManager() {
  const { data: categories, refetch } = useQuery({
    queryKey: ['pomodoro-categories'],
    queryFn: fetchCategories
  });

  const { data: objectives } = useQuery({
    queryKey: ['objectives'],
    queryFn: fetchObjectives
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Mappings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Map Pomodoro categories to your OKR objectives
        </p>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>OKR Area</TableHead>
              <TableHead>Default Objective</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                objectives={objectives}
                onUpdate={refetch}
              />
            ))}
          </TableBody>
        </Table>

        <Button onClick={() => setShowAddDialog(true)} className="mt-4">
          Add Category
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Testing Checklist**:
- [ ] Start Pomodoro session with custom title and category
- [ ] Timer counts down correctly
- [ ] Pause and resume session
- [ ] Complete session with focus quality rating
- [ ] Cancel active session
- [ ] View session history
- [ ] Filter sessions by date range
- [ ] Create custom category mapping
- [ ] Update category mapping
- [ ] Map category to specific objective
- [ ] Delete category mapping
- [ ] Initialize default categories for new users

---

### Phase 10: Time Analytics & Insights
**Timeline**: 2-3 days
**Priority**: HIGH - Required for weekly check-in

#### 10.1 Time Analytics Service

```typescript
// backend/src/services/analytics/timeAnalytics.ts
interface TimeAllocation {
  okrCategory: string;
  totalMinutes: number;
  focusMinutes: number;      // FULL_FOCUS sessions only
  partialMinutes: number;    // PARTIAL_FOCUS sessions
  sessionCount: number;
  averageFocusQuality: number;
}

interface WeeklyTimeReport {
  weekStart: Date;
  weekEnd: Date;
  totalMinutes: number;
  totalSessions: number;
  byCategory: TimeAllocation[];
  byObjective: ObjectiveTimeAllocation[];
  byDay: DailyTimeBreakdown[];
  focusQualityTrend: FocusQualityPoint[];
  topActivities: ActivitySummary[];
  recommendations: string[];
}

interface ObjectiveTimeAllocation {
  objectiveId: string;
  objectiveTitle: string;
  totalMinutes: number;
  sessionCount: number;
  progress: number; // Current OKR progress %
}

interface DailyTimeBreakdown {
  date: Date;
  totalMinutes: number;
  sessionCount: number;
  categories: { [key: string]: number };
}

interface FocusQualityPoint {
  date: Date;
  fullFocusPercentage: number;
  partialFocusPercentage: number;
  interruptedPercentage: number;
}

class TimeAnalyticsService {
  async generateWeeklyReport(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyTimeReport> {
    const sessions = await prisma.timeSession.findMany({
      where: {
        userId,
        startTime: { gte: weekStart },
        endTime: { lte: weekEnd },
        isCompleted: true,
      },
      include: { objective: true }
    });

    return {
      weekStart,
      weekEnd,
      totalMinutes: this.calculateTotalMinutes(sessions),
      totalSessions: sessions.length,
      byCategory: this.groupByCategory(sessions),
      byObjective: this.groupByObjective(sessions),
      byDay: this.groupByDay(sessions, weekStart, weekEnd),
      focusQualityTrend: this.calculateFocusQualityTrend(sessions),
      topActivities: this.extractTopActivities(sessions),
      recommendations: await this.generateRecommendations(sessions),
    };
  }

  private groupByCategory(sessions: TimeSession[]): TimeAllocation[] {
    const grouped = new Map<string, TimeSession[]>();

    for (const session of sessions) {
      const category = session.okrCategory || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(session);
    }

    return Array.from(grouped.entries()).map(([category, sessions]) => ({
      okrCategory: category,
      totalMinutes: this.sumMinutes(sessions),
      focusMinutes: this.sumMinutes(sessions.filter(s => s.focusQuality === 'FULL_FOCUS')),
      partialMinutes: this.sumMinutes(sessions.filter(s => s.focusQuality === 'PARTIAL_FOCUS')),
      sessionCount: sessions.length,
      averageFocusQuality: this.calculateAverageFocusQuality(sessions),
    }));
  }

  private groupByObjective(sessions: TimeSession[]): ObjectiveTimeAllocation[] {
    const grouped = new Map<string, TimeSession[]>();

    for (const session of sessions.filter(s => s.objectiveId)) {
      if (!grouped.has(session.objectiveId!)) {
        grouped.set(session.objectiveId!, []);
      }
      grouped.get(session.objectiveId!)!.push(session);
    }

    return Array.from(grouped.entries()).map(([objectiveId, sessions]) => {
      const objective = sessions[0].objective;
      const progress = this.calculateObjectiveProgress(objective);

      return {
        objectiveId,
        objectiveTitle: objective?.title || 'Unknown',
        totalMinutes: this.sumMinutes(sessions),
        sessionCount: sessions.length,
        progress,
      };
    });
  }

  private groupByDay(
    sessions: TimeSession[],
    weekStart: Date,
    weekEnd: Date
  ): DailyTimeBreakdown[] {
    const days: DailyTimeBreakdown[] = [];

    for (let date = new Date(weekStart); date <= weekEnd; date.setDate(date.getDate() + 1)) {
      const daySessions = sessions.filter(s =>
        isSameDay(s.startTime, date)
      );

      const categories: { [key: string]: number } = {};
      for (const session of daySessions) {
        const cat = session.okrCategory || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + Math.floor(session.duration / 60);
      }

      days.push({
        date: new Date(date),
        totalMinutes: this.sumMinutes(daySessions),
        sessionCount: daySessions.length,
        categories,
      });
    }

    return days;
  }

  private calculateFocusQualityTrend(sessions: TimeSession[]): FocusQualityPoint[] {
    // Group by date
    const byDate = new Map<string, TimeSession[]>();

    for (const session of sessions) {
      const dateKey = format(session.startTime, 'yyyy-MM-dd');
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(session);
    }

    return Array.from(byDate.entries()).map(([dateKey, sessions]) => {
      const total = sessions.length;
      const fullFocus = sessions.filter(s => s.focusQuality === 'FULL_FOCUS').length;
      const partialFocus = sessions.filter(s => s.focusQuality === 'PARTIAL_FOCUS').length;
      const interrupted = sessions.filter(s => s.focusQuality === 'INTERRUPTED').length;

      return {
        date: new Date(dateKey),
        fullFocusPercentage: (fullFocus / total) * 100,
        partialFocusPercentage: (partialFocus / total) * 100,
        interruptedPercentage: (interrupted / total) * 100,
      };
    });
  }

  private extractTopActivities(sessions: TimeSession[]): ActivitySummary[] {
    // Group by title (activity type)
    const grouped = new Map<string, TimeSession[]>();

    for (const session of sessions) {
      if (!grouped.has(session.title)) {
        grouped.set(session.title, []);
      }
      grouped.get(session.title)!.push(session);
    }

    return Array.from(grouped.entries())
      .map(([title, sessions]) => ({
        title,
        totalMinutes: this.sumMinutes(sessions),
        sessionCount: sessions.length,
        category: sessions[0].okrCategory,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 10);
  }

  private async generateRecommendations(sessions: TimeSession[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Check balance across OKR categories
    const byCategory = this.groupByCategory(sessions);
    const totalMinutes = this.sumMinutes(sessions);

    for (const allocation of byCategory) {
      const percentage = (allocation.totalMinutes / totalMinutes) * 100;

      if (percentage < 10) {
        recommendations.push(
          `Consider increasing time on ${allocation.okrCategory} (currently ${percentage.toFixed(0)}% of total time)`
        );
      }
    }

    // Check focus quality
    const avgFocusQuality = this.calculateAverageFocusQuality(sessions);
    if (avgFocusQuality < 0.7) {
      recommendations.push(
        'Focus quality is below optimal. Try eliminating distractions during sessions.'
      );
    }

    // Check session consistency
    const byDay = this.groupByDay(sessions, startOfWeek(new Date()), endOfWeek(new Date()));
    const daysWithoutSessions = byDay.filter(d => d.sessionCount === 0).length;

    if (daysWithoutSessions > 2) {
      recommendations.push(
        `${daysWithoutSessions} days without any focused work sessions. Try to maintain consistency.`
      );
    }

    return recommendations;
  }

  private sumMinutes(sessions: TimeSession[]): number {
    return sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
  }

  private calculateAverageFocusQuality(sessions: TimeSession[]): number {
    if (sessions.length === 0) return 0;

    const qualityScores = {
      'FULL_FOCUS': 1.0,
      'PARTIAL_FOCUS': 0.7,
      'INTERRUPTED': 0.3,
      'REST': 0,
    };

    const totalScore = sessions.reduce((sum, s) =>
      sum + qualityScores[s.focusQuality], 0
    );

    return totalScore / sessions.length;
  }

  private calculateObjectiveProgress(objective: any): number {
    if (!objective || !objective.keyResults) return 0;

    const totalProgress = objective.keyResults.reduce((sum: number, kr: any) => {
      return sum + (Number(kr.currentValue) / Number(kr.targetValue)) * 100;
    }, 0);

    return totalProgress / objective.keyResults.length;
  }
}
```

#### 10.2 Analytics Dashboard Components

```typescript
// frontend/app/dashboard/time-analytics/page.tsx
export default function TimeAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });

  const { data: report } = useQuery({
    queryKey: ['time-report', dateRange],
    queryFn: () => fetchWeeklyTimeReport(dateRange)
  });

  if (!report) return <LoadingSpinner />;

  return (
    <div className="time-analytics">
      <div className="page-header">
        <h1>Time Analytics</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Time"
          value={`${report.totalMinutes} min`}
          description={`${report.totalSessions} sessions`}
        />
        <StatCard
          title="Focus Quality"
          value={`${calculateFocusScore(report)}%`}
          description="Average focus quality"
        />
        <StatCard
          title="Most Productive Day"
          value={getMostProductiveDay(report.byDay)}
          description="Highest time investment"
        />
        <StatCard
          title="Top Category"
          value={report.byCategory[0]?.okrCategory || 'N/A'}
          description={`${report.byCategory[0]?.totalMinutes || 0} min`}
        />
      </div>

      {/* Time Allocation by OKR Category */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation by Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeAllocationChart data={report.byCategory} />
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyTimeChart data={report.byDay} />
        </CardContent>
      </Card>

      {/* Focus Quality Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Quality Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <FocusQualityChart data={report.focusQualityTrend} />
        </CardContent>
      </Card>

      {/* Objective Progress vs Time Invested */}
      <Card>
        <CardHeader>
          <CardTitle>OKR Progress vs Time Invested</CardTitle>
        </CardHeader>
        <CardContent>
          <ObjectiveTimeChart data={report.byObjective} />
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="recommendations-list">
              {report.recommendations.map((rec, idx) => (
                <li key={idx}>
                  <Lightbulb className="w-4 h-4" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Testing Checklist**:
- [ ] Generate weekly time report
- [ ] Calculate time allocation by OKR category
- [ ] Calculate time allocation by specific objective
- [ ] Track daily time breakdown
- [ ] Calculate focus quality trend
- [ ] Identify top activities
- [ ] Generate personalized recommendations
- [ ] Display time allocation pie/bar chart
- [ ] Display daily time breakdown chart
- [ ] Display focus quality trend line
- [ ] Display objective progress vs time invested

---

### Phase 11: Weekly Check-in Workflow
**Timeline**: 4-5 days
**Priority**: CRITICAL - Core feature

#### 11.1 Weekly Check-in Orchestrator

```typescript
// backend/src/services/weeklyCheckin/checkinOrchestrator.ts
interface WeeklyCheckinRequest {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}

interface WeeklyCheckinResult {
  journalSummary: JournalSummary;
  timeAnalysis: WeeklyTimeReport;
  okrProgress: OKRProgressUpdate;
  activityCorrelation: CorrelatedActivity[];
  aiInsights: AIInsightReport;
  weeklyReport: string;  // Markdown
  weeklyJournal: string;  // Markdown
  newsletter: string;  // HTML
}

class WeeklyCheckinOrchestrator {
  constructor(
    private journalAnalyzer: JournalAnalyzer,
    private timeAnalytics: TimeAnalyticsService,
    private activityCorrelator: ActivityCorrelator,
    private okrUpdater: OKRUpdater,
    private aiService: AIService,
    private reportGenerator: WeeklyReportGenerator,
    private journalGenerator: WeeklyJournalGenerator,
    private newsletterGenerator: NewsletterGenerator
  ) {}

  async executeCheckin(request: WeeklyCheckinRequest): Promise<WeeklyCheckinResult> {
    console.log(`Starting weekly check-in for user ${request.userId}...`);

    // Step 1: Analyze daily journals
    console.log('Analyzing daily journals...');
    const journals = await this.getJournalEntries(request);
    const journalSummary = await this.journalAnalyzer.summarizeWeek(journals);

    // Step 2: Analyze Pomodoro time sessions
    console.log('Analyzing time sessions...');
    const timeAnalysis = await this.timeAnalytics.generateWeeklyReport(
      request.userId,
      request.weekStart,
      request.weekEnd
    );

    // Step 3: Get current OKR state
    console.log('Reading current OKRs...');
    const currentOKRs = await this.getCurrentOKRs(request.userId);

    // Step 4: Correlate activities from journals and time sessions
    console.log('Correlating activities with OKRs...');
    const activityCorrelation = await this.activityCorrelator.correlate(
      journalSummary,
      timeAnalysis,
      currentOKRs
    );

    // Step 5: Generate OKR update suggestions
    console.log('Generating OKR update suggestions...');
    const okrProgress = await this.okrUpdater.generateSuggestions(
      currentOKRs,
      activityCorrelation
    );

    // Step 6: Generate AI insights
    console.log('Generating AI insights...');
    const aiInsights = await this.aiService.generateWeeklyInsights({
      journals: journalSummary,
      timeAnalysis,
      okrProgress,
      activities: activityCorrelation,
    });

    // Step 7: Generate weekly report
    console.log('Generating weekly report...');
    const weeklyReport = await this.reportGenerator.generate({
      weekStart: request.weekStart,
      weekEnd: request.weekEnd,
      journalSummary,
      timeAnalysis,
      okrProgress,
      aiInsights,
    });

    // Step 8: Generate weekly journal
    console.log('Generating weekly journal...');
    const weeklyJournal = await this.journalGenerator.generate(
      journals,
      okrProgress,
      aiInsights
    );

    // Step 9: Generate newsletter
    console.log('Generating newsletter...');
    const newsletter = await this.newsletterGenerator.generate(
      journals,
      okrProgress,
      aiInsights
    );

    console.log('Weekly check-in completed!');

    return {
      journalSummary,
      timeAnalysis,
      okrProgress,
      activityCorrelation,
      aiInsights,
      weeklyReport,
      weeklyJournal,
      newsletter,
    };
  }

  private async getJournalEntries(request: WeeklyCheckinRequest): Promise<JournalEntry[]> {
    return await prisma.journalEntry.findMany({
      where: {
        userId: request.userId,
        entryDate: {
          gte: request.weekStart,
          lte: request.weekEnd,
        },
      },
      include: { template: true },
      orderBy: { entryDate: 'asc' }
    });
  }

  private async getCurrentOKRs(userId: string): Promise<Objective[]> {
    return await prisma.objective.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        keyResults: true,
      }
    });
  }
}
```

#### 11.2 Activity Correlation Service

```typescript
// backend/src/services/weeklyCheckin/activityCorrelator.ts
interface CorrelatedActivity {
  description: string;
  okrObjective: string;
  okrKeyResult?: string;
  sources: ('journal' | 'pomodoro')[];
  journalDate?: Date;
  pomodoroMinutes?: number;
  focusQuality?: number;
  impact: 'high' | 'medium' | 'low';
}

class ActivityCorrelator {
  async correlate(
    journalSummary: JournalSummary,
    timeAnalysis: WeeklyTimeReport,
    currentOKRs: Objective[]
  ): Promise<CorrelatedActivity[]> {
    const activities: CorrelatedActivity[] = [];

    // Map journal accomplishments to OKRs
    for (const accomplishment of journalSummary.accomplishments) {
      const okr = this.mapAccomplishmentToOKR(accomplishment, currentOKRs);

      if (okr) {
        activities.push({
          description: accomplishment.description,
          okrObjective: okr.objectiveTitle,
          okrKeyResult: okr.keyResultTitle,
          sources: ['journal'],
          journalDate: accomplishment.date,
          impact: accomplishment.impact,
        });
      }
    }

    // Map Pomodoro time to OKRs
    for (const allocation of timeAnalysis.byCategory) {
      const okr = this.mapCategoryToOKR(allocation.okrCategory, currentOKRs);

      if (okr) {
        activities.push({
          description: `${allocation.totalMinutes} minutes focused on ${allocation.okrCategory}`,
          okrObjective: okr.objectiveTitle,
          sources: ['pomodoro'],
          pomodoroMinutes: allocation.totalMinutes,
          focusQuality: allocation.averageFocusQuality,
          impact: this.calculateImpact(allocation.totalMinutes),
        });
      }
    }

    // Map objective-specific time sessions
    for (const objTime of timeAnalysis.byObjective) {
      const objective = currentOKRs.find(o => o.id === objTime.objectiveId);

      if (objective) {
        activities.push({
          description: `${objTime.totalMinutes} minutes on "${objTime.objectiveTitle}"`,
          okrObjective: objTime.objectiveTitle,
          sources: ['pomodoro'],
          pomodoroMinutes: objTime.totalMinutes,
          impact: this.calculateImpact(objTime.totalMinutes),
        });
      }
    }

    return this.mergeAndDeduplicateActivities(activities);
  }

  private mapAccomplishmentToOKR(
    accomplishment: AccomplishmentSummary,
    okrs: Objective[]
  ): { objectiveTitle: string, keyResultTitle?: string } | null {
    // Use simple keyword matching (can be enhanced with AI)
    const keywords = accomplishment.description.toLowerCase();

    // Map by category first
    const categoryMap = {
      'relationship': ['friend', 'social', 'network', 'connect', 'event'],
      'career': ['interview', 'application', 'job', 'career', 'company'],
      'leadership': ['present', 'lead', 'speak', 'pdp', 'club'],
      'academic': ['study', 'exam', 'assignment', 'course', 'class'],
    };

    for (const [category, words] of Object.entries(categoryMap)) {
      if (words.some(word => keywords.includes(word))) {
        const matchingObjective = okrs.find(o =>
          o.title.toLowerCase().includes(category) ||
          o.description?.toLowerCase().includes(category)
        );

        if (matchingObjective) {
          return {
            objectiveTitle: matchingObjective.title,
          };
        }
      }
    }

    return null;
  }

  private mapCategoryToOKR(
    okrCategory: string,
    okrs: Objective[]
  ): { objectiveTitle: string } | null {
    const matchingObjective = okrs.find(o =>
      o.title.toLowerCase().includes(okrCategory.toLowerCase())
    );

    return matchingObjective ? { objectiveTitle: matchingObjective.title } : null;
  }

  private calculateImpact(minutes: number): 'high' | 'medium' | 'low' {
    if (minutes >= 120) return 'high';
    if (minutes >= 60) return 'medium';
    return 'low';
  }

  private mergeAndDeduplicateActivities(activities: CorrelatedActivity[]): CorrelatedActivity[] {
    // Group similar activities
    const grouped = new Map<string, CorrelatedActivity[]>();

    for (const activity of activities) {
      const key = `${activity.okrObjective}-${activity.description.substring(0, 20)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(activity);
    }

    // Merge activities with same key
    return Array.from(grouped.values()).map(group => {
      if (group.length === 1) return group[0];

      // Merge multiple sources
      const merged = group[0];
      merged.sources = Array.from(new Set(group.flatMap(a => a.sources)));

      // Sum Pomodoro minutes if multiple entries
      const totalMinutes = group.reduce((sum, a) => sum + (a.pomodoroMinutes || 0), 0);
      if (totalMinutes > 0) {
        merged.pomodoroMinutes = totalMinutes;
      }

      return merged;
    });
  }
}
```

#### 11.3 OKR Update Suggestions

```typescript
// backend/src/services/weeklyCheckin/okrUpdater.ts
interface OKRUpdateSuggestion {
  keyResultId: string;
  keyResultTitle: string;
  objectiveTitle: string;
  currentProgress: number;
  suggestedProgress: number;
  reasoning: string;
  supportingActivities: CorrelatedActivity[];
  confidence: 'high' | 'medium' | 'low';
  userConfirmed: boolean;
}

interface OKRProgressUpdate {
  objectives: ObjectiveUpdate[];
  suggestions: OKRUpdateSuggestion[];
  appliedUpdates: OKRUpdateSuggestion[];
}

class OKRUpdater {
  constructor(private aiService: AIService) {}

  async generateSuggestions(
    currentOKRs: Objective[],
    activities: CorrelatedActivity[]
  ): Promise<OKRProgressUpdate> {
    const suggestions: OKRUpdateSuggestion[] = [];

    for (const objective of currentOKRs) {
      // Find activities related to this objective
      const relatedActivities = activities.filter(a =>
        a.okrObjective === objective.title
      );

      if (relatedActivities.length === 0) continue;

      // Generate suggestions for each key result
      for (const keyResult of objective.keyResults) {
        const suggestion = await this.generateKeyResultSuggestion(
          objective,
          keyResult,
          relatedActivities
        );

        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return {
      objectives: this.summarizeObjectiveProgress(currentOKRs, suggestions),
      suggestions,
      appliedUpdates: [],
    };
  }

  private async generateKeyResultSuggestion(
    objective: Objective,
    keyResult: KeyResult,
    activities: CorrelatedActivity[]
  ): Promise<OKRUpdateSuggestion | null> {
    // Use AI to generate suggestion
    const prompt = this.createSuggestionPrompt(objective, keyResult, activities);
    const aiResponse = await this.aiService.generateOKRSuggestion(prompt);

    if (!aiResponse.shouldUpdate) return null;

    const currentProgress = (Number(keyResult.currentValue) / Number(keyResult.targetValue)) * 100;
    const suggestedProgress = aiResponse.suggestedProgress;

    // Only suggest if there's meaningful progress
    if (suggestedProgress <= currentProgress + 5) return null;

    return {
      keyResultId: keyResult.id,
      keyResultTitle: keyResult.title,
      objectiveTitle: objective.title,
      currentProgress,
      suggestedProgress,
      reasoning: aiResponse.reasoning,
      supportingActivities: activities,
      confidence: aiResponse.confidence,
      userConfirmed: false,
    };
  }

  async applyConfirmedUpdates(
    confirmedSuggestions: OKRUpdateSuggestion[]
  ): Promise<void> {
    for (const suggestion of confirmedSuggestions) {
      const keyResult = await prisma.keyResult.findUnique({
        where: { id: suggestion.keyResultId }
      });

      if (!keyResult) continue;

      const newValue = (suggestion.suggestedProgress / 100) * Number(keyResult.targetValue);

      // Update key result
      await prisma.keyResult.update({
        where: { id: suggestion.keyResultId },
        data: {
          currentValue: newValue,
          updatedAt: new Date(),
        }
      });

      // Create audit trail
      await prisma.okrUpdate.create({
        data: {
          keyResultId: suggestion.keyResultId,
          previousValue: keyResult.currentValue,
          newValue,
          updateType: 'JOURNAL_SUGGESTED',
          notes: `Weekly check-in suggestion: ${suggestion.reasoning}`,
        }
      });
    }
  }

  private createSuggestionPrompt(
    objective: Objective,
    keyResult: KeyResult,
    activities: CorrelatedActivity[]
  ): string {
    return `Analyze if this key result should be updated based on weekly activities.

**Objective**: ${objective.title}
**Key Result**: ${keyResult.title}
**Current Progress**: ${keyResult.currentValue}/${keyResult.targetValue} ${keyResult.unit}

**This Week's Related Activities**:
${activities.map(a => `- ${a.description} (${a.sources.join(', ')})`).join('\n')}

**Task**: Determine if progress should be updated and by how much. Be conservative.

**Output JSON**:
{
  "shouldUpdate": boolean,
  "suggestedProgress": number (0-100),
  "reasoning": "explanation",
  "confidence": "high" | "medium" | "low"
}`;
  }

  private summarizeObjectiveProgress(
    okrs: Objective[],
    suggestions: OKRUpdateSuggestion[]
  ): ObjectiveUpdate[] {
    return okrs.map(obj => {
      const objSuggestions = suggestions.filter(s => s.objectiveTitle === obj.title);
      const avgCurrentProgress = this.calculateObjectiveProgress(obj);
      const avgSuggestedProgress = objSuggestions.length > 0
        ? objSuggestions.reduce((sum, s) => sum + s.suggestedProgress, 0) / objSuggestions.length
        : avgCurrentProgress;

      return {
        objectiveId: obj.id,
        objectiveTitle: obj.title,
        currentProgress: avgCurrentProgress,
        suggestedProgress: avgSuggestedProgress,
        changePercentage: avgSuggestedProgress - avgCurrentProgress,
        keyResultSuggestions: objSuggestions.length,
      };
    });
  }

  private calculateObjectiveProgress(objective: Objective): number {
    if (objective.keyResults.length === 0) return 0;

    const totalProgress = objective.keyResults.reduce((sum, kr) => {
      return sum + (Number(kr.currentValue) / Number(kr.targetValue)) * 100;
    }, 0);

    return totalProgress / objective.keyResults.length;
  }
}
```

#### 11.4 API Endpoints

```typescript
// backend/src/routes/weeklyCheckin.routes.ts
POST   /api/weekly-checkin/start           // Start weekly check-in process
GET    /api/weekly-checkin/status/:id      // Get check-in progress status
POST   /api/weekly-checkin/confirm-okr     // Confirm specific OKR updates
POST   /api/weekly-checkin/apply-updates   // Apply all confirmed updates
POST   /api/weekly-checkin/finalize        // Finalize and save reports
GET    /api/weekly-checkin/result/:id      // Get complete check-in result
GET    /api/weekly-checkin/reports         // List all past check-ins
```

**Testing Checklist**:
- [ ] Start weekly check-in process
- [ ] Analyze all 7 daily journals
- [ ] Analyze Pomodoro sessions for week
- [ ] Correlate journal accomplishments with OKRs
- [ ] Correlate Pomodoro time with OKRs
- [ ] Generate OKR update suggestions with reasoning
- [ ] Display suggestions in UI for confirmation
- [ ] Apply confirmed OKR updates
- [ ] Generate AI insights
- [ ] Track check-in progress status

---

### Phase 12: Report Generation
**Timeline**: 3-4 days
**Priority**: HIGH - Required output

#### 12.1 Weekly Report Generator

```typescript
// backend/src/services/reports/weeklyReportGenerator.ts
class WeeklyReportGenerator {
  async generate(data: WeeklyReportData): Promise<string> {
    const sections = [
      this.generateHeader(data),
      this.generateExecutiveSummary(data),
      this.generateOKRProgress(data),
      this.generateJournalInsights(data),
      this.generateTimeAnalysis(data),
      this.generateEfficiencyMetrics(data),
      this.generateAIInsights(data),
      this.generateRecommendations(data),
      this.generateVisualCharts(data),
      this.generateLookingAhead(data),
    ];

    return sections.join('\n\n---\n\n');
  }

  private generateHeader(data: WeeklyReportData): string {
    return `# Weekly OKR Report: ${format(data.weekStart, 'MMMM d')} - ${format(data.weekEnd, 'd, yyyy')}

**Reporting Period**: Week of ${format(data.weekStart, 'MMM d')} - ${format(data.weekEnd, 'MMM d, yyyy')}
**Overall Progress**: ${data.okrProgress.previousOverall || 0}% → ${data.okrProgress.currentOverall || 0}% (+${data.okrProgress.weeklyChange || 0}%)
**Weekly Momentum**: ${this.calculateMomentum(data)}

---`;
  }

  private generateExecutiveSummary(data: WeeklyReportData): string {
    const highlights = data.aiInsights.highlights || [];

    return `## 📊 Executive Summary

**Key Highlights**:
${highlights.map(h => `- ${h}`).join('\n')}

**This Week's Impact**:
- 📝 **Journal Entries**: ${data.journalSummary.totalEntries}/7 days
- ⏱️ **Focus Time**: ${data.timeAnalysis.totalMinutes} minutes (${data.timeAnalysis.totalSessions} sessions)
- 🎯 **OKR Progress**: ${data.okrProgress.suggestions.length} key results advanced
- ⭐ **Average Mood**: ${data.journalSummary.averageMood.toFixed(1)}/10
- ⚡ **Average Energy**: ${data.journalSummary.averageEnergy.toFixed(1)}/10`;
  }

  private generateOKRProgress(data: WeeklyReportData): string {
    let output = `## 🎯 Progress by Objective\n\n`;

    for (const objective of data.okrProgress.objectives) {
      output += `### ${objective.objectiveTitle}\n`;
      output += `**Progress**: ${objective.currentProgress.toFixed(0)}% → ${objective.suggestedProgress.toFixed(0)}% `;
      output += `(${objective.changePercentage >= 0 ? '+' : ''}${objective.changePercentage.toFixed(0)}%)\n\n`;

      const objSuggestions = data.okrProgress.suggestions.filter(
        s => s.objectiveTitle === objective.objectiveTitle
      );

      if (objSuggestions.length > 0) {
        output += `#### Key Results Updates:\n`;
        for (const suggestion of objSuggestions) {
          output += `- **${suggestion.keyResultTitle}**: ${suggestion.currentProgress.toFixed(0)}% → ${suggestion.suggestedProgress.toFixed(0)}%\n`;
          output += `  - Reasoning: ${suggestion.reasoning}\n`;
          output += `  - Supporting Evidence: ${suggestion.supportingActivities.length} activities\n`;
        }
        output += '\n';
      }
    }

    return output;
  }

  private generateJournalInsights(data: WeeklyReportData): string {
    return `## 📖 Journal Insights

**Mood & Energy Trends**:
- Mood: ${data.journalSummary.moodTrend} (avg ${data.journalSummary.averageMood.toFixed(1)}/10)
- Energy: ${data.journalSummary.energyTrend} (avg ${data.journalSummary.averageEnergy.toFixed(1)}/10)

**Key Themes**:
${data.journalSummary.keyThemes.map(theme => `- ${theme}`).join('\n')}

**Top Accomplishments**:
${data.journalSummary.accomplishments
  .filter(a => a.impact === 'high')
  .slice(0, 5)
  .map(a => `- ${a.description} (${format(a.date, 'MMM d')})`)
  .join('\n')}

**Challenges & Blockers**:
${data.journalSummary.challenges.slice(0, 3).map(c => `- ${c}`).join('\n')}

**Gratitude Highlights**:
${data.journalSummary.gratitudes.slice(0, 3).map(g => `- ${g}`).join('\n')}`;
  }

  private generateTimeAnalysis(data: WeeklyReportData): string {
    return `## ⏱️ Time Analysis

**Total Focus Time**: ${data.timeAnalysis.totalMinutes} minutes (${Math.floor(data.timeAnalysis.totalMinutes / 60)}h ${data.timeAnalysis.totalMinutes % 60}m)
**Total Sessions**: ${data.timeAnalysis.totalSessions}
**Average Session Length**: ${Math.floor(data.timeAnalysis.totalMinutes / data.timeAnalysis.totalSessions)} minutes

**Time Allocation by Goal**:
${data.timeAnalysis.byCategory
  .sort((a, b) => b.totalMinutes - a.totalMinutes)
  .map(cat => {
    const percentage = (cat.totalMinutes / data.timeAnalysis.totalMinutes) * 100;
    return `- **${cat.okrCategory}**: ${cat.totalMinutes} min (${percentage.toFixed(0)}%) - ${cat.sessionCount} sessions`;
  })
  .join('\n')}

**Daily Breakdown**:
${data.timeAnalysis.byDay.map(day =>
  `- ${format(day.date, 'EEE, MMM d')}: ${day.totalMinutes} min (${day.sessionCount} sessions)`
).join('\n')}`;
  }

  private generateEfficiencyMetrics(data: WeeklyReportData): string {
    const focusQuality = this.calculateOverallFocusQuality(data.timeAnalysis);

    return `## 📈 Efficiency Metrics

**Focus Quality**:
- Overall Score: ${(focusQuality * 100).toFixed(0)}%
- Full Focus Sessions: ${this.countFocusType(data.timeAnalysis, 'FULL_FOCUS')}
- Partial Focus Sessions: ${this.countFocusType(data.timeAnalysis, 'PARTIAL_FOCUS')}
- Interrupted Sessions: ${this.countFocusType(data.timeAnalysis, 'INTERRUPTED')}

**Productivity Insights**:
${data.timeAnalysis.recommendations.map(rec => `- ${rec}`).join('\n')}`;
  }

  private generateAIInsights(data: WeeklyReportData): string {
    return `## 🤖 AI-Powered Insights

${data.aiInsights.summary}

**Patterns Identified**:
${data.aiInsights.patterns.map(p => `- ${p}`).join('\n')}

**Growth Observations**:
${data.aiInsights.growthPatterns.map(g => `- ${g}`).join('\n')}`;
  }

  private generateRecommendations(data: WeeklyReportData): string {
    return `## 💡 Recommendations for Next Week

${data.aiInsights.recommendations.map(rec => `- ${rec}`).join('\n')}

**Action Items**:
${this.generateActionItems(data).map(item => `- [ ] ${item}`).join('\n')}`;
  }

  private generateVisualCharts(data: WeeklyReportData): string {
    return `## 📊 Visual Progress

### OKR Trajectory (Last 7 Weeks)
\`\`\`
${this.generateOKRTrajectoryChart(data)}
\`\`\`

### Time Allocation
\`\`\`
${this.generateTimeAllocationChart(data)}
\`\`\`

### Mood & Energy Trend
\`\`\`
${this.generateMoodEnergyChart(data)}
\`\`\``;
  }

  private generateOKRTrajectoryChart(data: WeeklyReportData): string {
    // ASCII art chart showing weekly progress
    // Similar to current reports
    return `60% |
55% |                                ●━━━━ This week: +${data.okrProgress.weeklyChange}%
50% |
45% |                        ●━━━━━━┘
40% |                  ●━━━━━┘
35% |            ●━━━━━┘
30% |      ●━━━━━┘
25% |●━━━━━┘
    └────────────────────────────────────────────────────
    Wk1   Wk2   Wk3   Wk4   Wk5   Wk6   Wk7`;
  }

  private generateTimeAllocationChart(data: WeeklyReportData): string {
    // ASCII bar chart for time allocation
    const maxMinutes = Math.max(...data.timeAnalysis.byCategory.map(c => c.totalMinutes));

    return data.timeAnalysis.byCategory
      .map(cat => {
        const barLength = Math.floor((cat.totalMinutes / maxMinutes) * 40);
        const bar = '█'.repeat(barLength);
        return `${cat.okrCategory.padEnd(15)} ${bar} ${cat.totalMinutes}min`;
      })
      .join('\n');
  }

  private generateMoodEnergyChart(data: WeeklyReportData): string {
    // Line chart showing mood and energy over the week
    // Using ASCII art
    return `10 |     ●━━━●     ●━━━━━━●    Mood
   |    ╱     ╲   ╱
 5 |   ●       ●━●
   |  ╱                      Energy
 0 |━●━━━━━━━━━━━━━━━━━━━━━
   └─────────────────────────
   Mon  Tue  Wed  Thu  Fri  Sat  Sun`;
  }

  private generateLookingAhead(data: WeeklyReportData): string {
    return `## 🔮 Looking Ahead

**Focus Areas for Next Week**:
${this.identifyNextWeekFocus(data).map(focus => `- ${focus}`).join('\n')}

**Recommended Time Allocation**:
${this.recommendTimeAllocation(data).map(rec => `- ${rec}`).join('\n')}

---

*Generated by Weekly Check-in on ${new Date().toISOString()}*`;
  }

  // Helper methods
  private calculateMomentum(data: WeeklyReportData): string {
    const change = data.okrProgress.weeklyChange || 0;
    if (change >= 10) return '🔥 Exceptional Growth Week!';
    if (change >= 5) return '🚀 Strong Progress Week!';
    if (change > 0) return '↗️ Steady Growth';
    if (change === 0) return '→ Maintaining Pace';
    return '↘️ Needs Attention';
  }

  private calculateOverallFocusQuality(timeAnalysis: WeeklyTimeReport): number {
    // Calculate based on focus quality trend
    return 0.8; // Placeholder
  }

  private countFocusType(timeAnalysis: WeeklyTimeReport, type: string): number {
    // Count sessions by focus type
    return 0; // Placeholder
  }

  private generateActionItems(data: WeeklyReportData): string[] {
    // Generate actionable items based on data
    return [
      'Review and confirm OKR progress updates',
      'Address challenges identified in journal entries',
      'Plan next week's focus sessions',
    ];
  }

  private identifyNextWeekFocus(data: WeeklyReportData): string[] {
    // AI-powered or rule-based next week focus
    return [
      'Continue momentum on high-performing objectives',
      'Increase time on under-resourced goals',
      'Address blockers identified this week',
    ];
  }

  private recommendTimeAllocation(data: WeeklyReportData): string[] {
    // Recommend time distribution for next week
    return data.timeAnalysis.byCategory.map(cat =>
      `${cat.okrCategory}: ${Math.ceil(cat.totalMinutes * 1.1)} min (+10%)`
    );
  }
}
```

**Save to Database**:

```typescript
// backend/src/services/reports/reportStorage.ts
class ReportStorage {
  async saveWeeklyCheckin(
    userId: string,
    checkinResult: WeeklyCheckinResult
  ): Promise<string> {
    const checkin = await prisma.weeklyCheckin.create({
      data: {
        userId,
        weekStart: checkinResult.weekStart,
        weekEnd: checkinResult.weekEnd,
        weeklyReport: checkinResult.weeklyReport,
        weeklyJournal: checkinResult.weeklyJournal,
        newsletter: checkinResult.newsletter,
        journalSummary: checkinResult.journalSummary,
        timeAnalysis: checkinResult.timeAnalysis,
        okrProgress: checkinResult.okrProgress,
        aiInsights: checkinResult.aiInsights,
      }
    });

    return checkin.id;
  }

  async getCheckinHistory(userId: string): Promise<WeeklyCheckin[]> {
    return await prisma.weeklyCheckin.findMany({
      where: { userId },
      orderBy: { weekEnd: 'desc' },
      take: 10,
    });
  }
}
```

Add to schema:

```prisma
model WeeklyCheckin {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  weekStart       DateTime @map("week_start") @db.Date
  weekEnd         DateTime @map("week_end") @db.Date
  weeklyReport    String   @map("weekly_report") @db.Text
  weeklyJournal   String   @map("weekly_journal") @db.Text
  newsletter      String   @db.Text
  journalSummary  Json     @map("journal_summary")
  timeAnalysis    Json     @map("time_analysis")
  okrProgress     Json     @map("okr_progress")
  aiInsights      Json     @map("ai_insights")
  createdAt       DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, weekEnd])
  @@map("weekly_checkins")
}

model User {
  // ... existing fields ...
  weeklyCheckins  WeeklyCheckin[]
}
```

#### 12.2 Weekly Journal Generator

(Continue with newsletter generator and frontend integration as in Phase 13-15...)

**Testing Checklist**:
- [ ] Generate complete weekly report with all sections
- [ ] Generate ASCII art charts
- [ ] Include accurate data and metrics
- [ ] Generate weekly journal narrative
- [ ] Generate HTML newsletter
- [ ] Save reports to database
- [ ] Retrieve checkin history

---

*[Continue with Phases 13-15 in next section...]*

**Timeline Summary**:
- Phase 9: Pomodoro Timer (3-4 days)
- Phase 10: Time Analytics (2-3 days)
- Phase 11: Weekly Check-in (4-5 days)
- Phase 12: Report Generation (3-4 days)
- Phase 13: Frontend Integration (3-4 days)
- Phase 14: AI Enhancement (2-3 days)
- Phase 15: Testing & Polish (2-3 days)

**Total: 19-28 days (4-6 weeks)**
