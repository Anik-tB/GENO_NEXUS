import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminCredentials() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  };
}

export function isFirebaseAdminConfigured() {
  const { projectId, clientEmail, privateKey } = getFirebaseAdminCredentials();
  return Boolean(projectId && clientEmail && privateKey);
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const credentials = getFirebaseAdminCredentials();

  if (!credentials.projectId || !credentials.clientEmail || !credentials.privateKey) {
    throw new Error("FIREBASE_ADMIN_NOT_CONFIGURED");
  }

  return initializeApp({
    credential: cert({
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey
    })
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
