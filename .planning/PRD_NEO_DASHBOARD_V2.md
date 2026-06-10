# PRD: Neo Dashboard v2
**Product Requirements Document**  
**Project:** Visual Project Dashboard + Quick Wins + Content Calendar  
**Date:** February 1, 2026  
**Owner:** Rob Spain  
**Location:** robspain.com/admin

---

## 🎯 Problem

Current task list at robspain.com/admin is:
- Overwhelming wall of text
- No visual hierarchy
- Can't see project status at a glance
- No content planning view
- Hard to know what's quick vs. deep work

---

## 🚀 Solution: 3 New Components

### 1. Project Dashboard (Visual Cards)

**Purpose:** See all active projects at a glance with progress

```
┌─────────────────────────────────────────────┐
│  🟢 Active Projects                         │
│                                             │
│  ┌───────────────┐  ┌───────────────┐      │
│  │ 📝 IEP Goal   │  │ 🎓 Learning   │      │
│  │    Writer     │  │   Platform    │      │
│  │               │  │               │      │
│  │ ▓▓▓▓░░░░░░   │  │ ▓▓▓▓▓▓▓▓░░   │      │
│  │     40%      │  │     80%      │      │
│  │               │  │               │      │
│  │ 🔨 Building   │  │ 🔧 Polish    │      │
│  └───────────────┘  └───────────────┘      │
│                                             │
│  ┌───────────────┐  ┌───────────────┐      │
│  │ 🏫 KCUSD     │  │ 📱 Neo iOS   │      │
│  │    Site      │  │    App       │      │
│  │ ▓▓▓▓▓▓▓▓▓▓   │  │ ▓▓░░░░░░░░   │      │
│  │    Done ✅   │  │     20%      │      │
│  └───────────────┘  └───────────────┘      │
│                                             │
│  ⏸️ Blocked / Waiting on Rob:              │
│  • 📞 Phone calling - need Twilio creds    │
│  • 🐦 Grok search - need xAI API key       │
└─────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface Project {
  id: string;
  name: string;
  emoji: string;
  status: 'active' | 'blocked' | 'done' | 'paused';
  progress: number; // 0-100
  phase: string; // "Building", "Polish", "Testing"
  blockedReason?: string;
  lastUpdated: Date;
  prdPath?: string; // Link to PRD
}
```

**Features:**
- Click card → expand to see phases/tasks
- Color glow based on status (green=active, yellow=blocked, gray=paused)
- "Last updated" shows when Neo touched it
- Quick "unblock" button for blocked items

---

### 2. Quick Wins Section

**Purpose:** 5-15 minute tasks Rob can knock out fast

```
┌─────────────────────────────────────────────┐
│  ⚡ Quick Wins (5-15 min each)              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☐ Review IEP Writer landing copy    │   │
│  │   📄 Preview | ✅ Approve | ✏️ Edit │   │
│  │   Est: 5 min                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☐ Approve email welcome sequence    │   │
│  │   📄 Preview | ✅ Approve | ✏️ Edit │   │
│  │   Est: 10 min                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ☐ Sign up for Twilio account        │   │
│  │   🔗 Go to Twilio | ✅ Done         │   │
│  │   Est: 5 min                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Completed today: 3 ✅                      │
└─────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface QuickWin {
  id: string;
  title: string;
  description?: string;
  estimateMinutes: number; // 5, 10, 15
  type: 'approve' | 'review' | 'signup' | 'decision' | 'action';
  previewUrl?: string;
  actionUrl?: string;
  status: 'pending' | 'done';
  createdAt: Date;
  completedAt?: Date;
  relatedProject?: string;
}
```

**Features:**
- Sorted by time estimate (fastest first)
- One-tap approve for simple items
- Preview button shows content inline
- Completion celebration animation
- "Add Quick Win" for Rob to capture ideas

---

### 3. Content Calendar

**Purpose:** Plan and visualize content across channels

