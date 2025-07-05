import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqUc2qc4cjKMoM8EnmOTz2lRWcV4Yw1vc",
  authDomain: "notes-and-documentation-d113c.firebaseapp.com",
  projectId: "notes-and-documentation-d113c",
  storageBucket: "notes-and-documentation-d113c.firebasestorage.app",
  messagingSenderId: "432633944926",
  appId: "1:432633944926:web:ebe1a25ff811c191928dcf",
  measurementId: "G-X621N8BGFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Firebase Storage

export { auth, db, storage };