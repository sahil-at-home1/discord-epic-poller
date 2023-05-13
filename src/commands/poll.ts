import { ActionRowBuilder, Message, bold, italic, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, } from "discord.js"
import { PollItemList } from '../pollItemList.js'

const MINUTE_MS: number = 60 * 1000
const HOUR_MS: number = 60 * MINUTE_MS
const DAY_MS: number = 24 * HOUR_MS
const POLL_TIMEOUT: number = 1 * DAY_MS

const sendPollMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<InteractionResponse> => {
    // creating the poll selections
    const poll = new StringSelectMenuBuilder()
        .setCustomId('poll')
        .setPlaceholder('Choose from the following...')
        .setOptions(pollItems.toStringSelectMenuOptions())

    // create the embed to show the results
    const pollCreator: string = interaction.user.username
    const results = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${pollCreator}'s Poll: ${pollItems.title}`)
        .addFields(pollItems.toEmbedFields())

    // send the actual poll message
    return interaction.reply({
        embeds: [results],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(poll)
        ]
    })
}

const sendPollUpdateMessage = async (pollResponse: Message, pollItems: PollItemList) => {
    const voteCollectorFilter = (i: StringSelectMenuInteraction) => {
        i.deferUpdate()
        return true
    }
    const voteCollector = pollResponse.createMessageComponentCollector({
        filter: voteCollectorFilter,
        componentType: ComponentType.StringSelect,
    })
    // update the poll based on votes
    voteCollector.on('collect', async (i) => {
        const itemValue: string = i.values[0]
        // change state
        await pollItems.vote(itemValue, i.user)
        // create new results embed
        const newResults = EmbedBuilder.from(pollResponse.embeds[0])
        newResults.setFields(pollItems.toEmbedFields())
        await pollResponse.edit({ embeds: [newResults] })
    })
}

const CreatePollSlashCommand = (): SlashCommandBuilder => {
    const DISCORD_SLASH_MAX_OPTIONS: number = 25
    const builder: SlashCommandBuilder = new SlashCommandBuilder()
    builder
        .setName('poll')
        .setDescription('Sets up a new poll')
        .addStringOption(option => (
            option.setName('title')
                .setDescription('the title of the poll')
                .setRequired(true)
                .setMaxLength(100)
        ))
        .addStringOption(option => (
            option.setName(`poll_item_1`)
                .setDescription(`poll item number 1`)
                .setMaxLength(50)
                .setRequired(true)
        ))
    // add optional poll items after the first one
    // subtract title from max options
    // start at second poll item
    for (let i = 1; i < DISCORD_SLASH_MAX_OPTIONS - 1; i++) {
        builder.addStringOption(option => (
            option.setName(`poll_item_${i + 1}`)
                .setDescription(`poll item number ${i + 1}`)
                .setMaxLength(50)
                .setRequired(false)
        ))
    }
    return builder
}

export const Poll = {
    cooldown: 5,
    data: CreatePollSlashCommand(),
    execute: async (interaction: CommandInteraction) => {
        // create poll
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        const pollItems: PollItemList = new PollItemList(title)
        // send out actual poll
        const pollResponse: InteractionResponse = await sendPollMessage(interaction, pollItems)
        const pollMessage: Message = await pollResponse.fetch()
        // handle the interactions to the poll
        await sendPollUpdateMessage(pollMessage, pollItems)
        setTimeout(() => {
            pollResponse.edit({
                content: italic(`${POLL_TIMEOUT / 1000} seconds have passed. Voting is closed.`),
                components: [],
            })
        }, POLL_TIMEOUT)

    }
}