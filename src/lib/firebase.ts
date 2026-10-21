import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { resolveFirebaseRuntimeConfig } from "@/lib/firebaseConfig";

declare const __BRIZ_DEPLOYMENT_ENV__: string;

// Keep the VITE allowlist explicit: Vite exposes every VITE_* variable referenced through
// `import.meta.env` to the browser bundle. Never pass the whole env object (especially because
// legacy VITE_TELEGRAM_* entries may still exist in Vercel while they are being rotated).
const firebaseEnvironment = {
  VITE_USE_FIREBASE_EMULATOR: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  VITE_FIREBASE_ENVIRONMENT: import.meta.env.VITE_FIREBASE_ENVIRONMENT,
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const runtime = resolveFirebaseRuntimeConfig(firebaseEnvironment, __BRIZ_DEPLOYMENT_ENV__, import.meta.env.MODE);
const useFirebaseEmulator = runtime.useEmulator;
export const isFirebaseEmulatorEnabled = useFirebaseEmulator;
export const firebaseConfig = runtime.config;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
if (JSON.stringify(app.options) !== JSON.stringify(firebaseConfig)) {
  throw new Error('An existing Firebase app has a different configuration; refusing to connect to an unexpected project.');
}

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

if (useFirebaseEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export default app;
