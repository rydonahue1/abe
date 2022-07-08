import { Command, Event } from "@types"
import { Client, Collection, CommandInteraction, Intents } from "discord.js"
import glob from "glob";
import { promisify } from "util";
import { REST } from "@discordjs/rest";
import { APIApplicationCommand, Routes } from "discord-api-types/v10";

const globPromise = promisify(glob)

export default class Bot extends Client {
  public events: Collection<string, Event> = new Collection()
  public aliases: Collection<string, Command> = new Collection()
  public commands: Collection<string, Command> = new Collection()
  public activeCommands: Collection<string, string> = new Collection()
  public restApi: REST;
  // private static instance: Bot;

  public constructor(token: string) {
    super({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] })
    this.restApi = new REST({ version: "9" }).setToken(token)
  }

  // public static getInstance() {
  //   if (!Bot.instance) {
  //     Bot.instance = new Bot()
  //   }
  //   return Bot.instance;
  // }

  public async init(): Promise<void> {
    await this.registerCommands();
    await this.registerEvents();
  }

  private async registerCommands() {
    const commandRegistration: Object[] = []
    const commandFiles: string[] = await globPromise(`${__dirname}/../Commands/**/*.*`)
    await Promise.all(
      commandFiles.map(async (filePath: string) => {
        const command = <Command>(await import(filePath)).default
        if (command?.name) {
          if (this.commands.has(command.name)) return;
          this.commands.set(command.name, command)
          const json = command.data.toJSON()
          commandRegistration.push(json)
        }
      })
    )

    try {
      console.log("Started refreshing application (/) commands.")
      this.guilds?.cache.forEach(async (guild) => {
        if (this.application) {
          <APIApplicationCommand[]>await this.restApi.put(Routes.applicationGuildCommands(this.application.id, guild.id), { body: commandRegistration })
        }
      })

      console.log("Successfully reloaded application (/) commands.")
    } catch (error) {
      console.error(error)
    }
  }

  private async registerEvents() {
    const eventfiles: string[] = await globPromise(`${__dirname}/../Events/**/*.*`)
    await Promise.all(
      eventfiles.map(async (filePath: string) => {
        const { event }: { event: Event } = await import(filePath)

        if (this.events.has(event.name)) return;
        this.events.set(event.name, event)
        this.on(event.name, async (...args) => {
          const eventFunction = this.events.get(event.name);
          await eventFunction?.run(...args, this)
        })
        // Old method of binding client to run function
        // this.on(event.name, event.run.bind(null, this))
      })
    )
  }

  setActiveCommand(interaction: CommandInteraction) {
    if (this.activeCommands.has(interaction.user.id)) throw new Error("Relax bud, you already had me running a command and now I'm just confused. Lets start this over again.")
    this.activeCommands.set(interaction.user.id, interaction.commandName)
  }

  unsetActiveCommand(interaction: CommandInteraction) {
    this.activeCommands.delete(interaction.user.id)
  }
}
