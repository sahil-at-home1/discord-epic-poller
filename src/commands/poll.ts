import { CommandInteractionOption, ActionRowBuilder, Message, bold, italic, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Interaction, CommandInteractionOptionResolver, ChatInputCommandInteraction, } from "discord.js"
import { PollItemList } from '../pollItemList.js'

const MINUTE_MS: number = 60 * 1000
const HOUR_MS: number = 60 * MINUTE_MS
const DAY_MS: number = 24 * HOUR_MS
const POLL_TIMEOUT: number = 1 * DAY_MS

const DISCORD_SLASH_MAX_OPTIONS: number = 25
const MAX_POLL_ITEM_OPTIONS: number = DISCORD_SLASH_MAX_OPTIONS - 1

const sendPollMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<Message> => {
    // creating the poll selections
    const poll = new StringSelectMenuBuilder()
        .setCustomId('poll')
        .setPlaceholder('Choose from the following...')
        .setOptions(pollItems.toStringSelectMenuOptions())
    // create the embed to show the results
    const fields = pollItems.toEmbedFields()
    const pollCreator: string = interaction.user.username
    const results = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${pollCreator}'s Poll: ${pollItems.title}`)
        .addFields(fields)
    // send the actual poll message
    return interaction.followUp({
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
            option.setName(`option_1`)
                .setDescription(`poll item number 1`)
                .setMaxLength(50)
                .setRequired(true)
        ))
    // add optional poll items after the first one
    // subtract title from max options
    // start at second poll item
    for (let i = 1; i < MAX_POLL_ITEM_OPTIONS; i++) {
        builder.addStringOption(option => (
            option.setName(`option_${i + 1}`)
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
        await interaction.deferReply()
        // create poll
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        const pollItems: PollItemList = new PollItemList(title)
        for (let i = 0; i < MAX_POLL_ITEM_OPTIONS; i++) {
            const poll_item: string = interaction.options.get(`option_${i + 1}`)?.value as string ?? ''
            if (poll_item === '') {
                continue
            }
            pollItems.add(poll_item)
        }
        // send out actual poll
        const pollResponse: Message = await sendPollMessage(interaction, pollItems)
        // handle the interactions to the poll
        await sendPollUpdateMessage(pollResponse, pollItems)
        setTimeout(() => {
            pollResponse.edit({
                content: italic(`${POLL_TIMEOUT / HOUR_MS} hours have passed.\nVoting is closed.`),
                components: [],
            })
        }, POLL_TIMEOUT)

    }
}