# Project Instructions: Karachi DMS (Distribution Management System)

## Critical Startup Logic
- The application uses `better-sqlite3`.
- **Database Initialization:** Must be wrapped in `try-catch` blocks. If the database schema fails to initialize, the process should exit with code 1.
- **Data Seeding:** Initial data seeding (Users, Locations, Material Groups) must be **idempotent** using `INSERT OR IGNORE`. 
- **Seeding Resilience:** Data seeding blocks MUST be wrapped in `try-catch` to prevent minor seeding errors from being "blocking" for the entire application startup. This is critical for preventing the "Failed to start applet" message.

## Database Schema & Integrity
- **Database File:** `dms_v7.db`
- **Location Hierarchy:** Ensure `UNIQUE(parent_id, name)` constraints exist on all location tables (`provinces`, `cities`, `towns`, `areas`, `subareas`) to support idempotent seeding and maintain data integrity.

## Development Patterns
- **T-Codes:** The application uses SAP-style Transaction Codes (e.g., `LOC01` for Location Master, `TC01` for T-Code search). Map new features to T-Codes in `src/App.tsx`.
- **Utility Functions:** Use the `cn` utility from `src/lib/utils.ts` for consistent styling. Avoid redefining it in components.
- **Full-Stack Mode:** The app runs in Express + Vite mode. API routes are defined in `server.ts`.
