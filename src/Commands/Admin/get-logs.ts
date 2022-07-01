import { CacheType, Collection, CommandInteraction, Formatters } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"

import { db } from "../../firebase"
import { baseEmbedMessage } from "../../Bot/embed"

const workout_types = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Chest Day",
  "Back Day",
  "Shoulder Day",
  "Arm Day",
  "Accessory Day",
  "Full Body",
]

export default {
  name: "get",
  requiredRoles: ['Admin', 'Mod'],
  data: new SlashCommandBuilder()
    .setName("get")
    .setDescription("Gets data from DB")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("logs")
        .setDescription("gets workout logs from GainTrust servers")
        .addNumberOption((option) =>
          option
            .setName("month")
            .setDescription("The month to calculate the logs for")
            .setRequired(true)
            .addChoices([
              ["January", 1],
              ["February", 2],
              ["March", 3],
              ["April", 4],
              ["May", 5],
              ["June", 6],
              ["July", 7],
              ["August", 8],
              ["September", 9],
              ["October", 10],
              ["November", 11],
              ["December", 12],
            ])
        )
        .addNumberOption((option) =>
          option
            .setName("year")
            .setDescription("The year to calculate the logs for")
            .setRequired(true)
        )
    ),
  run: async function (interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand(true)) {
      case "logs": {
        await getLogs(interaction);
        break
      }
      default: {
        console.log("No command found")
      }
    }
  },
}

async function getLogs(interaction: CommandInteraction): Promise<void> {
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  const month = interaction.options.getNumber('month', true) ? interaction.options.getNumber('month', true) : thisMonth
  const year = interaction.options.getNumber('year', true) ? interaction.options.getNumber('year', true) : thisYear

  const startDay = new Date(year, (month - 1), 1, 0)
  const lastDay = new Date(year, month, 0,)

  console.log(startDay);
  console.log(lastDay);

  const logsRef = db.collection('logs')
  const q = await logsRef
    .where('date', '>', startDay)
    .where('date', '<', lastDay)
    .where('lift_type', "in", workout_types)
    .get()
  
  const logs = new Collection<string, EnumeratedWorkouts>()

  q.docs.forEach(doc => {
    const log = <FirebaseWorkoutLog>doc.data()
    const workout: Workout = {
      date: log.date,
      lift_type: log.lift_type,
      discord_media: log.discord_media
    }

    if (!logs.has(log?.user.id)) {
      logs.set(log.user.id, {
        user: log.user,
        workouts: [ workout ]
      })
    } else {
      const currentLog = <EnumeratedWorkouts>logs.get(log.user.id)
      currentLog.workouts = [...currentLog.workouts, workout]
    }
  })

  logs.sort((logA, logB) => logA.workouts.length - logB.workouts.length)

  reportLogs(interaction, month, logs)


}

async function reportLogs(interaction: CommandInteraction<CacheType>, month: number, logs: Collection<string, EnumeratedWorkouts>) {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const embed = baseEmbedMessage()
      .setTitle(`Reporting workout logs for ${months[month - 1]}`)
      .setDescription(`Lets give some credit for everyone who logged their workouts all month.`)

  let message = createMentionable(logs, 0, 5);
  embed.addField('Workouts logged 👍', message, true)

  message = createMentionable(logs, 5, 10);
  embed.addField('5+ Workouts logged 🔥', message)

  message = createMentionable(logs, 10, 15);
  embed.addField('10+ Workouts logged 🥉', message)

  message = createMentionable(logs, 15, 20);
  embed.addField('15+ Workouts logged 🥈', message)

  message = createMentionable(logs, 20);
  embed.addField('20+ Workouts logged 🥇', message)

  const winner = logs.last()
  let winnerImage = winner?.workouts[winner?.workouts.length - 1].discord_media;
  winnerImage = winnerImage ? winnerImage : winner?.workouts[winner?.workouts.length - 2].discord_media;
  winnerImage = winnerImage ? winnerImage : winner?.workouts[winner?.workouts.length - 3].discord_media;
  winnerImage = winnerImage ? winnerImage : winner?.workouts[0].discord_media;
  embed.addField('Swoldier of the Month 🏋️‍♂️', `${Formatters.userMention(winner!.user.id)}`)

  if (winnerImage) {
    embed.setImage(winnerImage);
  }

  await interaction.reply({ embeds: [embed], ephemeral: false })
}

function createMentionable(logs: Collection<string, EnumeratedWorkouts>, minWorkouts: number, maxWorkouts?: number): string {
  const filteredLogs = logs.filter((workout) => {
    if (maxWorkouts) return workout.workouts.length >= minWorkouts && workout.workouts.length < maxWorkouts
    return workout.workouts.length >= minWorkouts
  })

  const mentions = filteredLogs.reduce((message: string, workout) => {
    return message = message.length ? `${message}, ${Formatters.userMention(workout.user.id)} (${workout.workouts.length})` : `${Formatters.userMention(workout.user.id)} (${workout.workouts.length})`
  }, '');

  return mentions.length ? mentions : '-';
}

interface FirebaseWorkoutLog extends Workout {
  created: Date;
  user: WorkoutUser
}

interface EnumeratedWorkouts {
  user: WorkoutUser
  workouts: Workout[];
}

interface Workout {
  date: Date;
  discord_media: string;
  lift_type: string;
}

interface WorkoutUser {
  avatar: string;
  discriminator: string;
  id: string;
  username: string;
}