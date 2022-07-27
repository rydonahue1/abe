import Bot from "./Bot/"
import { token } from "./config";

(async () => {
  try {
    console.log(`Inititializing bot...`)
    const bot = new Bot(token);
    const loggedIn = await bot.login(token);
    console.log(`logged in: ${ loggedIn }`)

    // const youtube = new Youtube()
    // await youtube.getYoutubeVideos()

    bot.on('ready', async (client) => {
      console.log('Updating guilds!')
      await bot.upsertGuilds()
      console.log('Bot ready!')
    })
    await bot.init();

  }
  catch (err) {
    if (err instanceof Error) {
      console.log(err?.message)
    }
  }
})();
