import { GuildRecord, VideoRecord, LogRecord, CommandOptionsRecord } from "@types"
import { firestore } from "firebase-admin"
import { db } from "../firebase"



const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) => snap.data() as T
})

const dataPoint = <T>(collectionPath: string) => db.collection(collectionPath).withConverter(converter<T>())

export const collections = {
  commandOptions: dataPoint<CommandOptionsRecord>('commandOptions'),
  guilds: dataPoint<GuildRecord>('guilds'),
  logs: dataPoint<LogRecord>('logs'),
  videos: dataPoint<VideoRecord>('videos'),
}