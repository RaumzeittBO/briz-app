import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { formatAdminProfileFailure, formatSignInError, loadAdminProfile, profileReadFailure } from '../src/context/adminAuth';

const projectId = 'demo-briz-auth-flow';
const app = initializeApp({ apiKey: 'demo-key', authDomain: `${projectId}.firebaseapp.com`, projectId, appId: 'demo-app' }, `admin-auth-flow-${Date.now()}`);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

function pass(name: string): void {
    console.log(`PASS ${name}`);
}

try {
    const email = `admin-${Date.now()}@example.test`;
    const password = 'EmulatorOnly#123';
    const created = await createUserWithEmailAndPassword(auth, email, password);
    await signOut(auth);
    const signedIn = await signInWithEmailAndPassword(auth, email, password);
    assert.equal(signedIn.user.uid, created.user.uid);
    pass('correct email/password authenticate through Firebase Auth Emulator');

    await signOut(auth);
    await assert.rejects(
        () => signInWithEmailAndPassword(auth, email, 'WrongEmulatorOnly#123'),
        (error: unknown) => {
            const code = (error as { code?: string }).code;
            assert.ok(['auth/invalid-credential', 'auth/wrong-password'].includes(code || ''), `unexpected Auth Emulator code: ${code}`);
            assert.match(formatSignInError(error), /auth\/(invalid-credential|wrong-password)/);
            console.log(`AUTH_EMULATOR_WRONG_PASSWORD_CODE ${code}`);
            return true;
        },
    );
    pass('wrong credentials remain an Authentication error with its actual Firebase code');

    const source = { uid: created.user.uid, email, displayName: 'Test Admin' };
    const valid = await loadAdminProfile(source, async () => ({ role: 'admin', active: true, store: 'all' }));
    assert.equal(valid.profile?.role, 'admin');
    assert.equal(valid.profile?.active, true);
    assert.equal(valid.failure, null);
    pass('active profile resolves and authorizes the ProtectedRoute state');

    const absent = await loadAdminProfile(source, async () => null);
    assert.equal(absent.profile, null);
    assert.equal(absent.failure.kind, 'missing-profile');
    assert.match(formatAdminProfileFailure(absent.failure), /no existe su perfil/);
    pass('missing Admin profile is distinguished from incorrect credentials');

    const inactive = await loadAdminProfile(source, async () => ({ role: 'admin', active: false }));
    assert.equal(inactive.failure.kind, 'inactive-profile');
    pass('inactive profile remains denied');

    const firestoreError = Object.assign(new Error('denied'), { code: 'permission-denied' });
    const readFailure = profileReadFailure(firestoreError);
    assert.equal(readFailure.kind, 'profile-read-failed');
    assert.equal(readFailure.code, 'permission-denied');
    assert.match(formatAdminProfileFailure(readFailure), /Firestore \(permission-denied\)/);
    pass('Firestore profile read failure is surfaced separately and supports retry');

    await assert.rejects(
        () => loadAdminProfile(source, () => new Promise(() => undefined), 10),
        (error: unknown) => (error as { code?: string }).code === 'firestore/profile-read-timeout',
    );
    assert.match(formatAdminProfileFailure(profileReadFailure(Object.assign(new Error(), { code: 'firestore/profile-read-timeout' }))), /tardó demasiado/);
    pass('slow Firestore profile reads end in a visible retryable error instead of a stuck login');
} finally {
    await signOut(auth).catch(() => undefined);
    await deleteApp(app);
}