```
┌─────────────────────────────────────────────┐
│  📅 Content Calendar - February 2026        │
│  ◀ Jan                              Mar ▶   │
├─────────────────────────────────────────────┤
│  Mon    Tue    Wed    Thu    Fri    Sat    │
├─────────────────────────────────────────────┤
│  3      4      5      6      7      8      │
│  📧     🎥            📧     💼            │
│  Email  YT            Email  LI            │
│                                             │
│  10     11     12     13     14     15     │
│         📧            🎥     📧            │
│         Email         YT     Email         │
│                                             │
│  Legend:                                    │
│  📧 Email  🎥 YouTube  💼 LinkedIn         │
│  📝 Blog   🐦 Twitter  📱 Social           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📋 Upcoming Content                        │
│                                             │
│  Feb 4 - 🎥 YouTube                        │
│  "5 Mistakes School BCBAs Make"            │
│  Status: 🟡 Script drafted, needs review   │
│  [Preview] [Approve] [Reschedule]          │
│                                             │
│  Feb 5 - 📧 Email                          │
│  "CalABA Preview - What I'm Presenting"    │
│  Status: 🟢 Ready to send                  │
│  [Preview] [Approve] [Reschedule]          │
└─────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface ContentItem {
  id: string;
  title: string;
  channel: 'email' | 'youtube' | 'linkedin' | 'twitter' | 'blog';
  scheduledDate: Date;
  status: 'idea' | 'drafting' | 'review' | 'approved' | 'published';
  contentDraft?: string;
  previewUrl?: string;
  publishUrl?: string;
  tags?: string[];
}
```

**Features:**
- Month view with channel icons
- Click date → see/add content
- Drag to reschedule
- Status colors (red=overdue, yellow=needs review, green=ready)
- Quick approve from calendar
- "Content gap" warnings (no email scheduled this week!)

---

## 🎨 UI/UX Design

### Layout (robspain.com/admin)

```
┌─────────────────────────────────────────────┐
│  Neo Dashboard                    [+ Add]   │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Projects (40%)  │  Quick Wins (60%)        │
│                  │                          │
│  [Project Cards] │  [Quick Win List]        │
│                  │                          │
│                  │                          │
├──────────────────┴──────────────────────────┤
│                                             │
│  Content Calendar (full width)              │
│                                             │
│  [Month View]     [Upcoming List]           │
│                                             │
└─────────────────────────────────────────────┘
```

### Mobile (Stacked)
```
┌───────────────────┐
│ ⚡ Quick Wins     │  ← First (most actionable)
├───────────────────┤
│ 📊 Projects       │
├───────────────────┤
│ 📅 Calendar       │
└───────────────────┘
```

---

## 🗄️ Database (Supabase)

### Tables

**projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  phase TEXT,
  blocked_reason TEXT,
  prd_path TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**quick_wins**
```sql
CREATE TABLE quick_wins (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  estimate_minutes INTEGER DEFAULT 10,
  type TEXT DEFAULT 'action',
  preview_url TEXT,
  action_url TEXT,
  status TEXT DEFAULT 'pending',
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**content_calendar**
```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  scheduled_date DATE,
  status TEXT DEFAULT 'idea',
  content_draft TEXT,
  preview_url TEXT,
  publish_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Development Phases

### Phase 1: Project Dashboard (Tonight)
- Project cards with progress bars
- Status colors
- Blocked section
- Click to expand

### Phase 2: Quick Wins (Tonight)
- Quick win list
- One-tap approve
- Completion tracking
- Time estimates

### Phase 3: Content Calendar (Tomorrow)
- Month view
- Channel icons
- Click to view/edit
- Upcoming content list

---

## 📊 Success Metrics

- **Quick Wins completed per day** (target: 3+)
- **Time on dashboard** (should be quick - glance and go)
- **Content published on schedule** (target: 90%+)
- **Blocked items cleared within 24h**

---

## 🔗 Integration Points

### Neo (Clawdbot) Integration
- Neo can add Quick Wins via API
- Neo can update project progress
- Neo can schedule content items
- Neo can mark items as "waiting on Rob"

### API Endpoints
```
POST /api/quick-wins      - Add quick win
PATCH /api/quick-wins/:id - Complete/update
GET /api/projects         - List projects
PATCH /api/projects/:id   - Update progress
POST /api/content         - Schedule content
```

---

**Created:** February 1, 2026  
**Owner:** Rob Spain + Neo
