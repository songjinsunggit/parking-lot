import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Firebase 콘솔(https://console.firebase.google.com/)에서 새 프로젝트 생성 후
// 웹 앱을 추가하고 발급받은 구성(Config) 객체를 아래에 덮어쓰세요!
const firebaseConfig = {
  apiKey: "API_KEY_HERE",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Config가 입력되지 않았을 경우를 대비한 예외 처리 (로컬 데모용)
const isConfigured = firebaseConfig.apiKey !== "API_KEY_HERE";

let db = null;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db, isConfigured };
