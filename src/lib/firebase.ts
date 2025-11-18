import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, setPersistence,
  browserLocalPersistence, browserSessionPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCUFOHlPDn6BI9SeD62w4bI-5-S6uoLfi8",
  authDomain: "kolla2.firebaseapp.com",
  projectId: "kolla2",
  storageBucket: "kolla2.firebasestorage.app",
  messagingSenderId: "290738901626",
  appId: "1:290738901626:web:1ec1f956287d15028961c3",
  measurementId: "G-F5EN726WY9"
    
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/** Configura persistencia según "remember me" */
export async function setAuthPersistence(remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}
