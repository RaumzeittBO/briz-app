# Firebase customer email verification

## Current code behavior

The app sends `ActionCodeSettings.url` as the same-origin continuation URL `https://www.briz.com.bo/rentals`. This setting carries the destination after an email action; it does **not** select the page that handles the action code. The `/verify-email` route implements the custom handler for `verifyEmail`, `verifyAndChangeEmail`, `recoverEmail`, and `resetPassword`. It removes action codes from the visible URL and does not log them. The return link accepts only a same-origin continuation URL and falls back to `/rentals`.

The Firebase Authentication email template's **Customize action URL** setting selects the action handler. Do not change this Firebase Console setting until `https://www.briz.com.bo/verify-email` has been deployed and verified reachable over HTTPS. Until then, keep the existing Firebase handler configuration.

## Production Console configuration, after publication

1. In **Authentication → Settings → Authorized domains**, confirm `www.briz.com.bo` is authorized. Add `briz.com.bo` only if that hostname serves the production app and links will use it. Do not add preview hosts for this flow.
2. Open **Authentication → Templates → Email address verification**. Set **Customize action URL** to `https://www.briz.com.bo/verify-email`.
3. Open **Authentication → Templates → Password reset** and set its **Customize action URL** to the same published handler. Verify both actions from the real templates after saving.
4. Set sender display name to `BRIZ`, verification subject to `BRIZ | Confirma tu correo electrónico`, and the password-reset subject to `BRIZ | Restablece tu contraseña`. Use a reply-to address controlled by BRIZ and authorized for the sending domain.
5. Set the template language to Spanish. The app also sets Firebase Auth's language code to Spanish or English from the customer's selected interface language.
6. Use the production HTTPS host in all action links. Never put credentials, customer documents, or other personal data in continuation URLs.

Firebase's native templates allow the supported sender, subject, message text, and action link customization shown in the Console. They do not provide the requested arbitrary branded responsive HTML, custom logo layout, or full visual email design. That visual branding remains pending; it would require a BRIZ-approved transactional email provider and domain authorization. No provider has been installed or configured.

Do not send production test messages to customers. Use a fictitious account in an authorized test environment. The previous repository note that `www.briz.com.bo` was authorized is not live Console evidence; check the current Firebase project before publication.

## References

- [Firebase custom email action handler](https://firebase.google.com/docs/auth/custom-email-handler)
- [Passing state in email actions](https://firebase.google.com/docs/auth/web/passing-state-in-email-actions)
- [Admin generated email action links](https://firebase.google.com/docs/auth/admin/email-action-links)
- [Manage Firebase Auth users and language](https://firebase.google.com/docs/auth/web/manage-users)
