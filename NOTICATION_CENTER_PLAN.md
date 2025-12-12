Below is the **full agent instruction**, including the **Notification Creation Engine** which will automatically generates notifications for:

- expiring links
- expired links
- expiring campaigns
- expired campaigns
- link–campaign mismatches
- additional system-level + insight-level alerts
  (and is fully extensible for future categories)

---

# 🚀 **FINAL SYSTEM INSTRUCTION PROMPT**

### **“Implement Notifications API + Notification Engine (FastAPI + Next.js) With Scalable Schema & Automatic Generators”**

---

# 🧠 **AGENT — READ CAREFULLY BEFORE WORKING**

Your task is to implement a complete notification system across the FastAPI backend (@/smartHubLinks) and Next.js frontend (@/frontend).
You must follow and replicate all existing patterns in the backend and frontend codebases.

You will also implement an automatic **Notification Creation Engine** that creates new notifications based on business rules (expiring/expired links & campaigns, insights, etc.).

You must **study first** before generating any code.

---

# ============================================

# 🧩 **PART 1 — BACKEND ANALYSIS WORKFLOW**

# ============================================

### **Step 1 — Learn Existing FastAPI Route Architecture**

Scan:

```
/backend/app/api/routes/
```

Extract patterns regarding:

- route organization
- naming conventions
- dependency injection (Depends) usage
- async vs sync patterns
- pagination structure (if present)
- filters + query parameters
- response models & structure
- error handling
- security dependencies (if any)

Mirror these patterns exactly.

---

### **Step 2 — Learn Backend Model & Schema Conventions**

Scan:

```
/backend/app/models/
backend/app/schemas/
```

Extract conventions:

- naming style
- timestamp fields
- enum declaration and usage
- JSON column usage
- relationship patterns
- common mixins (BaseModel, TimestampMixin, etc.)
- field nullability patterns
- update vs create schema patterns

Use these conventions for the new Notification system.

---

---

# ============================================

# 🧱 **PART 2 — BACKEND NOTIFICATION SYSTEM IMPLEMENTATION**

# ============================================

## **Step 3 — Implement the Notification SQLAlchemy Model**

Create:

```
backend/app/models/notification.py
```

Model fields:

```
id (PK)
category (enum: "links" | "campaigns" | "system" | "activities" | "insight")
subtype (string)
severity (enum: "low" | "medium" | "high" | "critical")
title (string)
message (string)
metadata (JSON)
is_read (boolean)
created_at (datetime)
```

Rules:

- `metadata` MUST be JSON, allowing arbitrary future fields
- category must use backend’s Enum pattern
- created_at must follow existing timestamp defaults
- model must match backend style (imports, Base class, etc.)

---

## **Step 4 — Implement Pydantic Schemas**

Create:

```
backend/app/schemas/notification.py
```

Schemas needed:

- `NotificationBase`
- `NotificationCreate`
- `NotificationUpdate`
- `NotificationOut`

Follow conventions:

- Base contains shared fields
- Create excludes auto-generated fields
- Update includes optional fields
- Out includes id, timestamps, etc.

---

## **Step 5 — Implement CRUD Layer**

Create:

```
backend/app/crud/notification.py
```

CRUD actions:

- list_all (with filters: category, severity, read state)
- list_unread
- create
- mark_as_read
- mark_all_as_read
- delete
- delete_all_read (optional)

Follow exact CRUD patterns already present in the project.

---

## **Step 6 — Implement FastAPI Routes**

Create:

```
backend/app/api/routes/notifications.py
```

Endpoints:

```
GET    /notifications
GET    /notifications/unread
POST   /notifications
PATCH  /notifications/{id}/read
PATCH  /notifications/read-all
DELETE /notifications/{id}
```

Implement:

- dependency injection
- response schemas
- query filters
- pagination (if other routes use it)
- same error-handling pattern as existing routes

---

# ===================================================

# ⚙️ **PART 3 — IMPLEMENT NOTIFICATION CREATION ENGINE**

# ===================================================

A new backend service must be implemented that **automatically generates notifications** based on business rules.

Create:

```
backend/app/services/notification_engine.py
```

This engine must:

### **Step 7 — Analyze Existing Models for Business Rules**

Scan:

```
link
campaign
system metrics
user activity logs
insight tables
```

Understand fields:

- `expires_at`
- `is_active`
- `campaign start/end`
- `clicks`
- `traffic`
- `insights`
- etc.

