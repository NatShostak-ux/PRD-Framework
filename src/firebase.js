// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVVjB1cmdeDPLuR4KrDqw54H_2wlFn51E",
  authDomain: "fdsg-strategy-hub.firebaseapp.com",
  projectId: "fdsg-strategy-hub",
  storageBucket: "fdsg-strategy-hub.firebasestorage.app",
  messagingSenderId: "413022208913",
  appId: "1:413022208913:web:5c650953ebb8aca1759030",
  measurementId: "G-54J51Z9WP8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
