import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDocFromServer, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Use environment variables as primary source, fallback to JSON config
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

console.log("Initializing Firebase for project:", config.projectId);

const app = initializeApp(config);

// Use initializeFirestore with experimentalForceLongPolling to handle potential 
// websocket issues in the iframe environment.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId && databaseId !== '(default)' ? databaseId : undefined);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInAnonymously };

// Test connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document to trigger a network request
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection check: Success (Network reachable).");
  } catch (error) {
    console.error("Firestore connection error details:", error);
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("CRITICAL: Firestore client is offline.");
        console.error("ACTION REQUIRED: Go to Firebase Console > Firestore Database > Create Database.");
      } else if (error.message.includes('permission-denied')) {
        console.error("Firestore reachable, but permissions denied. Check your firestore.rules.");
      }
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getUserUsage(userId: string) {
  try {
    const usageDoc = await getDoc(doc(db, 'usage', userId));
    if (usageDoc.exists()) {
      return usageDoc.data();
    }
    // Initialize usage for new user
    const initialUsage = {
      userId,
      lastGenerated: 0,
      countToday: 0,
      tier: 'free'
    };
    await setDoc(doc(db, 'usage', userId), initialUsage);
    return initialUsage;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usage/${userId}`);
  }
}

export async function incrementUsage(userId: string) {
  try {
    const usageDoc = await getDoc(doc(db, 'usage', userId));
    if (usageDoc.exists()) {
      const data = usageDoc.data();
      const now = Date.now();
      const lastGen = new Date(data.lastGenerated);
      const today = new Date(now);
      
      let newCount = data.countToday;
      if (lastGen.toDateString() !== today.toDateString()) {
        newCount = 1;
      } else {
        newCount += 1;
      }
      
      await setDoc(doc(db, 'usage', userId), {
        ...data,
        lastGenerated: now,
        countToday: newCount
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `usage/${userId}`);
  }
}
