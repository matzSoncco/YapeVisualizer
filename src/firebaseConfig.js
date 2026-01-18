// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// PEGA AQUÍ TUS CREDENCIALES (O las que saques del JSON)
const firebaseConfig = {
  apiKey: "AIzaSyDLapeC2Gh8Av2lzufNtKUJIxcOOYpv6ic",
  authDomain: "lectoryape.firebaseapp.com",
  projectId: "lectoryape",
  storageBucket: "lectoryape.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);