// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFFjXYwSKWDoNeCJBT1G9K0xu_LVoRA9Y",
  authDomain: "ddingdong-mvp.firebaseapp.com",
  projectId: "ddingdong-mvp",
//   storageBucket: "ddingdong-mvp.firebasestorage.app",
  storageBucket: "ddingdong-mvp.appspot.com",
  messagingSenderId: "365640667813",
  appId: "1:365640667813:web:53a69e58ee01570faa334c",
  measurementId: "G-Z6FP8TB669"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);