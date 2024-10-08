// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import getStorage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBctHk3-RGxJZHNN84pmcUz_5m6fM7-pZY",
    authDomain: "my-react-7dedd.firebaseapp.com",
    projectId: "my-react-7dedd",
    storageBucket: "my-react-7dedd.appspot.com",
    messagingSenderId: "1013778909016",
    appId: "1:1013778909016:web:1d5e01146cb419d736072d",
    measurementId: "G-Y7EWM544D8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);