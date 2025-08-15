// --- YOUR FIREBASE CONFIGURATION OBJECT ---
const firebaseConfig = {
    apiKey: "AIzaSyBn2RvXmQ8mfDHrBQal1h5MRFVsOxsqgks",
    authDomain: "alty-jfc-los.firebaseapp.com",
    projectId: "alty-jfc-los",
    storageBucket: "alty-jfc-los.firebasestorage.app",
    messagingSenderId: "40979114514",
    appId: "1:40979114514:web:850676ff855b372d4806cb"
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