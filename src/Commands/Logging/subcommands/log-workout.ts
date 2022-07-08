import { File } from "@google-cloud/storage"
import { CommandInteraction, MessageAttachment, MessageEmbed, User } from "discord.js"
import { Timestamp } from "firebase-admin/firestore"
import { baseEmbedMessage } from "../../../Bot/embed"
import { db } from "../../../firebase"
import { getRelativeDates, requestAndGetImage, saveImageToCloud, getLogs } from "./log.functions"
import { getRandomFile } from "../../../Firebase/storage"
import { LiftTypes, WorkoutLog } from "@types"

export const logWorkout = async function (interaction: CommandInteraction) {
  if (!interaction.member) return

  try {
    // Ask... and save...
    const maessageAttachment = await requestAndGetImage(interaction)
    const storageFile = await saveImageToCloud(interaction, maessageAttachment)
    const logRef = await saveWorkout(interaction, storageFile)
    const logData = <WorkoutLog>(await logRef.get()).data()

    // Calculate...
    const { thisMonth, prevMonth } = getRelativeDates(interaction.createdAt)
    const thisMonthsLogs = await getLogs(interaction, thisMonth.startDate, interaction.createdAt)
    const prevMonthsLogs = await getLogs(interaction, prevMonth.startDate, prevMonth.toDate)
    const reducedLogs = reduceLogs(thisMonthsLogs)

    // Reply...
    const embedReply = await createWorkoutLogEmbed(interaction, logData, [thisMonthsLogs.size, prevMonthsLogs.size], reducedLogs)
    // await generateReport(interaction, logData)
    interaction.editReply({ embeds: [embedReply] })
  } catch (err) {
    if (err instanceof Error) {
      const embed = baseEmbedMessage()
        .setTitle(`⚠️ Sorry, we ran into a problem.`)
        .setDescription(`${err?.message || err}`)
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
async function saveWorkout(interaction: CommandInteraction, storageFile: File) {
  const liftType = interaction.options.getString("lift-type", true)
  const input_date = interaction.options.getNumber("date", true)
  const logType = interaction.options.getSubcommand()
  const loggedDate = interaction.createdAt
  loggedDate.setDate(loggedDate.getDate() - input_date)

  const logsRef = db.collection("logs")
  return await logsRef.add({
    created: Timestamp.now(),
    date: Timestamp.fromDate(loggedDate),
    logType,
    liftType,
    image: storageFile.publicUrl(),
    user: {
      id: interaction.user.id,
      discriminator: interaction.user.discriminator,
      username: interaction.user.username,
      avatar: interaction.user.displayAvatarURL(),
    },
  })
}

function reduceLogs(logs: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>) {
  return logs.docs.reduce((total, current) => {
    const data = <WorkoutLog>current.data()
    const liftType: LiftTypes = data.liftType

    total[liftType] = (total[liftType] ? total[liftType] : 0) + 1

    return total
  }, {} as Record<LiftTypes, number>)
}

/**
 * Formats out a reply using all of the supplied data
 * @param interaction the interaction the bot is replying to
 * @param log the log saved from the interaction
 * @param logCounts array of log counts for this month and previous
 * @returns Discord Message embed object
 */
async function createWorkoutLogEmbed(
  interaction: CommandInteraction,
  log: WorkoutLog,
  logCounts: number[],
  liftTypes: Record<LiftTypes, number>
): Promise<MessageEmbed> {
  const [thisMonthsCount, prevMonthsCount] = logCounts
  const percentage = (thisMonthsCount / (prevMonthsCount ? prevMonthsCount : 1)) * 100

  // Create breakdown
  let typesList = ""
  let countList = ""
  Object.entries(liftTypes)
    .sort(([atype, aCount], [bType, bCount]) => bCount - aCount)
    .map(([key, value]) => {
      typesList += `${key}\n`
      countList += `${value}\n`
    })

  // Create reaction thumb
  let reaction = "neutral"
  reaction = percentage <= 80 ? "negative" : reaction
  reaction = percentage >= 100 ? "positive" : reaction
  const file = await getRandomFile(`assets/reactions/${reaction}`)

  // Create embed
  return baseEmbedMessage()
    .setTitle(`${interaction.user.username} just logged a ${log.liftType.toLowerCase()} workout, please clap!`)
    .setDescription(`\`\`\`You are logging ${percentage}% of the workouts you did last month.\`\`\``)
    .setThumbnail(file.publicUrl())
    .setImage(`${log.image}`)
    .setFields([
      { name: "📅 DATE", value: `${log.date.toDate().toDateString()}`, inline: true },
      { name: `${interaction.createdAt.toLocaleString("default", { month: "long" }).toUpperCase()} TOTAL`, value: `${thisMonthsCount} logs`, inline: true },
      { name: "🏋️‍♂️ LIFTED", value: `${log.liftType}`, inline: false },
      { name: `📈 BREAKDOWN`, value: typesList, inline: true },
      { name: `\u200B`, value: countList, inline: true },
    ])
    .setFooter({
      text: `Last month you logged ${prevMonthsCount} workouts on the same date`,
      iconURL: "https://pbs.twimg.com/profile_images/1536412752813690881/Rgw_qiB6_400x400.jpg",
    })
}
