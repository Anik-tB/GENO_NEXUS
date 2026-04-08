import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export function isFirebaseClientConfigured() {
  return Object.values(firebaseClientConfig).every((value) => typeof value === "string" && value.length > 0);
}

export function getFirebaseClientApp() {
  if (!isFirebaseClientConfigured()) {
    throw new Error("FIREBASE_CLIENT_NOT_CONFIGURED");
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseClientConfig);
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function getFirebaseClientStorage() {
  return getStorage(getFirebaseClientApp());
}
