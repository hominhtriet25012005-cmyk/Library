# NT-4 — Email outbox and verification implementation plan

## Scope

Implement NT-4 from `docs/email.md` using the existing NT-1 MySQL tables. No schema migration is needed. SMTP delivery stays asynchronous and is never performed inside a loan, fine, membership, or payment transaction. Do not send real SMTP messages during implementation.

## Work sequence

1. Add an email policy/template layer that maps the NT-0 event matrix to mandatory vs. preference-controlled mail, requires verified recipients, escapes HTML, and builds internal links only.
2. Persist notification email jobs idempotently in `email_outbox` in the same transaction as the in-app notification.
3. Add a bounded worker that atomically claims due jobs, sends outside a database transaction, records success/failure, retries up to four total attempts, and recovers stale processing locks.
4. Add email verification token issuance, hashed token persistence, 24-hour expiry, one-minute resend throttling, single-use confirmation, generic responses, and Vietnamese confirmation pages.
5. Add the optional email flag for admin announcements; enqueue announcement email only when explicitly selected, recipient preference is enabled, and recipient email is verified.
6. Add external SMTP/outbox/API URL configuration and update `docs/email.md` with operation steps, current status, limitations, and verification evidence.
7. Perform static review and main-source Maven compile only. Do not run/add tests or contact SMTP/MySQL live as part of this implementation turn.

## Acceptance evidence

- Main backend source compiles.
- No SMTP credentials are written in source or documentation.
- Email templates are Vietnamese and HTML-escape user-controlled content.
- Queue keys are stable and bounded; notification replay does not create another job.
- No database DDL is executed or added.
- Documentation clearly states that SMTP runtime delivery and live MySQL operation were not exercised.
