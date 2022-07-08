import { CardioLog, LogTypes, UsersLogs, WorkoutLog } from "@types"
import { baseEmbedMessage } from "../../../Bot/embed"
import { Collection, CommandInteraction, Formatters } from "discord.js"
import { DocumentData, QuerySnapshot } from "firebase-admin/firestore"
import { db } from "../../../firebase"
import { capitalize } from "lodash"

const awards = {
  'cardio': {
    icon: '🏃',
    title: 'Forest Gump'
  },
  'workout': {
    icon: '🏋️‍♂️',
    title: 'Swoldier'
  }
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/**
 * Gets all logs made between the time period provided
 * @param logType the type of log to get records for
 * @param startDate starting date for the logs to be returned
 * @param endDate ending date for logs to be returned
 * @returns Firebase Snapshot
 */
export async function getLogs(logType: string, startDate: Date, endDate: Date): Promise<QuerySnapshot<DocumentData>> {
  const logsRef = db.collection("logs")
  return await logsRef.where("date", ">", startDate).where("date", "<", endDate).where("logType", "==", logType).get()
}

/**
 * Loops over all logs passed in and groups them into a collection based on user
 * @param logsRef Firebase snapshot of doc refs
 * @returns Discord collection grouped by user.id
 */
export function groupLogsByUser<T extends CardioLog | WorkoutLog>(
  logsRef: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Collection<string, UsersLogs<T>> {
  const collection = new Collection<string, UsersLogs<T>>()

  logsRef.docs.forEach((doc) => {
    const log = <T>doc.data()

    if (!collection.has(log.user.id)) {
      collection.set(log.user.id, {
        user: log.user,
        logs: [log],
      })
    } else {
      const { logs } = collection.get(log.user.id)!
      logs.push(log)
    }
  })

  return collection.sort((logA, logB) => logA.logs.length - logB.logs.length)
}

/**
 * Builds out the embed message to report all logs collected by user ordered by amount
 * @param interaction Discord interaction that initiated the call
 * @param logsByUser Collection of logs grouped by users
 */
export async function reportLogs<T extends CardioLog | WorkoutLog>(
  interaction: CommandInteraction,
  logsByUser: Collection<string, UsersLogs<T>>
) {
  const logType = <LogTypes>interaction.options.getSubcommand()
  const month = interaction.options.getNumber('month', true)

  const embed = baseEmbedMessage()
    .setTitle(`Reporting ${ logType } logs for ${ months[month - 1] }`)
    .setDescription(`Lets give some credit for everyone who logged their ${logType} sessions all month.`)

  let message = createMentionable(logsByUser, 0, 5)
  embed.addField(`1+ ${capitalize(logType)} logs 👍`, message, true)

  message = createMentionable(logsByUser, 5, 10)
  embed.addField(`5+ ${capitalize(logType)} logs 🔥`, message)

  message = createMentionable(logsByUser, 10, 15)
  embed.addField(`10+ ${capitalize(logType)} logs 🥉`, message)

  message = createMentionable(logsByUser, 15, 20)
  embed.addField(`15+ ${capitalize(logType)} logs 🥈`, message)

  message = createMentionable(logsByUser, 20)
  embed.addField(`20+ ${capitalize(logType)} logs 🥇`, message)

  await interaction.reply({ embeds: [embed], ephemeral: false })
}

/**
 * Gets the user(s) with the most logs and builds an embed message to announce the winner(s)
 * @param interaction Discord interaction that initiated the call
 * @param logsByUser Collection of logs grouped by users
 */
export async function reportWinner<T extends CardioLog | WorkoutLog>(interaction: CommandInteraction, logsByUser: Collection<string, UsersLogs<T>>) {
  const logType  = <LogTypes>interaction.options.getSubcommand()
  const month = interaction.options.getNumber('month', true)

  const mostLogs = logsByUser.last()?.logs.length
  const winners = logsByUser.filter(({ user, logs }) => {
    return logs.length >= (mostLogs ? mostLogs : 1)
  })
  winners.each(async ({ user, logs }, userId) => {
    const embed = baseEmbedMessage()
    embed.setTitle(`${ awards[logType].icon } ${ awards[logType].title } of ${ months[month - 1] }: ${ user.username }`)
    embed.setDescription(``)
    embed.setImage(logs.pop()?.image!)
    await interaction.followUp({ embeds: [embed], ephemeral: false })
  })
}

/**
 * #TODO: Split this into separate functions to reduce complexity
 * @param logsByUser
 * @param minLogCount
 * @param maxLogCount
 * @returns
 */
function createMentionable<T extends CardioLog | WorkoutLog>(logsByUser: Collection<string, UsersLogs<T>>, minLogCount: number, maxLogCount?: number): string {
  const filteredLogs = logsByUser.filter(({ user, logs }) => {
    if (maxLogCount) return logs.length >= minLogCount && logs.length < maxLogCount
    return logs.length >= minLogCount
  })

  const mentions = filteredLogs.reduce((message: string, { user, logs }) => {
    return (message += `${message.length ? `, ` : ``}${Formatters.userMention(user.id)} (${logs.length})`)
  }, "")

  return mentions.length ? mentions : "\u200B"
}
