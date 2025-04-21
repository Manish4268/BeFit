

// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOGZWnQIxJAQ-FhcOsG_a269kmk5mTcuk",
  authDomain: "befit-818f0.firebaseapp.com",
  projectId: "befit-818f0",
  storageBucket: "befit-818f0.firebasestorage.app",
  messagingSenderId: "1024256863937",
  appId: "1:1024256863937:web:900e2bb4ddbea0e8d7ee40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

