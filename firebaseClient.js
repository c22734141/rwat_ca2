import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getDocs,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-ca2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const hasProdConfig = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY);
const useEmulator = !hasProdConfig && !(typeof process !== 'undefined' && process?.env?.CI);
if (useEmulator) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

const RESULTS_COLLECTION = 'gameResults';

export async function saveResult(clicks) {
  if (typeof clicks !== 'number' || Number.isNaN(clicks)) {
    throw new Error('clicks must be a number');
  }
  await addDoc(collection(db, RESULTS_COLLECTION), {
    clicks,
    completedAt: serverTimestamp(),
  });
}

export async function getAverageClicks() {
  const snap = await getDocs(collection(db, RESULTS_COLLECTION));
  if (snap.empty) {
    return null;
  }
  let total = 0;
  let count = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (typeof data.clicks === 'number') {
      total += data.clicks;
      count += 1;
    }
  });
  if (count === 0) {
    return null;
  }
  return total / count;
}

export { db };

