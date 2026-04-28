# Quality Upgrade Checklist

This checklist tracks the "1000% better" improvements. Items are split between:

- Done in code now
- Requires your external account/setup

## Done In This Workspace

- [x] CI pipeline added for frontend lint/build and edge-server tests (`.github/workflows/ci.yml`).
- [x] Server security hardening headers added (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- [x] Global Fastify error handler added with validation-aware 400 responses and sanitized 500 responses.
- [x] Request schema validation added for:
  - `PATCH /api/ground/orders/:poNumber/status`
  - `POST /api/crew/requests`
  - `PATCH /api/crew/requests/:id/status`

## Requires Your Setup (I cannot fully complete these from local code alone)

- [ ] Sentry/monitoring account setup and DSN provisioning.
- [ ] Production hosting and domain/TLS hardening decisions.
- [ ] Analytics platform provisioning (Matomo/Plausible/etc.).
- [ ] Secrets management policy and environment secret injection in your deployment target.
- [ ] Role-based auth provider setup (if using external identity provider).
- [ ] PostgreSQL service wiring for integration tests in CI (or Docker service container in workflow).

## Next Recommended Engineering Steps (I can implement next if you want)

- [ ] Add Playwright end-to-end tests for login, receive, move, and crew request workflows.
- [ ] Add API OpenAPI docs endpoint and Swagger UI for backend routes.
- [ ] Add frontend error boundary and standardized API error toast system.
- [ ] Add rate limiting to critical mutation routes.
- [ ] Add accessibility audit pass with fixes (focus states, landmarks, labels).
