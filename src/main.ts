import Bot from "./Bot/"
import { token } from "./config";

(async () => {
  try {
    console.log(`Inititializing bot...`)
    const botInstance = new Bot(token);
    const loggedIn = await botInstance.login(token);
    console.log(`logged in: ${ loggedIn }`)
    await botInstance.init();
  }
  catch (err) {
    if (err instanceof Error) {
      console.log(err?.message)
    }
  }
})();
