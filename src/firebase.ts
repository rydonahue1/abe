import firebase from "firebase-admin"
import { initializeApp, App, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { firebaseAdmin } from "./config";

let firebaseApp: App | undefined = undefined;

if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: firebase.credential.cert(firebaseAdmin as firebase.ServiceAccount),
  })
}

const db = getFirestore(firebaseApp)
const storage = getStorage(firebaseApp)

db.settings({ ignoreUndefinedProperties: true })

export {
  db,
  storage
}
