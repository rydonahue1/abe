import firebase from "firebase-admin"
import { initializeApp, App, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import config from "../config.json"

let firebaseApp: App | undefined = undefined;

if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: firebase.credential.cert(config.firebase_admin as firebase.ServiceAccount),
  })
}

export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)

