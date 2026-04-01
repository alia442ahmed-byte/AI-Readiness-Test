# AI Readiness Assessment — TODO

- [x] Landing screen with hero background, shimmer headline, and CTA
- [x] 5-question quiz with per-answer scoring and progress bar
- [x] Cinematic loading screen with animated progress
- [x] Lead capture gate (name, email, company) with form validation
- [x] Animated SVG score gauge (0–100)
- [x] Dynamic results screen with score tier copy and top-3 opportunities
- [x] Calendly booking block placeholder on results screen
- [x] Upgrade project to full-stack (tRPC + MySQL database)
- [x] Database schema: leads table (name, email, company, score, tier, answers)
- [x] tRPC leads.submit procedure — persists every form submission to DB
- [x] tRPC leads.list procedure — admin-only lead listing
- [x] Owner notification on new lead submission
- [x] Frontend wired to tRPC mutation with loading state and error toast
- [x] Vitest tests for leads.submit and leads.list (6 tests passing)
