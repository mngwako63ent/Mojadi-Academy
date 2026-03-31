import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRhmaR0rFAkLzjS47vBidVTjcoeEIefMQ",
  authDomain: "gen-lang-client-0286772890.firebaseapp.com",
  projectId: "gen-lang-client-0286772890",
  storageBucket: "gen-lang-client-0286772890.firebasestorage.app",
  messagingSenderId: "503032363111",
  appId: "1:503032363111:web:620bae33cbd99d5db5fcc2",
  firestoreDatabaseId: "ai-studio-eafded5e-c8ea-4a70-b8c7-c668c1dc894a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
console.log("Firebase Auth initialized:", auth.app.name);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
console.log("Firestore initialized with database:", firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export default app;