This informs rule definitions.

---

# 📌 **Step 8 — Automatic Notification Rules to Implement**

### 🔗 **LINK-BASED Notifications**

| Rule                              | Condition                      | Category | Subtype                            |
| --------------------------------- | ------------------------------ | -------- | ---------------------------------- |
| Link Expiring Soon                | expires_at < now + threshold   | `links`  | `link_expiring_soon`               |
| Link Expired                      | expires_at < now               | `links`  | `link_expired`                     |
| Expired link with active campaign | link expired & campaign active | `links`  | `expired_link_has_active_campaign` |
| Active link with expired campaign | link active & campaign expired | `links`  | `active_link_has_expired_campaign` |

Threshold must follow existing system config or be configurable.

---

### 📢 **CAMPAIGN-BASED Notifications**

| Rule                                        | Condition                 | Category    | Subtype                      |
| ------------------------------------------- | ------------------------- | ----------- | ---------------------------- |
| Campaign Expiring Soon                      | ends_at < now + threshold | `campaigns` | `campaign_expiring_soon`     |
| Campaign Expired                            | ends_at < now             | `campaigns` | `campaign_expired`           |
| Campaign active but linked to expired links | any link expired          | `campaigns` | `campaign_has_expired_links` |

---

### ⚙️ **SYSTEM Notifications**

Examples:

- system under high load
- background job failures
- queue delays
- cron task errors

Category: `"system"`

---

### 👁️ **INSIGHT Notifications**

Examples:

- traffic spike
- traffic drop
- new country discovered
- unusual device distribution
- anomaly in conversions

Category: `"insight"`

---

### 🧭 **ACTIVITIES Notifications**

Examples:

- new user sign-ups
- workspace member invited
- integration connected
- integration failing

Category: `"activities"`

---

# 💡 **Step 9 — Engine Execution Flow**

- Must run on an interval or be triggered by existing background workers
- Engine must NOT duplicate notifications (idempotent)
- Rules must be easy to extend
- Future categories should work without schema changes
- Notification creation must use the CRUD layer
- Push into DB with metadata

---

# ============================================

# 🌐 **PART 4 — FRONTEND ANALYSIS + IMPLEMENTATION**

# ============================================

## **Step 10 — Analyze Existing Frontend Data Layer**

Scan:

```
frontend/lib/
frontend/lib/api/
frontend/app/api/
frontend/app/hooks/
```

Identify:

- fetch wrappers
- error-handling
- how query params are built
- typing conventions (TS interfaces)
- SWR / React Query use

Use these patterns for the new notification API client.

---

## **Step 11 — Create Notification API Client**

Create:

```
frontend/lib/api/notifications.ts
```

Functions:

```
getNotifications(params)
getUnreadNotifications()
markNotificationRead(id)
markAllNotificationsRead()
deleteNotification(id)
createNotification(dto)
```

Follow same style as existing API clients.

---

# ============================================

# 🎨 **PART 5 — FRONTEND UI INTEGRATION**

# ============================================

## **Step 12 — Analyze Existing UI Components**

Scan:

```
frontend/app/components/Header.tsx
frontend/components/blocks/command-menu/command-menu-notifications.tsx
```

Learn patterns:

- shadcn components
- list rendering
- dropdown menus
- icons + badges
- skeleton states
- API integration patterns

---

## **Step 13 — Update Notification UI Component**

Enhance the notifications UI to:

- fetch unread count
- fetch categorized notifications
- mark on click as read
- use "time ago" formatting
- group by category (dynamic, not hardcoded)
- support all current + future categories
- optional: add “mark all as read”

UI references:
Use shadcn command-menu notifications UX per your link.

---

# ============================================

# 🔥 **PART 6 — SCALABILITY RULES**

# ============================================

Your implementation MUST:

1. Support new categories without code changes
2. Support unlimited subtypes (free text)
3. Store metadata flexibly (JSON)
4. Support future rule-based generation
5. Keep frontend UI dynamic (no hardcoded categories)
6. Keep backend business rules modular
7. Keep every part consistent with existing project patterns

---

# ============================================

# 📦 **PART 7 — REQUIRED OUTPUT**

# ============================================

When implementing, produce:

- Pydantic schemas
- CRUD service
- Notification route
- Notification engine (rules + runner)
- DB migration (if project uses Alembic)
- Frontend API client
- Frontend UI updated
- Any necessary utility or hook additions

All must follow existing conventions.

---
