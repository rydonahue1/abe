import { VideoRecord } from "@types"
import { BaseEmbed } from "../../../Bot/embed"
import { ChatInputCommandInteraction, SelectMenuBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js"
import { collections } from "../../../Firebase/collections"
import { ButtonStyle, ComponentType } from "discord-api-types/v10"

export async function searchVideos(interaction: ChatInputCommandInteraction) {
  const term = interaction.options.getString('primary-muscle', true)
  const videos = await collections.videos.where("primaryMuscles", "array-contains", term).get()

  const unflatEquip = videos.docs.map((video) => {
    const data = video.data()
    return data.equipment
  })

  const selectOptions = unflatEquip.flat().filter((v, i, a) => a.indexOf(v) === i && v !== '').map((equip) => {
    return {
      label: equip,
      value: equip
    }
  })

  const message = new BaseEmbed().setTitle('What equipment do you have?').setThumbnail(null)

  const select = new SelectMenuBuilder({
    custom_id: 'equipment-select',
    placeholder: "Select all equipment you have available.",
    min_values: 1,
    max_values: selectOptions.length,
    options: selectOptions
  })
  const actionRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select)

  await interaction.reply({ embeds: [message], components: [actionRow]})

  const selected = await interaction.channel?.awaitMessageComponent({
    filter: (i) => {
      i.deferUpdate()
      return i.user.id === interaction.user.id
    },
    time: 60_000,
    componentType: ComponentType.SelectMenu
  })

  const filteredVideos = videos.docs.filter((video) => {
  const videoData = video.data()
  const containsAll: Boolean[] = []
    videoData.equipment.forEach((equip) => {
      containsAll.push(selected!.values.includes(equip))
    })
    if (!containsAll.includes(false)) {
      return video
    }
  })

  message
    .setTitle('Here are your workouts...')
    .setDescription('Based on what muscles you want to work and what equipment you have available. Here are some lifts to checkout.')
    .setDefaultThumbnail()

  const embeds = filteredVideos.map((video) => {
    const videoData = <VideoRecord>video.data()
    const embed = new BaseEmbed()
    return embed.setTitle(`${videoData.title}${ videoData.modification ? `- ${videoData.modification}` : `` }`)
      // .setFields({ name: "Modifications", value: videoData.modification ? videoData.modification : '' , inline: true })
      .setFields(
        // { name: "Muscle Groups", value: videoData.muscleGroups.join(', ') },
        { name: "Primary Muscles", value: videoData.primaryMuscles.join(', '), inline: true },
        { name: "Secondary Muscles", value: videoData.secondaryMuscles.join(', '), inline: true },
        { name: "Equipment Used", value: videoData.equipment.join(', '), inline: false }
      )
      .setDescription(videoData.videoUrl)
      .setURL(videoData.videoUrl)
      .setThumbnail(videoData.thumbnails.medium.url)
  })
  const button = new ButtonBuilder().setCustomId('get-more-videos').setLabel('Next Video').setStyle(ButtonStyle.Primary)
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().setComponents(button)

  sendNextVideo(embeds, interaction, buttonRow)
}

async function sendNextVideo(embeds: BaseEmbed[], interaction: ChatInputCommandInteraction, buttonRow: ActionRowBuilder<ButtonBuilder>) {
  const { channel } = interaction

  const sent = await channel?.send({ embeds: [...embeds.splice(0, 1)], components: embeds.length >= 1 ? [buttonRow] : []})

  if (embeds.length < 1) {
    await channel?.send({ embeds: [new BaseEmbed().setDescription('End of Results').setThumbnail(null)] })
    return
  }

  const click = await channel?.awaitMessageComponent({
    filter: (i) => {
      i.deferUpdate()
      return i.user.id === interaction.user.id
    },
    componentType: ComponentType.Button,
    time: 120_000
  })

  await sent?.delete()
  await channel?.send({ embeds: sent?.embeds, components: [] })
  if (click) {
    await sendNextVideo(embeds, interaction, buttonRow)
  }
}