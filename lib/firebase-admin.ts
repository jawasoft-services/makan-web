import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app"
import { getFirestore, Firestore, type Settings } from "firebase-admin/firestore"
import { federatedCredentials } from "./gcp-federation"

function getApp(): App | null {
  if (getApps().length) return getApps()[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    })
  }

  // Local dev: fall back to gcloud Application Default Credentials
  // (`gcloud auth application-default login`). Never present on Vercel,
  // where federation (getDb) or the cert() env vars above are the paths.
  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId: projectId ?? "munchies-expo",
    })
  } catch {
    return null
  }
}

let _db: Firestore | null = null

export function getDb(): Firestore | null {
  if (_db) return _db
  // RM20289: firebase-admin's Firestore accepts only a key or ADC, so the
  // federated credentials go to the Firestore class it re-exports. Its
  // `credentials` type lists key fields only; google-gax hands the object to
  // GoogleAuth, which builds the external-account client from it.
  const credentials = federatedCredentials(process.env.GCP_SERVICE_ACCOUNT_EMAIL)
  if (credentials) {
    _db = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID ?? "munchies-expo",
      credentials: credentials as unknown as Settings["credentials"],
    })
    return _db
  }
  const app = getApp()
  if (!app) return null
  _db = getFirestore(app)
  return _db
}
