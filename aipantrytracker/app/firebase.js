// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-pb0QYQ27jvkPWrB9eraFuymqQ833W6k",
  authDomain: "pantrytracker-f0526.firebaseapp.com",
  projectId: "pantrytracker-f0526",
  storageBucket: "pantrytracker-f0526.appspot.com",
  messagingSenderId: "1065594577832",
  appId: "1:1065594577832:web:3d971449777959ebf3f39d",
  measurementId: "G-06BV3ESNJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);