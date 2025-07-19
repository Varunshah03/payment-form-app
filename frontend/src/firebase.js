import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, signInWithPopup } from "firebase/auth";

// Ensure Firebase SDK version is 9.x.x or higher in package.json
// Example: "firebase": "^9.23.0" or "^10.x.x"
const firebaseConfig = {
  apiKey: "AIzaSyAj0t2TcjmdFAiibaF73FwEvXyTolgqc7Y",
  authDomain: "paymentformapp-1c7a1.firebaseapp.com",
  projectId: "paymentformapp-1c7a1",
  storageBucket: "paymentformapp-1c7a1.firebasestorage.app",
  messagingSenderId: "966850081944",
  appId: "1:966850081944:web:915d736a32800dbf39cced"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, signInWithPopup };