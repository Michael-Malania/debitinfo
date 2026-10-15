# Debitinfo (დებიტორთა რეესტრი და საკრედიტო რისკების მართვა)

Unified financial risk management, debtor registry, debt collection tracking, and analytics platform.

## Architecture

This repository is structured as a modular monorepo:

- **`frontend/`**: Production Next.js (App Router, React 19, Tailwind CSS, TypeScript) application with modular portals, mock API endpoints, and a decoupled service client layer ready for backend integration.
- **`backend/`**: Reserved for the upcoming backend REST/GraphQL API server (Python FastAPI / Node.js / Go).
- **`design demo/`**: Original Figma & HTML design review prototype (maintained locally and tracked in its dedicated repository).

## Quick Start (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the portal.
