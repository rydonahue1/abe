import { CommandInteraction, MessageAttachment } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"
import { db } from "../../firebase"
import { Timestamp } from "@google-cloud/firestore"

import { baseEmbedMessage } from "../../Bot/embed"
import { getSortableDate } from "../../Bot/helpers"
import { imageExists, isPathToImage } from "../../Bot/images"
import { getRandomFile, uploadMessageAttachment } from "../../Firebase/storage"
import { logCardio } from "./subcommands/log-cardio"

// Settings to use in DB in future
// const adminRoles = ["Coach", "Mod"]
// const userRoles = ["Premium"]

export default {
  name: "log",
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Logs an activity")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("workout")
        .setDescription("Logs workout to GainTrust servers")
        .addStringOption((option) =>
          option
            .setName("lift-type")
            .setDescription("Which body part you hit")
            .setRequired(true)
            .addChoices([
              ["Push Day", "Push Day"],
              ["Pull Day", "Pull Day"],
              ["Leg Day", "Leg Day"],
              ["Chest Day", "Chest Day"],
              ["Back Day", "Back Day"],
              ["Shoulder Day", "Shoulder Day"],
              ["Arm Day", "Arm Day"],
              ["Accessory Day", "Accessory Day"],
              ["Full Body", "Full Body"],
            ])
        )
        .addNumberOption((option) =>
          option
            .setName("date")
            .setDescription("Which day you lifted")
            .setRequired(true)
            .addChoices([
              ["Today", 0],
              ["Yesterday", 1],
            ])
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cardio")
        .setDescription("Logs cardio session to GainTrust servers")
        .addNumberOption((option) => option.setName("minutes").setDescription("How many minutes did you workout?").setRequired(true))
        .addNumberOption((option) =>
          option
            .setName("intensity")
            .setDescription("Which intensity level did you mostly work out in?")
            .setRequired(true)
            .addChoices([
              ["Zone 1 (50-60% MHR)", 1],
              ["Zone 2 (60-70% MHR)", 2],
              ["Zone 3 (70-80% MHR)", 3],
              ["Zone 4 (80-90% MHR)", 4],
              ["Zone 5 (90-100% MHR)", 5],
            ])
        )
        .addNumberOption((option) =>
          option
            .setName("date")
            .setDescription("On Which Day?")
            .setRequired(true)
            .addChoices([
              ["Today", 0],
              ["Yesterday", 1],
            ])
        ),
    ),
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "workout": {
        await logWorkout(interaction)
        break
      }
      case "cardio": {
        await logCardio(interaction)
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}

async function logWorkout(interaction: CommandInteraction) {
  try {
    const docRef = await saveWorkout(interaction)
    const attachedImage = await requestAndGetImage(interaction)
    const updatedRef = await saveWorkoutPic(docRef, attachedImage)
    const snap = await updatedRef.get()
    const log = snap.data()

    if (!log) throw new Error("There was a problem saving the log.")

    const embed = baseEmbedMessage()
      .setTitle(`${interaction.user.username} just logged a workout, please clap!`)
      .setFields([
        { name: "🏋️‍♂️ Lifted", value: `${log.lift_type}`, inline: true },
        { name: "📅 Date", value: `${log.date.toDate().toDateString()}`, inline: true },
      ])
      // .setDescription(`${log.storage_media}`)
      .setImage(`${log.discord_media}`)

    await interaction.followUp({ embeds: [embed], ephemeral: false })
  } catch (err) {
    if (err instanceof Error) {
      const embed = baseEmbedMessage().setTitle(`⚠️ Sorry, we ran into a problem.`).setDescription(`${err.message}`)
      if (interaction.replied) await interaction.followUp({ embeds: [embed], ephemeral: false })
      if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: false })
    }
  }
}

async function requestAndGetImage(interaction: CommandInteraction) {
  const file = await getRandomFile("assets/gym_fails")
  const url = file.publicUrl()
  const authorId = interaction.member?.user.id
  const embed = baseEmbedMessage()
    .setTitle(`Logging workout for: ${interaction.user.username}`)
    .setDescription(`Now poast that pic of your workout!`)
    .setImage(url)

  await interaction.reply({ embeds: [embed], ephemeral: false })

  const collected = await interaction.channel?.awaitMessages({
    filter: (message) => {
      return message.author.id === authorId
    },
    time: 30_000,
    max: 1,
  })

  const message = collected?.first()
  const attachment = message?.attachments.first()

  return attachment
}

async function saveWorkout(interaction: CommandInteraction) {
  const lift_type = interaction.options.getString("lift-type")!
  const input_date = interaction.options.getNumber("date")!
  const loggedDate = interaction.createdAt;
  loggedDate.setDate(loggedDate.getDate() - input_date)

  // const path = `logs/${interaction.user.username}${interaction.user.discriminator}/`
  // const fileName = `${getSortableDate(date)}.jpg`
  const logsRef = db.collection("logs")
  const snap = await logsRef.where("user.id", "==", interaction.user.id).where("date", "==", loggedDate).get()
  if (snap.docs.length) throw new Error("Looks like we already have a log that day, champ.")

  return await logsRef.add({
    created: Timestamp.now(),
    date: Timestamp.fromDate(loggedDate),
    lift_type,
    user: {
      id: interaction.user.id,
      discriminator: interaction.user.discriminator,
      username: interaction.user.username,
      avatar: interaction.user.displayAvatarURL(),
    },
  })
}

async function saveWorkoutPic(docRef: FirebaseFirestore.DocumentReference, attachedImage: MessageAttachment | undefined) {
  if (!attachedImage || !isPathToImage(attachedImage.url) || !imageExists(attachedImage.url)) {
    await docRef.delete()
    throw new Error("You didn't send a picture, or you were too slow. I don't have all day man.")
  }

  const log = await docRef.get()
  if (!log.exists) throw new Error("Something somewhere went wrong. Ops")

  const logData = log.data()!
  const path = `logs/${logData.user.username}${logData.user.discriminator}/`
  const timestamp = logData.date as Timestamp
  const fileName = `${getSortableDate(timestamp.toDate())}.jpg`
  const fileRef = await uploadMessageAttachment(attachedImage, path, fileName)

  if (!fileRef) {
    await docRef.delete()
    throw new Error("Something went wrong saving your image to the server.")
  }

  await docRef.set(
    {
      discord_media: attachedImage.url,
      storage_media: fileRef.publicUrl(),
    },
    { merge: true }
  )

  return docRef
}
