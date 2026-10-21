import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const useFirebaseEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

export const firebaseConfig = {
  apiKey: useFirebaseEmulator ? "demo-key" : "AIzaSyB7qnGS7dlZzJXJ-15WdxUaZu68pABC8go",
  authDomain: useFirebaseEmulator ? "demo-briz-security.firebaseapp.com" : "briz-4ef3a.firebaseapp.com",
  projectId: useFirebaseEmulator ? "demo-briz-security" : "briz-4ef3a",
  // Use the gs:// URI so Firebase SDK connects to the correct bucket regardless of domain format
  storageBucket: useFirebaseEmulator ? "demo-briz-security.appspot.com" : "briz-4ef3a.firebasestorage.app",
  messagingSenderId: "412008664703",
  appId: "1:412008664703:web:57ac271f9feebc77ff794a",
  measurementId: "G-0X0HTM4XK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
