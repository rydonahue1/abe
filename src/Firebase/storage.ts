import { MessageAttachment } from "discord.js"
import { storage } from "../firebase"

import https from "https"
import { v4 as uuidv4 } from "uuid"
import config from "../../config.json"

export async function getRandomFile(path: string) {
  const bucket = storage.bucket(config.firebase_bucket)
  const [files] = await bucket.getFiles({ prefix: path })
  const randomIndex = Math.ceil(Math.random() * (files.length - 1))

  return files[randomIndex]
}

export async function uploadFromURL(url: string, path: string, fileName: string) {
  const bucket = storage.bucket(config.firebase_bucket)
  const fileRef = bucket.file(`${path}${fileName}`)

  return new Promise<typeof fileRef>((resolve, reject) => {
    https.get(url, async (res) => {
      res.pipe(
        fileRef.createWriteStream({
          public: true,
          metadata: {
            cacheControl: "max-age=31536000",
            metadata: {
              firebaseStorageDownloadTokens: uuidv4(), // Can technically be anything you want
            },
          },
        })
      )
      res.on("error", (err) => {
        reject()
        throw err
      })
      res.on("end", () => {
        resolve(fileRef)
      })
    })
  })
}
// Upload remote file to storage bucket
export async function uploadMessageAttachment(attachment: MessageAttachment, path: string, fileName?: string) {

  const bucket = storage.bucket(config.firebase_bucket)
  const name = fileName ? fileName : attachment.name
  const fileRef = bucket.file(`${path}${name}`)
  // bucket.makePublic()

  return new Promise<typeof fileRef>(async (resolve, reject) => {
    const [exists] = await fileRef.exists()
    if (!exists) {
      https.get(attachment.url, async (res) => {
        res.pipe(
          fileRef.createWriteStream({
            public: true,
            metadata: {
              cacheControl: "max-age=60",
              metadata: {
                firebaseStorageDownloadTokens: uuidv4(), // Can technically be anything you want
              },
            },
          })
        )
        res.on("error", (err) => {
          throw err
        })
        res.on("end", () => {
          resolve(fileRef)
        })
      })
    } else {
      reject(new Error('We already have an image saved by that name.'));
    }
  })
}