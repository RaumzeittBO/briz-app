# Firebase production Rules baseline — 2026-10-21

Read-only copy of the rules visible in Firebase Console for project `briz-4ef3a`. No rules were edited or deployed during capture. This is a recovery reference, not a deployment file. Confirm the currently published revision again immediately before any release because console rules can change.

## Firestore Rules currently published

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn();
    }

    match /adminUsers/{adminUserId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /settings/{settingId} {
      allow read: if settingId != 'admin_security' || isAdmin();
      allow write: if isAdmin();
    }

    match /inventory/{itemId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /combos/{comboId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /routes/{routeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /rentals/{rentalId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /customers/{customerId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if isAdmin();
    }

    match /sales/{saleId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /serviceOrders/{serviceOrderId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    // Cyclists can submit only pending content. Administrators authenticated
    // through Firebase are the only ones who can approve, reject or remove it.
    match /communityItems/{itemId} {
      allow read: if true;
      allow create: if request.resource.data.status == 'pending';
      allow update, delete: if isAdmin();
    }
  }
}
```

### Firestore security impact

`isAdmin()` currently means only “authenticated”. Authenticated users can create/update `adminUsers`, so an authenticated account can grant itself an admin-shaped document. Reads of rental, customer, sales and service-order documents are public, as are several creates. These rules are critically permissive and are incompatible with a safe public release. Keep this baseline only as a short-lived rollback artifact; do not treat it as an acceptable steady state. The strict checked-in `firestore.rules` passed emulator rules tests. Publish it only after the new callable-based frontend is serving and its compatibility gates pass, with the previous frontend/rules/Functions retained for coordinated rollback.

## Storage Rules currently published

Bucket shown in Console: `briz-4ef3a.firebasestorage.app`.

```firestore
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && firestore.get(
          /databases/(default)/documents/adminUsers/$(request.auth.uid)
        ).data.role == "admin"
        && firestore.get(
          /databases/(default)/documents/adminUsers/$(request.auth.uid)
        ).data.active == true;
    }

    function isValidImage() {
      return request.resource != null
        && request.resource.size <= 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    function isValidCustomerDocument() {
      return request.resource != null
        && request.resource.size <= 10 * 1024 * 1024
        && (
          request.resource.contentType.matches('image/.*')
          || request.resource.contentType == 'application/pdf'
        );
    }

    match /inventory/{allPaths=**} {
      allow read: if true;
      allow create, update: if isAdmin() && isValidImage();
      allow delete: if isAdmin();
    }

    match /events/{allPaths=**} {
      allow read: if true;
      allow create, update: if isAdmin() && isValidImage();
      allow delete: if isAdmin();
    }

    match /customers/{userId}/{allPaths=**} {
      allow read: if isAdmin();

      allow create: if isSignedIn()
                    && request.auth.uid == userId
                    && isValidCustomerDocument();

      allow update, delete: if isAdmin();
    }

    match /community/{userId}/{allPaths=**} {
      allow read: if true;

      allow create: if isSignedIn()
                    && request.auth.uid == userId
                    && isValidImage();

      allow update, delete: if isAdmin();
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Storage Rules check role and `active` in `adminUsers`, validate image/document MIME and size, expose inventory/events/community reads, and deny unmatched paths. They differ from the checked-in candidate rules; compatibility and owner-access paths must be reviewed before deployment. No Storage objects were read, copied, changed, or deleted.
