import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 사용자님이 발급받으신 진짜 Database 키!
const firebaseConfig = {
  apiKey: "AIzaSyC3VUmXxVJlXfeS28Xf6LvR4xXwg9Tgpzs",
  authDomain: "parking-b37bb.firebaseapp.com",
  projectId: "parking-b37bb",
  storageBucket: "parking-b37bb.firebasestorage.app",
  messagingSenderId: "616347084946",
  appId: "1:616347084946:web:fd700c9d65a3a50598de4b"
};

const isConfigured = firebaseConfig.apiKey !== "API_KEY_HERE";

let db = null;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db, isConfigured };
