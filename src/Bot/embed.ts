import { ColorResolvable, MessageEmbed } from "discord.js"

export interface BaseEmbedSettings {
  author: boolean | {
    name?: string;
    iconURL?: string;
    url?: string;
  }
  color?: ColorResolvable;
  thumb?: string | false;
  footer?: {
    text?: string;
    iconURL?: string;
  } | boolean
}

const defaultAuthor = {
  name: "Abe",
  iconURL: "https://firebasestorage.googleapis.com/v0/b/gaintrust.appspot.com/o/assets%2Fgaintrust_icon_single.jpg?alt=media&token=35949aa6-bb1c-405e-b959-e3cb5ee047e4",
  url: "http://gaintrust.us",
}

const defaultFooter = {
  text: "",
  iconURL: "",
}

const defaultSettings: BaseEmbedSettings = {
  author: false,
  color: "LUMINOUS_VIVID_PINK",
  thumb:
    "https://firebasestorage.googleapis.com/v0/b/gaintrust.appspot.com/o/assets%2Fgaintrust_thumbnail.jpg?alt=media&token=81eac1ef-2359-432b-8789-a27b64f8c1b8",
  footer: false,
}

export function baseEmbedMessage(overrideSettings: BaseEmbedSettings = defaultSettings): MessageEmbed {
  const embed = new MessageEmbed()

  let { author, footer } = overrideSettings
  const { color, thumb } = { ...defaultSettings, ...overrideSettings }

  if (typeof author === 'object') {
    author = { ...defaultAuthor, ...author }
    embed.setAuthor(author.name!, author.iconURL, author.url)
  }

  if (typeof footer === "object") {
    footer = { ...defaultFooter, ...footer }
    embed.setFooter(footer.text!, footer.iconURL)
  }

  embed.setColor(color!)

  if (thumb) {
    embed.setThumbnail(thumb)
  }

  return embed
}
