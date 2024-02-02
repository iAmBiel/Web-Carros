import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC6tGDzfhWPqrFjkmegIhXKDJT9EQ9j3BQ",
  authDomain: "webcarrosss.firebaseapp.com",
  projectId: "webcarrosss",
  storageBucket: "webcarrosss.appspot.com",
  messagingSenderId: "623936032939",
  appId: "1:623936032939:web:a436ad9734b1317ed367ee"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { db, auth, storage };

