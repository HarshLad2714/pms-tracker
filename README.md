# FORGE — Project Management System

Internal project / task OS: Kanban, QA bugs, attendance, and task-wise time tracking.

**Stack:** Node.js + Express + MongoDB · React + Vite + Tailwind

## Quick start

1. Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) and start it locally.
2. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

3. Copy env if needed (`backend/.env` is already set for local Mongo):

```
MONGO_URI=mongodb://127.0.0.1:27017/forge_pms
```

4. Create collections + indexes, then load demo data:

```bash
cd backend
npm run migrate
npm run seed
```

5. Run both apps:

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open [http://localhost:5180](http://localhost:5180). API runs on port **5060**.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@forge.dev | Admin@123 |
| Manager | manager@forge.dev | Manager@123 |
| Employee | riya@forge.dev | Employee@123 |

Also: `kabir@forge.dev`, `anaya@forge.dev`, `vihaan@forge.dev` / `Employee@123`

## Phases shipped

1. Auth, JWT, RBAC, employee management
2. Projects, tasks, comments, activity
3. Kanban drag-and-drop, list / my-tasks views
4. Bugs linked to tasks
5. Clock in / out + late / early flags
6. Task timer + manual time
7. Dashboards, CSV reports, in-app notifications
8. MongoDB migration files for every collection

## Migrations

`backend/src/migrations/` creates collections with JSON schema validators and indexes:

- users, projects, tasks, comments, bugs
- attendances, timeentries, notifications, activities
- schema_migrations

## API

Base: `http://localhost:5060/api`

Auth header: `Authorization: Bearer <token>`
