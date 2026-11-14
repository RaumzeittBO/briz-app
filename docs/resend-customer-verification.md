# BRIZ customer verification email

Customer registration and verification resend use the authenticated callable `sendCustomerVerificationEmail`. It resolves the recipient from the Firebase Auth user for the caller's UID; the client may select Spanish or English but cannot supply a recipient address.

## Mail delivery

- The callable alone is bound to the `RESEND_API_KEY` Firebase secret. The key is read with `RESEND_API_KEY.value()` and is never included in frontend configuration, responses, or logs.
- Set the key through Firebase Functions Secret Manager when the release is authorized. Do not put it in a Vite variable, `.env` file, source control, or another PACHAX project's secret.
- Before enabling sends, confirm in Resend that `briz.com.bo` is Verified and that the sender `notificaciones@briz.com.bo` is allowed. DNS records are a prerequisite; this deployment does not infer provider verification from DNS alone.
- Resend idempotency keys protect the provider call. The callable also enforces a 60-second per-account cooldown and five attempts per 24 hours. An attempt is reserved before sending so an ambiguous network result cannot cause a rapid duplicate.
- Provider failures return a generic retry message. Logs contain only static failure descriptions and never include the recipient, action link, action code, API key, or raw provider error.

## Firebase action link

The callable creates an official Firebase Admin SDK verification link without `ActionCodeSettings`, so it does not depend on a Firebase template handler or a `continueUrl` allowlist entry. It accepts only the project's official Firebase Auth action URL, the `verifyEmail` mode, a single `oobCode`, and the documented optional parameters. Any continuation URL must be same-origin BRIZ `/rentals`; unknown or duplicate parameters are rejected.

The Firebase-generated one-time code is copied unchanged into `https://www.briz.com.bo/verify-email?mode=verifyEmail&oobCode=…&lang=…`. The published React handler applies the code through Firebase Auth, so Firebase remains authoritative for email verification. The code is removed from browser history when the page handles it. No code or link is written to logs.

## Templates and tests

The confirmation email uses the BRIZ logo served from the public site, a responsive table layout with inline styles, yellow/black branding, a plain-text alternative, and Spanish or English copy. Password reset and email-change verification remain on their existing Firebase flows pending separate migration and testing.

`npm test --prefix functions` covers link validation, both email variants, HTML escaping, provider idempotency/error sanitization, and rate limits. The Firebase Emulator integration uses a local-only mock mail adapter guarded by both a `demo-*` project ID and `BRIZ_VERIFICATION_MAILER=mock`; it stores fictional messages in the Emulator outbox so tests can apply the generated Firebase code without sending mail externally.
