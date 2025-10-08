<!--
# Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
  - Complete replacement of all principles with new content
Added sections:
  - Article II: The Technical Stack
  - Article III: Development Workflow & Quality Gates
Templates potentially requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
No follow-up TODOs or deferred placeholders.
-->

# PGS Constitution

## Core Principles

### I. Serve the User, Uncompromisingly

Our target user is a busy, often non-technical, service-based business owner in South Africa. Every feature, UI element, and workflow must be designed to save them time, reduce complexity, and deliver tangible value. The user experience must be simple, intuitive, and trustworthy. We build for our user, first and foremost.

### II. Authentically South African

This is our key differentiator and a core commitment. The AI must be an expert in South African culture. We prioritize and will maintain support for all 11 official languages, incorporating local lingo, sayings, and awareness of regional events. All content and interactions should feel local and genuine.

### III. Security and Privacy by Design (NON-NEGOTIABLE)

We build on a foundation of zero-trust. All development must adhere to the principle of least privilege. Security is a prerequisite, not an afterthought. Row Level Security (RLS) is mandatory on all user data tables. Compliance with South Africa's Protection of Personal Information Act (POPIA) is a strict requirement for every feature handling user data.

### IV. API-First and Type-Safe

The backend API is a first-class citizen, defined by a clear contract (contracts/openapi.yaml). We build services that are consumed by our own frontend as if it were a third-party client. All data flowing into and through the system must be strictly validated with Zod schemas. We use TypeScript to eliminate ambiguity and ensure type safety from the database to the browser.

### V. Comprehensive Testing & Automation

A feature is not "done" until it is tested. Our quality is guaranteed by a multi-layered testing strategy: unit tests for business logic, integration tests for API routes, and end-to-end (E2E) tests for critical user flows. We automate our own automation; CI/CD pipelines, scheduled jobs, and scripted tasks are used to ensure reliability and consistency.

## Article II: The Technical Stack

This is the approved and established technology stack for the project. Deviation is not permitted without a formal amendment to this constitution.

Frontend: Next.js 15+ (App Router) with React and TypeScript.
Styling: Tailwind CSS with Shadcn UI, configured with the "Purple Glow" theme.
Backend & Database: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
AI Provider: Google Gemini APIs (Gemini 1.5 Pro for text, Gemini 2.5 Flash for images).
In-App Agents: CopilotKit for natural language commands; Botpress for customer support.
Payment Gateway: Paystack for ZAR subscription billing.
Deployment: Vercel.

## Article III: Development Workflow & Quality Gates

This section defines the process by which code is developed, reviewed, and merged.

Source of Truth: The tasks.md file is the canonical source of all development tasks. All work must correspond to a task ID (e.g., T020).
Branching: All work must be done on a feature branch named [type]/[task-id]-[short-description] (e.g., feat/T020-post-crud-api).
Pull Requests (PRs): All code must be merged into the main branch via a PR. A PR cannot be merged until all automated checks (linting, type-checking, testing) in the CI pipeline have passed.
Code Reviews: All PRs must be reviewed by at least one other team member or a designated AI review agent before merging. Reviews must validate compliance with this constitution.

## Governance

This constitution supersedes all other project documentation and practices. It is the supreme law of the codebase. Amendments require a formal proposal via a Pull Request to this document, a clear justification for the change, and approval from project maintainers.

All development, pull requests, and code reviews must verify compliance with these principles.
Any increase in complexity or deviation from the established stack must be rigorously justified against the core principles.
Use the tasks.md file for specific, runtime development guidance on files and acceptance criteria.

**Version**: 1.1.0 | **Ratified**: 2025-10-07 | **Last Amended**: 2025-10-08
