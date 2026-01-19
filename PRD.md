# Daily Progress - Product Requirements Document (PRD)

## Overview

**App Name:** Daily Progress
**Current URL:** https://daily-progress-eta.vercel.app
**Repository:** /Users/scottbell/code/health-tracker
**Current Stack:** React 19, Vite, TypeScript, Tailwind CSS

### Problem Statement

The app currently stores all data in browser localStorage, which means:
- Data is lost when clearing browser data or switching devices
- Workouts have already been lost due to this limitation
- No way to access data from multiple devices (phone, laptop, etc.)

### Goals

1. **Data Persistence** - Move from localStorage to cloud database so data is never lost
2. **User Authentication** - Secure login so each user has their own isolated data
3. **Visual Refresh** - Inherit modern design system from the Flavor Pairings app
4. **Workout Templates** - Save and reuse common workout routines

---

## Phase 1: Authentication & Persistence (Priority: HIGH)

### Backend: Supabase

**Why Supabase:**
- PostgreSQL database with real-time capabilities
- Built-in authentication (no third-party needed)
- Generous free tier
- Works seamlessly with Vercel deployments
- Row-level security for data isolation

### Authentication Methods

| Method | Description | Implementation |
|--------|-------------|----------------|
| Email/Password | Traditional sign up/login | Supabase Auth built-in |
| Magic Link | Passwordless email login | Supabase Auth built-in |
| Google OAuth | (Future) Easy to add later | Toggle in Supabase dashboard |

**Auth Flow:**
1. User lands on app → sees login/signup screen
2. Can choose email/password OR magic link
3. Email verification required for new accounts
4. After auth, redirected to main app
5. Session persists until logout

### Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- auth.users - automatic

-- User profiles (optional, for display name etc.)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'lb',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily metrics (weight, steps)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  steps INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within workouts
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets within exercises
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL, -- e.g., "12 x 135", "AMRAP @ BW"
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own metrics" ON daily_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own exercises" ON exercises FOR ALL USING (
  workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own sets" ON workout_sets FOR ALL USING (
  exercise_id IN (SELECT id FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()))
);
```

### Data Migration

**Decision:** Start fresh - no migration of existing localStorage data.

The old localStorage data will be ignored. Users start with a clean slate when they create an account.

### Multi-User Support

- Full user registration flow
- Each user's data is completely isolated via Row Level Security
- App can be shared with friends/family - everyone gets their own account

---

## Phase 2: Visual Refresh (Priority: MEDIUM)

### Design System from Flavor Pairings

Import the following from `/Users/scottbell/code/flavor-pairings/src/app/globals.css`:

**Include:**
- CSS custom properties (color palette)
- Light/dark mode color schemes
- Modern shadow system (`--shadow-xs` through `--shadow-xl`)
- Card styling (`.card-elevated`)
- Input styling (`.input-modern`, `.input-glow-wrapper`)
- Chip/tag styling
- Fade-in animations
- Theme toggle component

**Exclude:**
- Dot grid background (`.dot-grid`, `.dot-grid-glow`)
- Gradient orbs in main app (keep for login screen only)
- Mouse glow effect

### Dark Mode Implementation

| Aspect | Implementation |
|--------|----------------|
| Default | Match system preference (`prefers-color-scheme`) |
| Toggle | User can manually switch between light/dark |
| Persistence | Save preference to user profile in database |
| Class | Apply `.dark` class to `<html>` element |

### Login Screen Special Treatment

The login/signup screen will include:
- Gradient orbs background (animated)
- Full design system styling
- Clean, welcoming aesthetic

Once logged in, the main app will have:
- Clean background (no orbs, no dot grid)
- Shadow system for depth
- Modern input styling
- Subtle animations

### Typography & Colors

```css
:root {
  /* From Flavor Pairings */
  --background: #fafafa;
  --foreground: #171717;
  --card: #ffffff;
  --card-hover: #f5f5f5;
  --border: rgba(0, 0, 0, 0.06);
  --muted: #737373;
  --accent: #2563eb;
  /* ... full palette */
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  /* ... dark variants */
}
```

---

## Phase 3: Workout Templates (Priority: LOW)

### Overview

Allow users to save workout structures for reuse, pre-filled with their last used weights.

### Template Creation

**Method:** Save from existing workout

After completing/logging a workout, user can tap "Save as Template" which:
1. Captures the exercise names and set structure
2. Stores the weights/reps used as "last used" values
3. Prompts for a template name (e.g., "Push Day", "Full Body A")

### Template Data Structure

```sql
-- Workout templates
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template exercises
CREATE TABLE template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template sets (with last used values)
CREATE TABLE template_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_exercise_id UUID REFERENCES template_exercises(id) ON DELETE CASCADE NOT NULL,
  last_used_note TEXT, -- e.g., "12 x 135" from last workout
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Using a Template

1. User starts new workout
2. Option to "Start from Template"
3. Select template from list
4. Workout is pre-populated with:
   - All exercises from template
   - Set count matches template
   - Notes pre-filled with last used weights/reps
5. User can modify anything before/during workout
6. On save, template's "last used" values update automatically

### Template Management

- View all templates in a dedicated section
- Edit template name
- Delete templates
- Templates are user-specific (RLS enforced)

---

## Technical Implementation Notes

### Framework Decision

**Keep Vite + React** - Do not migrate to Next.js

Reasoning:
- Supabase client works perfectly with Vite
- Less migration work
- Current app structure is fine for a SPA
- Can always migrate later if SSR becomes needed

### Package Additions

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-ui-react": "^0.4.x",  // Optional: pre-built auth components
    "@supabase/auth-ui-shared": "^0.1.x"
  }
}
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### File Structure Changes

