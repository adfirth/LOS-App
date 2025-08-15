// --- YOUR FIREBASE CONFIGURATION OBJECT ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBn2RvXmQ8mfDHrBQal1h5MRFVsOxsqgks",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "alty-jfc-los.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "alty-jfc-los",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "alty-jfc-los.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "40979114514",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:40979114514:web:850676ff855b372d4806cb"
  };
  

// Initialize Firebase and attach services to the global 'window' object
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
    }
    
    // By assigning to window.auth and window.db, they become globally accessible
    window.auth = firebase.auth();
    window.db = firebase.firestore();

    console.log("firebase-init.js has loaded and initialized successfully!");

} catch (error) {
    console.error("Error initializing Firebase:", error);
}