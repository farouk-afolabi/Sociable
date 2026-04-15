// Import the necessary functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  authDomain: "trainlinkit-c98b9.firebaseapp.com",
  projectId: "trainlinkit-c98b9",
  storageBucket: "trainlinkit-c98b9.firebasestorage.app",
  messagingSenderId: "335547332391",
  appId: "1:335547332391:web:134b8789ec97f1c0badb02",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, collection, onSnapshot };
