import { ColorResolvable, Colors, EmbedAuthorOptions, EmbedBuilder } from "discord.js"

export class BaseEmbed extends EmbedBuilder {
  private defaultThumb: string = "https://firebasestorage.googleapis.com/v0/b/gaintrust.appspot.com/o/assets%2FGainTrust_small.png?alt=media&token=be476ba3-d137-4352-a9a6-a0e43a8f601b"
  private defaultAuthor: EmbedAuthorOptions = {
    "name": "Abe",
    "iconURL": "https://firebasestorage.googleapis.com/v0/b/gaintrust.appspot.com/o/assets%2Fabe_icon.png?alt=media&token=c10a6834-3d7f-428d-848f-ab6485e6e236",
    "url": "http://gaintrust.us"
  }
  private defaultColor: ColorResolvable = [25, 25, 25]

  public constructor() {
    super()
    this.setDefaults()
  }

  public setDefaultColor() {
    this.setColor(this.defaultColor)
    return this
  }

  public setDefaults() {
    this.setDefaultThumbnail()
    // this.setDefaultAuthor()
    this.setDefaultColor()
    return this
  }

  public setDefaultThumbnail() {
    this.setThumbnail(this.defaultThumb)
    return this
  }

  public setDefaultAuthor() {
    this.setAuthor(this.defaultAuthor)
    return this
  }
}