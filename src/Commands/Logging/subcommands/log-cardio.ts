import { File } from "@google-cloud/storage"
import { CommandInteraction, MessageAttachment, MessageEmbed, User } from "discord.js"
import { Timestamp } from "firebase-admin/firestore"
import { baseEmbedMessage } from "../../../Bot/embed"
import { db } from "../../../firebase"
import { getRelativeDates, requestAndGetImage, saveImageToCloud, getLogs } from "./log.functions"

export const logCardio = async function (interaction: CommandInteraction) {
  if (!interaction.member) return

  try {
    // Ask... and save...
    const maessageAttachment = await requestAndGetImage(interaction)
    const storageFile = await saveImageToCloud(interaction, maessageAttachment)
    const logRef = await saveCardioLog(interaction, storageFile)
    const logData = <CardioLog>(await logRef.get()).data()

    // Calculate...
    const { thisMonth, prevMonth } = getRelativeDates(interaction.createdAt);
    const thisMonthsLogs = await getLogs(interaction, thisMonth.startDate, interaction.createdAt);
    const prevMonthsLogs = await getLogs(interaction, prevMonth.startDate, prevMonth.endDate);
    const thisMonthsTotals = reduceLogs(thisMonthsLogs)
    const prevMonthsTotals = reduceLogs(prevMonthsLogs)
    const thisMonthsAverages = getAverages(thisMonthsTotals, thisMonthsLogs.size)
    const prevMonthsAverages = getAverages(prevMonthsTotals, prevMonthsLogs.size)

    // Reply...
    const embedReply = createCardioLogEmbed(interaction, logData, [thisMonthsAverages, prevMonthsAverages])
    // await generateReport(interaction, logData)
    interaction.editReply({ embeds: [embedReply] })
  }

  catch (err) {
    if (err instanceof Error) {
      const embed = baseEmbedMessage().setTitle(`⚠️ Sorry, we ran into a problem.`).setDescription(`${ err?.message || err }`)
      if (interaction.replied) await interaction.followUp({ embeds: [embed], ephemeral: false })
      if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: false })
    }
  }

}

/**
 * Saves the cardio log into Firebase
 * @param interaction the interaction the bot is replying to
 * @param storageFile the attached file the user uploaded
 * @returns Firebase doc reference
 */
