import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Only initialize Firebase when using Firebase auth mode
const authMode = process.env.REACT_APP_AUTH_MODE || 'firebase';
let app = null;
let authInstance = null;
if (authMode === 'firebase') {
  try {
    if (!firebaseConfig.apiKey) {
      console.warn('Firebase not initialized: missing REACT_APP_FIREBASE_API_KEY');
    } else {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
    }
  } catch (e) {
    console.error('Firebase initialization failed:', e?.message || e);
  }
}

export const auth = authInstance;

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
};