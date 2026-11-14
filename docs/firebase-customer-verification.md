# Firebase customer email verification

The application now sends Firebase verification actions with the continuation URL `/verify-email`. The route handles `verifyEmail`, `verifyAndChangeEmail`, `recoverEmail`, and `resetPassword` action codes once, removes sensitive query parameters from the visible address, and never logs them.

## Firebase Console steps

1. Open Firebase Console → Authentication → Settings → Authorized domains. Confirm `www.briz.com.bo` is listed. Add any production hostname used by the site if it is different. Keep preview hosts out unless BRIZ deliberately authorizes them.
2. Open Authentication → Templates → Email address verification. Set the sender name to `BRIZ`, the subject to `BRIZ | Confirma tu correo electrónico`, and the action URL to `https://www.briz.com.bo/verify-email`.
3. Set the password reset template action URL to the same handler so the route can present the reset form. Save both templates.
4. In Authentication → Templates, set the sender/reply-to details BRIZ controls. Firebase's native template settings do not provide arbitrary production HTML, a custom logo layout, or a fully authored responsive email. The requested visual email cannot be declared complete with this repository change.
5. Verify the flow only with a fictitious account in the Firebase Auth Emulator. Do not send a production test email to a customer.

Firebase's native email action handler and templates remain the sender. No email vendor, paid service, private key, or Admin-generated link endpoint was added. A fully branded HTML message would require a BRIZ-approved sender/domain and an authorized transactional email provider; that integration is intentionally not configured here.

The route uses the same-site home link after processing, never a caller-provided external continuation URL. `https://www.briz.com.bo` was already listed as authorized in the latest repository release-readiness note; verify that entry in the Firebase Console before production publication because the console itself is outside this repository.
