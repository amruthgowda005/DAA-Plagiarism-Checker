# Project Context: Divide and Conquer Plagiarism Checker

## Overview
This document serves as the central state tracker for the **Divide and Conquer Plagiarism Checker** project. It is used to quickly onboard any agent to the current state of the project without needing to read all files from scratch.

## Current State: Phase 1 (Completed)
The initial Full-Stack web application has been successfully built and is currently operational. 

### Technology Stack
- **Frontend:** React.js, Tailwind CSS, React Router, Vite
- **Backend:** Node.js, Express.js
- **Database:** SQLite (local `plagiarism_checker.db`)
- **Algorithms:** Custom Divide and Conquer text chunking with Jaccard Similarity.

### Completed Features
1. **Frontend Dashboard:** Includes file upload, comparison UI, and detailed result visualization (Recharts).
2. **Backend API:** Authentication (JWT/bcrypt), Document management (multer, pdf-parse, mammoth), and Plagiarism checking logic.
3. **Core Algorithm:** `backend/algorithms/divideAndConquer.js` implements recursive document chunking, similarity matching, and calculates dynamic Time/Space complexity.

## Execution Tracking & Changelog
*(Any future changes made by the agent will be logged here)*

- **[2026-06-08]**: Initial project structure, backend API, frontend UI, and Divide & Conquer algorithm successfully implemented. Servers are set up to run locally.
- **[2026-06-08]**: Created `context.md` to persist project state across agent sessions.
- **[2026-06-08]**: Migrated the database driver from `better-sqlite3` to the native `node:sqlite` to resolve compilation issues on Node v25.9.0.
- **[2026-06-08]**: Fixed frontend Vite crash by downgrading `tailwindcss` to `v3.4.x` to align with the existing `postcss.config.js` and styling configuration.

## Active Goals / Actionable Items
*(This section will be populated based on the user's ongoing goals)*
1. TBD...