async function saveCardioLog(interaction: CommandInteraction, storageFile: File) {
  const minutes = interaction.options.getNumber("minutes")!
  const intensity = interaction.options.getNumber("intensity")!
  const input_date = interaction.options.getNumber("date")!
  const logType = interaction.options.getSubcommand()
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
    logType,
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

/**
 * Adds up properties of all cardio logs supplied
 * (Can try an abstract out this and getAverages to work with all log types in future)
 * @param logs firebase snapshot of cardio logs
 * @returns an object containing totaled data
 */
function reduceLogs(logs: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>): CardioStats {
  return logs.docs.reduce((total, current) => {
    const data = <CardioLog>current.data()

    return {
      minutes: total.minutes + data.minutes,
      intensity: total.intensity + data.intensity
    }
  }, { minutes: 0, intensity: 0})
}

/**
 * Calculates out the averages for each property in a cardio log
 * (can be abstracted out for all log types)
 * @param totals object of all properties caltulating the average of
 * @param count total number of logs to divide by
 * @returns object containing tallied averages as well as total log count provided
 */
function getAverages(totals: CardioStats, count: number): CardioStats {
  const totalCount = count ? count : 1
  return {
    count: totalCount,
    minutes: Math.round((totals.minutes! / totalCount) * 10) / 10,
    intensity: Math.round((totals.intensity! / totalCount) * 10) / 10
  }
}

/**
 * Formats out a reply using all of the supplied data 
 * @param interaction the interaction the bot is replying to
 * @param log the log saved from the interaction
 * @param averages the monthly stat averages of the user who initialized the interaction
 * @returns Discord Message embed object
 */
function createCardioLogEmbed(interaction: CommandInteraction, log: CardioLog, averages : CardioStats[]): MessageEmbed {
  const [thisMonthsAverages, prevMonthsAverages] = averages;
  const percentage = (thisMonthsAverages.count! / prevMonthsAverages.count!) * 100
  return baseEmbedMessage()
    .setTitle(`${ interaction.user.username } just logged some cardio, please clap!`)
    .setDescription(`You are logging ${ percentage }% of the cardio you did last month.`)
    .setImage(`${ log.image }`)
    .setFields([
      { name: "📅 Date", value: `${ interaction.createdAt.toDateString() }`, inline: false },
      { name: "🏃‍♂️ Today's Length", value: `${ log.minutes } min`, inline: true },
      { name: `${ interaction.createdAt.toLocaleString('default', { month: 'long' }) }'s Average`, value: `${ thisMonthsAverages.minutes } min`, inline: true },
      { name: `Last Month's Average`, value: `${ prevMonthsAverages.minutes } min`, inline: true },
      { name: "💦 Today's Intensity", value: `Zone ${ log.intensity }`, inline: true },
      { name: `${ interaction.createdAt.toLocaleString('default', { month: 'long' }) }'s Average`, value: `Zone ${ thisMonthsAverages.intensity }`, inline: true },
      { name: `Last Month's Average`, value: `Zone ${ prevMonthsAverages.intensity }`, inline: true },
    ])
}

// async function generateReport(interaction: CommandInteraction, logData: FirebaseFirestore.DocumentData | undefined) {
  // const logDate = interaction.createdAt
  // const prevMonthStart = new Date(logDate.getFullYear(), logDate.getMonth() - 1, 1)
  // const prevMonthEnd = new Date(logDate.getFullYear(), logDate.getMonth() - 1, logDate.getDate())

  // interaction.options.getSubcommand

  // const logsRef = db.collection("logs")
  // const prevMonthLogs = await logsRef
  //   .where("user.id", "==", interaction.user.id)
  //   .where("lift_type", '==', 'cardio')
  //   .where('date', '>=', prevMonthStart)
  //   .where('date', '<=', prevMonthEnd)
  //   .get()

  // const thisMonthLogs = await logsRef
  //   .where("user.id", "==", interaction.user.id)
  //   .where("lift_type", '==', 'cardio')
  //   .where('date', '>=', prevMonthStart)
  //   .where('date', '<=', logDate)
  //   .get()

  // const prevMonthsTotals = prevMonthLogs.docs.reduce((total, current) => {
  //   const data = <CardioLog>current.data()

  //   return {
  //     minutes: total.minutes + data.minutes,
  //     intensity: total.intensity + data.intensity
  //   }
  // }, { minutes: 0, intensity: 0})

  // const thisMonthTotals = thisMonthLogs.docs.reduce((total, current) => {
  //   const data = <CardioLog>current.data()

  //   return {
  //     minutes: total.minutes + data.minutes,
  //     intensity: total.intensity + data.intensity
  //   }
  // }, { minutes: 0, intensity: 0})

  // const prevMonthLogCount = prevMonthLogs.size ? prevMonthLogs.size : 1;
  // const thisMonthLogCount = thisMonthLogs.size;
  // const percentage = (thisMonthLogCount / prevMonthLogCount) * 100;

  // const averages = {
  //   thisMonth: {
  //     month: logData?.date.toDate().toLocaleString('default', { month: 'long' }),
  //     minutes: Math.round((thisMonthTotals.minutes / thisMonthLogs.size) * 10) / 10,
  //     intensity: Math.round((thisMonthTotals.intensity / thisMonthLogs.size) * 10) / 10,
  //   },
  //   prevMonth: {
  //     minutes: Math.round((prevMonthsTotals.minutes / thisMonthLogs.size) * 10) / 10,
  //     intensity: Math.round((prevMonthsTotals.intensity / thisMonthLogs.size) * 10) / 10,
  //   }
  // }

  // const embed = baseEmbedMessage()
  //   .setTitle(`${ interaction.user.username } just logged some cardio, please clap!`)
  //   .setDescription(`You are logging ${ percentage }% of the cardio you did last month.`)
  //   .setImage(`${ logData?.image }`)
  //   .setFields([
  //     { name: "📅 Date", value: `${ logData?.date.toDate().toDateString() }`, inline: false },
  //     { name: "🏃‍♂️ Today's Length", value: `${ logData?.minutes } min`, inline: true },
  //     { name: `${ averages.thisMonth.month }'s Average`, value: `${ averages.thisMonth.minutes } min`, inline: true },
  //     { name: `Last Month's Average`, value: `${ averages.prevMonth.minutes } min`, inline: true },
  //     { name: "💦 Today's Intensity", value: `Zone ${ logData?.intensity }`, inline: true },
  //     { name: `${ averages.thisMonth.month }'s Average`, value: `Zone ${ averages.thisMonth.intensity }`, inline: true },
  //     { name: `Last Month's Average`, value: `Zone ${ averages.prevMonth.intensity }`, inline: true },
  //   ])
  // interaction.editReply({ embeds: [embed] })
// }

interface CardioLog {
  created: Timestamp;
  date: Timestamp;
  image: string;
  intensity: number;
  lift_type: 'cardio';
  minutes: number;
  user: DiscordUser;
}

type CardioStats = Pick<CardioLog, 'minutes' | 'intensity'> & {
  count?: number;
}

interface DiscordUser {
  avatar: string;
  discriminator: string;
  id: string;
  username: string;
}
