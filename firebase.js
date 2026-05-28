// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCe3JRLDo5odKbeO8cFkidr2qat5kJFKso",
  authDomain: "ambulance103-b3e0c.firebaseapp.com",
  projectId: "ambulance103-b3e0c",
  storageBucket: "ambulance103-b3e0c.firebasestorage.app",
  messagingSenderId: "830702034735",
  appId: "1:830702034735:web:b32bb226e1e82e51434bda",
  measurementId: "G-L2KJT1EHH0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