```
src/
├── lib/
│   └── supabase.ts          # Supabase client initialization
├── hooks/
│   ├── useAuth.ts           # Authentication hook
│   ├── useWorkouts.ts       # Workout CRUD operations
│   ├── useMetrics.ts        # Daily metrics operations
│   └── useTemplates.ts      # Template operations (Phase 3)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthLayout.tsx   # With gradient orbs
│   └── ui/
│       └── ThemeToggle.tsx
├── context/
│   └── AuthContext.tsx      # Auth state management
└── screens/
    └── AuthScreen.tsx       # Login/Signup screen
```

---

## Rollout Plan

> **Process:** Complete each phase fully, including verification testing, before moving to the next phase.

### Phase 1: Auth + Persistence

**Implementation:**
1. Set up Supabase project
2. Create database schema with RLS policies
3. Implement auth flow (login, signup, magic link)
4. Migrate data layer from localStorage to Supabase
5. Deploy to Vercel

**Verification Testing:**
- [ ] Can create new account with email/password
- [ ] Can log in with existing account
- [ ] Can log in via magic link (check email delivery)
- [ ] Logging out clears session, redirects to login
- [ ] New workout saves to database (check Supabase dashboard)
- [ ] Daily metrics (weight, steps) save to database
- [ ] Editing a workout updates the database
- [ ] Deleting a workout removes from database
- [ ] Data persists after browser refresh
- [ ] Data accessible from different browser/device when logged in
- [ ] User A cannot see User B's data (RLS working)

---

### Phase 1.5: Offline Support

**Implementation:**
1. Set up local cache layer (IndexedDB or localStorage)
2. Implement sync queue for offline mutations
3. Add online/offline detection
4. Process sync queue when coming back online
5. Enhance PWA service worker for app shell caching
6. Add offline indicator to UI
7. Deploy

**Verification Testing:**
- [ ] App loads when offline (airplane mode)
- [ ] Can view existing workouts when offline
- [ ] Can add new workout when offline
- [ ] Can edit workout when offline
- [ ] Coming back online syncs queued changes to Supabase
- [ ] Data matches between local cache and database after sync
- [ ] Offline indicator shows when disconnected
- [ ] No data loss after offline session

---

### Phase 2: Visual Refresh

**Implementation:**
1. Port CSS custom properties from Flavor Pairings
2. Implement dark mode with system preference detection
3. Add theme toggle component
4. Style login screen with gradient orbs
5. Update all components with new design system
6. Deploy

**Verification Testing:**
- [ ] App defaults to system light/dark preference
- [ ] Theme toggle switches between light and dark
- [ ] Theme preference persists after refresh
- [ ] Login screen shows gradient orbs animation
- [ ] Main app does NOT show gradient orbs or dot grid
- [ ] Cards have proper shadow depth
- [ ] Inputs have modern styling and focus states
- [ ] All text is readable in both light and dark modes
- [ ] No visual regressions on existing functionality

---

### Phase 3: Workout Templates

**Implementation:**
1. Create template database tables
2. Add "Save as Template" flow after workout
3. Add "Start from Template" option
4. Build template management UI
5. Implement "last used weights" auto-update
6. Deploy

**Verification Testing:**
- [ ] Can save a completed workout as a template
- [ ] Template appears in template list
- [ ] Can start new workout from template
- [ ] New workout pre-fills with template exercises and sets
- [ ] Sets show last used weights/reps
- [ ] Completing a workout updates template's "last used" values
- [ ] Can rename a template
- [ ] Can delete a template
- [ ] Templates are user-specific (User A can't see User B's templates)
- [ ] Templates work correctly offline (if applicable)

---

## Success Criteria

- [ ] User can create account and log in from any device
- [ ] Workout data persists across browser clears and devices
- [ ] Magic link login works without password
- [ ] App respects system dark/light preference
- [ ] User can toggle dark mode manually
- [ ] Visual style matches Flavor Pairings quality
- [ ] User can save workout as template
- [ ] Templates pre-fill with last used weights
- [ ] No data loss incidents reported

---

## Decisions on Open Questions

| Question | Decision | Notes |
|----------|----------|-------|
| Offline support? | **Yes (nice-to-have)** | Include offline capability with sync when back online. Not a blocker for launch but should be part of the build. |
| Data export? | **No** | Not needed. Data lives in the app only. |
| Account deletion? | **No (for now)** | Low usage expected. Can add later if needed. |

---

## Phase 1.5: Offline Support (Priority: NICE-TO-HAVE)

### Overview

App should work when offline and sync data when connection is restored.

### Implementation Approach

**Option A: Supabase + Local Cache (Recommended)**
- Use `localStorage` or IndexedDB as a write-through cache
- Queue mutations when offline
- Sync queue when back online
- Supabase realtime for live updates when online

**Key Behaviors:**
1. **Reading data:** Check local cache first, fall back to network
2. **Writing data:** Write to local cache immediately, queue sync to Supabase
3. **Coming online:** Process sync queue, pull latest from server
4. **Conflict resolution:** Last-write-wins (simple for personal data)

### Technical Notes

```typescript
// Pseudo-code for offline-first pattern
const saveWorkout = async (workout: Workout) => {
  // 1. Save to local cache immediately (optimistic)
  await localCache.save(workout);

  // 2. Queue for sync
  await syncQueue.add({ type: 'upsert', table: 'workouts', data: workout });

  // 3. If online, sync immediately
  if (navigator.onLine) {
    await processSync();
  }
};

// Listen for online event
window.addEventListener('online', processSync);
```

### Service Worker (PWA)

The app already has `vite-plugin-pwa` installed. Enhance it to:
- Cache app shell for offline access
- Show offline indicator in UI
- Queue background sync

---

*PRD Created: January 2025*
*Last Updated: January 2025*
