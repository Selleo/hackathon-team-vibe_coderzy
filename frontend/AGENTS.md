# Repository Guidelines

## Project Structure & Module Organization
Next.js App Router code lives in `src/app`, with `page.tsx` powering the landing flow and `chat-with-mentor/page.tsx` hosting the mentor workspace. Feature flows live in `src/app/Sections`, with atomic widgets in `Sections/Components` and shared UI such as `components/ChatWithMentor.tsx`. Client-side APIs sit in `src/app/services`, domain helpers/types in `src/app/lib`, and server routes in `src/app/api/**/route.ts` (Gemini calls, quiz logic, roadmap generation). Static assets belong in `public`, while `/data/mentor_chats.json` captures saved conversations created by the mentor endpoints.

## Build, Test, and Development Commands
- `npm run dev` – Start the Next 16 dev server with Turbopack at `http://localhost:3000`.
- `npm run build` – Produce an optimized production bundle; run before every release or deploy.
- `npm run start` – Serve the last build locally for smoke testing and hand-offs.
- `npm run lint` – Execute `eslint.config.mjs`; fix diagnostics before committing.

## Coding Style & Naming Conventions
Write TypeScript components with two-space indentation. Components adopt `PascalCase` filenames (`Sections/ProgressPath.tsx`), while helpers/hooks stay `camelCase` (`mentorService.saveChat`). Keep stateful UI in client components and push computation or data shaping into `lib/*`. Tailwind CSS v4 tokens in `globals.css` define shared colors/typography—reuse them instead of inline hex values. ESLint is the single formatting authority, so prefer async/await patterns and let the linter surface any deviations.

## Testing Guidelines
Automated tests are not yet wired up. When adding coverage, prefer React Testing Library + Vitest (or Playwright for end-to-end flows) and co-locate specs as `ComponentName.test.tsx`. Focus on mentor chat prompts, lesson generation utilities, and fetch handlers living in `src/app/services`. Document any new `npm test` script inside `package.json` and ensure the suite runs headlessly for CI.

## Commit & Pull Request Guidelines
Follow the conventional prefixes already present (`feat: ...`, `chore: ...`, `fix: ...`). Keep subject lines under ~72 characters, reference the issue ID in the body, and describe intent plus visible changes in a short paragraph. Each PR should list the commands you ran (e.g., `npm run lint`, `npm run build`), link designs/issues, and attach screenshots or clips whenever UI under `Sections` changes.

## Security & Configuration Tips
All mentor endpoints require `GEMINI_API_KEY`; keep it in `.env.local` and validate it before running the dev server. Avoid logging raw learner prompts or profile data, and sanitize any exports from `/data/mentor_chats.json`. Never commit `.env*` or generated data, and use typed helpers in `services` so secrets stay server-side whenever possible.
