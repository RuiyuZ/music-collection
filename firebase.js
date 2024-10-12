import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBL-lzvWRwXj3AZd43ACpPupRAKs9kZA4w",
    authDomain: "the-pao-music-collection.firebaseapp.com",
    databaseURL: "https://the-pao-music-collection-default-rtdb.firebaseio.com",
    projectId: "the-pao-music-collection",
    storageBucket: "the-pao-music-collection.appspot.com",
    messagingSenderId: "559214028951",
    appId: "1:559214028951:web:429781b0dfa7afb57a61d2",
    measurementId: "G-TF22D13MWR"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
