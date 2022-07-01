import Bot from "./Bot/"
import config from "../config.json"

(async () => {
  try {
    console.log(`Inititializing bot...`)
    const botInstance = new Bot(config.token);
    const loggedIn = await botInstance.login(config.token);
    console.log(`logged in: ${ loggedIn }`)
    await botInstance.init();
  }
  catch (err) {
    if (err instanceof Error) {
      console.log(err?.message)
    }
  }
})();
