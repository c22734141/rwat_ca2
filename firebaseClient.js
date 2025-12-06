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
  projectId: 'demo-ca2',
  apiKey: 'demo',
  appId: 'demo',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const useEmulator = !(typeof process !== 'undefined' && process?.env?.CI);
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

