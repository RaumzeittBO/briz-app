import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB7qnGS7dlZzJXJ-15WdxUaZu68pABC8go",
  authDomain: "briz-4ef3a.firebaseapp.com",
  projectId: "briz-4ef3a",
  storageBucket: "briz-4ef3a.firebasestorage.app",
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

export default app;
