import { File } from "@google-cloud/storage"
import { CommandInteraction, MessageAttachment, User } from "discord.js"
import { Timestamp } from "firebase-admin/firestore"
import { baseEmbedMessage } from "../../../Bot/embed"
import { getSortableDate } from "../../../Bot/helpers"
import { db } from "../../../firebase"
import { getRandomFile, uploadMessageAttachment } from "../../../Firebase/storage"

export const logCardio = async function (interaction: CommandInteraction) {
  if (!interaction.member) return

  try {
    const maessageAttachment = await requestAndGetImage(interaction)
    const storageFile = await saveWorkoutPic(interaction, maessageAttachment)
    const log = await saveWorkout(interaction, storageFile)
    await generateReport(interaction, log);
  }

  catch (err) {
    if (err instanceof Error) {
      const embed = baseEmbedMessage().setTitle(`⚠️ Sorry, we ran into a problem.`).setDescription(`${ err?.message || err }`)
      if (interaction.replied) await interaction.followUp({ embeds: [embed], ephemeral: false })
      if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: false })
    }
  }

}

async function requestAndGetImage(interaction: CommandInteraction): Promise<MessageAttachment> {
  const embed = baseEmbedMessage().setTitle(`Logging cardio for: ${ interaction.member?.user.username }`).setDescription(`Now poast that pic of your cardio session!`)
  const file = await getRandomFile(`assets/cardio_fails`)
  embed.setImage(file.publicUrl())
  await interaction.reply({ embeds: [embed], ephemeral: false })

  // Listen to and collect replies from author
  const authorId = interaction.member?.user.id
  const collected = await interaction.channel?.awaitMessages({
    filter: (message) => {
      return message.author.id === authorId
    },
    time: 60_000,
    max: 1,
  })

  const message = collected?.first()
  const attachment = message?.attachments.first()
  await message?.delete();
  if (!attachment) throw new Error(`There was a problem getting your image.`)
  return attachment
}

async function saveWorkoutPic(interaction: CommandInteraction, maessageAttachment: MessageAttachment): Promise<File> {
  if (!maessageAttachment) throw new Error("I didn't get any image, try again.")

  const user = <User>interaction.member?.user;
  const path = `logs/${ user.username }${ user.discriminator }/`
  const fileName = `${ getSortableDate(interaction.createdAt, true) }.jpg`

  return await uploadMessageAttachment(maessageAttachment, path, fileName)
}

async function saveWorkout(interaction: CommandInteraction, storageFile: File) {
  const minutes = interaction.options.getNumber("minutes")!
  const intensity = interaction.options.getNumber("intensity")!
  const input_date = interaction.options.getNumber("date")!
  const lift_type = interaction.options.getSubcommand()
  const loggedDate = interaction.createdAt;
  loggedDate.setDate(loggedDate.getDate() - input_date)

  // const path = `logs/${interaction.user.username}${interaction.user.discriminator}/`
  // const fileName = `${getSortableDate(date)}.jpg`
  const logsRef = db.collection("logs")
  // Commented out to allow more thank one log in a day
  // const snap = await logsRef.where("user.id", "==", interaction.user.id).where("date", "==", loggedDate).get()
  // if (snap.docs.length) throw new Error("Looks like we already have a log that day, champ.")

  return await logsRef.add({
    created: Timestamp.now(),
    date: Timestamp.fromDate(loggedDate),
    lift_type,
    minutes,
    intensity,
    image: storageFile.publicUrl(),
    user: {
      id: interaction.user.id,
      discriminator: interaction.user.discriminator,
      username: interaction.user.username,
      avatar: interaction.user.displayAvatarURL(),
    },
  })
}

async function generateReport(interaction: CommandInteraction, log: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>) {
  const logDate = interaction.createdAt
  const prevMonthStart = new Date(logDate.getFullYear(), logDate.getMonth() - 1, 1)
  const prevMonthEnd = new Date(logDate.getFullYear(), logDate.getMonth() - 1, logDate.getDate())

  const logsRef = db.collection("logs")
  const prevMonthLogs = await logsRef
    .where("user.id", "==", interaction.user.id)
    .where("lift_type", '==', 'cardio')
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', prevMonthEnd)
    .get()

  const thisMonthLogs = await logsRef
    .where("user.id", "==", interaction.user.id)
    .where("lift_type", '==', 'cardio')
    .where('date', '>=', prevMonthStart)
    .where('date', '<=', logDate)
    .get()

  const prevMonthsTotals = prevMonthLogs.docs.reduce((total, current) => {
    const data = <CardioLog>current.data()

    return {
      minutes: total.minutes + data.minutes,
      intensity: total.intensity + data.intensity
    }
  }, { minutes: 0, intensity: 0})

  const thisMonthTotals = thisMonthLogs.docs.reduce((total, current) => {
    const data = <CardioLog>current.data()

    return {
      minutes: total.minutes + data.minutes,
      intensity: total.intensity + data.intensity
    }
  }, { minutes: 0, intensity: 0})

  const prevMonthLogCount = prevMonthLogs.size ? prevMonthLogs.size : 1;
  const thisMonthLogCount = thisMonthLogs.size;
  const percentage = (thisMonthLogCount / prevMonthLogCount) * 100;

  const logData = <CardioLog>(await log.get()).data();
  const averages = {
    thisMonth: {
      month: logData?.date.toDate().toLocaleString('default', { month: 'long' }),
      minutes: Math.round((thisMonthTotals.minutes / thisMonthLogs.size) * 10) / 10,
      intensity: Math.round((thisMonthTotals.intensity / thisMonthLogs.size) * 10) / 10,
    },
    prevMonth: {
      minutes: Math.round((prevMonthsTotals.minutes / thisMonthLogs.size) * 10) / 10,
      intensity: Math.round((prevMonthsTotals.intensity / thisMonthLogs.size) * 10) / 10,
    }
  }

  const embed = baseEmbedMessage()
    .setTitle(`${ interaction.user.username } just logged some cardio, please clap!`)
    .setDescription(`You are logging ${ percentage }% of the cardio you did last month.`)
    .setImage(`${ logData?.image }`)
    .setFields([
      { name: "📅 Date", value: `${ logData?.date.toDate().toDateString() }`, inline: false },
      { name: "🏃‍♂️ Today's Length", value: `${ logData?.minutes } min`, inline: true },
      { name: `${ averages.thisMonth.month }'s Average`, value: `${ averages.thisMonth.minutes } min`, inline: true },
      { name: `Last Month's Average`, value: `${ averages.prevMonth.minutes } min`, inline: true },
      { name: "💦 Today's Intensity", value: `Zone ${ logData?.intensity }`, inline: true },
      { name: `${ averages.thisMonth.month }'s Average`, value: `Zone ${ averages.thisMonth.intensity }`, inline: true },
      { name: `Last Month's Average`, value: `Zone ${ averages.prevMonth.intensity }`, inline: true },
    ])
  interaction.editReply({ embeds: [embed] })
}

interface CardioLog {
  created: Timestamp;
  date: Timestamp;
  image: string;
  intensity: number;
  lift_type: 'cardio';
  minutes: number;
  user: DiscordUser;
}

interface DiscordUser {
  avatar: string;
  discriminator: string;
  id: string;
  username: string;
}
