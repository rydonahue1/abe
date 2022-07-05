import { File } from "@google-cloud/storage"
import { CommandInteraction, MessageAttachment, User } from "discord.js"
import { getRandomFile, uploadMessageAttachment } from "../../../Firebase/storage"
import { baseEmbedMessage } from "../../../Bot/embed"
import { getSortableDate } from "../../../Bot/helpers"
import { db } from "../../../firebase"
// import { getRandomFile, uploadMessageAttachment } from "../../../Firebase/storage"


/**
 * Initiates logging message and prompts user to upload an image to save with their log.
 * @param interaction
 * @returns MessageAttachment
 */
export async function requestAndGetImage(interaction: CommandInteraction): Promise<MessageAttachment> {
  const subCommand = interaction.options.getSubcommand()
  const embed = baseEmbedMessage().setTitle(`Logging ${ subCommand } for: ${ interaction.member?.user.username }`).setDescription(`Now poast that pic of your ${ subCommand } session!`)
  const file = await getRandomFile(`assets/${ subCommand }_fails`)
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

/**
 * Saves the attached image into the storage path based on users name and log type
 * @param interaction
 * @param maessageAttachment
 * @returns File (Google Storage)
 */
export async function saveImageToCloud(interaction: CommandInteraction, maessageAttachment: MessageAttachment): Promise<File> {
  if (!maessageAttachment) throw new Error("I didn't get any image, try again.")

  const subCommand = interaction.options.getSubcommand();
  const user = <User>interaction.member?.user;
  const path = `logs/${ user.username }${ user.discriminator }/${ subCommand }/`
  const fileName = `${ getSortableDate(interaction.createdAt, true) }.jpg`

  return await uploadMessageAttachment(maessageAttachment, path, fileName)
}

/**
 * Gets all logs between provided dates. Can also made dates optional to return all logs
 * @param interaction used to get the subcommand to filter out logs by type and user
 * @param startDate date to get all logs created   after
 * @param endDate date to get all logs created before
 * @returns firebase query snapshot
 */
 export async function getLogs(interaction: CommandInteraction, startDate: Date, endDate: Date): Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>> {
  const subCommand = interaction.options.getSubcommand()
  const logsRef = db.collection("logs")
  return await logsRef
    .where("user.id", "==", interaction.user.id)
    .where("logType", '==', subCommand)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
}

/**
 * Builds out object of first and last days of current month, previous month, and current year
 * (could remake using touples and absract out further)
 * @param date
 * @returns
 */
export function getRelativeDates(date: Date) {
  return {
    thisMonth: {
      startDate: new Date(date.getFullYear(), (date.getMonth() - 1), 1, 0, 0, 0),
      endDate: new Date(date.getFullYear(), date.getMonth(), 0, 0, 0, 0)
    },
    prevMonth: {
      startDate: new Date(date.getFullYear(), (date.getMonth() - 2), 1, 0, 0, 0),
      endDate: new Date(date.getFullYear(), (date.getMonth() - 1), 0, 0, 0, 0)
    },
    thisYear: {
      startDate: new Date(date.getFullYear(), 0, 1, 0, 0, 0),
      endDate: new Date(date.getFullYear() + 1, 0, 0, 0, 0, 0)
    }
  }
}