import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBc3VqoCcOr65YRHPLei03cYf_NaeeHIpk",
    authDomain: "notes-and-documentation.firebaseapp.com",
    projectId: "notes-and-documentation",
    storageBucket: "notes-and-documentation.appspot.com",
    messagingSenderId: "628489634075",
    appId: "1:628489634075:web:7187677d8e7c84ee2653be",
    measurementId: "G-4JSE9N1L54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Firebase Storage

export { auth, db, storage };