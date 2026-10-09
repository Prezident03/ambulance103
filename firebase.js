// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
// Ma'lumotlar brauzerda keshlanadi: bir marta ochilgan kasallik/dori internetsiz ham ko'rinadi
let firestore;
try {
  firestore = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  firestore = getFirestore(app);
}
export const db = firestore;
export const storage = getStorage(app);

// Sahifa ochilganda Firebase saqlangan sessiyani tiklaguncha kutish uchun.
// Firestore qoidalari kirgan foydalanuvchini talab qilsa, so'rovlar shundan keyin yuborilishi kerak.
export const authReady = auth.authStateReady();
