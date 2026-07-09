import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

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
  // where the cert() env vars above are the only path.
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
  const app = getApp()
  if (!app) return null
  _db = getFirestore(app)
  return _db
}
