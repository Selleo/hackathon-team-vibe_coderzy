# Repository Guidelines

## Project Structure & Module Organization
- `backend/app/main.py` wires the FastAPI application, mounts the shared `api_router`, and is the place to register global middleware; group new endpoints under feature-focused subpackages inside `backend/app/api/` to avoid a monolithic `routes.py`.
- `frontend/src/app` hosts the Next.js App Router tree—screens live in folders such as `chat-with-mentor`, reusable building blocks stay in `components` and `Sections`, data fixtures sit under `data`, and network helpers belong in `services`.
- Static assets live in `frontend/public`, while prompt/product copy is documented in `DOCS.md` and `GEMINI.md`; keep any long-form reference material there instead of inline comments.
- Test and utility modules should mirror this structure (e.g., `backend/tests/api/test_chat.py`, `frontend/src/app/chat-with-mentor/chat-panel.test.tsx`) so ownership stays obvious.

## Build, Test, and Development Commands
- `cd backend && pip install -e ".[dev]"` installs the FastAPI service with dev-only tooling such as Ruff.
- `cd backend && uvicorn app.main:app --reload` runs the API on `http://localhost:8000` with autoreload; pair it with the frontend dev server.
- `cd frontend && pnpm install` installs the Next.js workspace (prefer `pnpm` to keep `pnpm-lock.yaml` authoritative, though `npm` will work in a pinch).
- `cd frontend && pnpm dev` launches the app with Turbopack on port 3000, and `pnpm build && pnpm start` runs the production bundle for verification.
- `cd frontend && pnpm lint` executes ESLint, while `cd backend && ruff check app` keeps the API tidy before you push.

## Coding Style & Naming Conventions
- Python modules use 4-space indents, full type hints, `snake_case` for functions, and `PascalCase` for classes; keep line length ≤100 per the Ruff config and favor short FastAPI dependency functions over global state.
- React/TypeScript files use 2-space indents, `PascalCase` components (`MentorTimeline.tsx`), and `camelCase` hooks/utilities (`useTopicWizard.ts`); colocate styles with the component via `globals.css` tokens or Tailwind utility classes.
- Prefer async/await for service calls, keep client components annotated with `"use client"`, and export a single default component per route segment.

## Testing Guidelines
- Backend tests rely on `pytest`; mirror the app tree under `backend/tests`, name files `test_<module>.py`, and use `TestClient` for HTTP assertions—run them via `cd backend && pytest` and target ≥80 % coverage for modified files.
- Frontend tests use Vitest + Testing Library; place specs next to the feature with a `.test.tsx` suffix, stub fetchers via msw if needed, and run `cd frontend && pnpm test --run` locally plus in CI.

## Commit & Pull Request Guidelines
- Follow the existing conventional tone: `feat: add mentor timeline hydration`, `fix: correct roadmap copy`, `chore: bump pnpm workspace`, `docs: update guidelines`; keep summaries under 72 characters and explain multi-part work in the body.
- Every PR must describe the change, reference the related issue (e.g., `Closes #42`), list manual/verifier commands (`pnpm test`, `pytest`), and attach before/after screenshots for UI or chat-flow adjustments.
- Request review from at least one backend and one frontend owner when touching both stacks, and ensure migrations or prompt updates are linked in `DOCS.md`/`GEMINI.md`.

## Security & Configuration Tips
- Copy `.env.example` for local hacking and `.env.production.example` for deployments; never commit real `GROK_API_KEY` values, and restrict `NEXT_PUBLIC_API_URL` plus `CORS_ORIGIN` to trusted domains.
- Backend secrets sit in `backend/.env`, frontend public vars in `frontend/.env.local`; keep API URLs synchronized so CORS stays happy, and rotate tokens immediately if they leak.
