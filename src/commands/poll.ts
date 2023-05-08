import { ActionRowBuilder, Message, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField, Interaction, ButtonBuilder, ButtonStyle } from "discord.js"
import { PollItemList, PollItem } from '../pollItemList.js'

const sendPollCreationMessage = async (interaction: CommandInteraction): Promise<InteractionResponse> => {
    const addItem = new ButtonBuilder()
        .setCustomId('add')
        .setLabel('Add Poll Item')
        .setStyle(ButtonStyle.Primary)
    const removeItem = new ButtonBuilder()
        .setCustomId('remove')
        .setLabel('Remove Poll Item')
        .setStyle(ButtonStyle.Danger)
    const createPoll = new ButtonBuilder()
        .setCustomId('create')
        .setLabel('Create Poll')
        .setStyle(ButtonStyle.Success)
    const cancelPoll = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    const itemModifyRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(removeItem, addItem)
    const pollModifyRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(cancelPoll, createPoll)
    return interaction.reply({
        ephemeral: true,
        content: `Create a new poll`,
        components: [itemModifyRow, pollModifyRow]
    })
}


const sendPollMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<Message> => {
    // creating the poll selections
    const poll = new StringSelectMenuBuilder()
        .setCustomId('poll')
        .setPlaceholder('Choose from the following...')
        .setOptions(pollItems.toStringSelectMenuOptions())

    // create the embed to show the results
    const results = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Poll: ${pollItems.title}`)
        .setTimestamp()
        .addFields(pollItems.toEmbedFields())

    // send the actual poll message
    return interaction.followUp({
        content: `${pollItems.title}`,
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
        pollItems.vote(itemValue, i.user)
        // create new results embed
        const newResults = EmbedBuilder.from(pollResponse.embeds[0])
        newResults.setFields(pollItems.toEmbedFields())
        await pollResponse.edit({ embeds: [newResults] })
    })
}

export const Poll = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Sets up a new poll')
        .addStringOption((option) =>
            option.setName('title')
                .setDescription('Title of the poll')
                .setRequired(true)
                .setMaxLength(100)
        ),
    execute: async (interaction: CommandInteraction) => {
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        // ask user to create poll
        const createResponse = await sendPollCreationMessage(interaction)
        // TODO: this is a static list, need another message to have the first user
        // create the poll with a configuration message
        const pollItems: PollItemList = new PollItemList(title)
        pollItems.add(new PollItem('Option 1', '0'))
        pollItems.add(new PollItem('Option 2', '1'))
        pollItems.add(new PollItem('Option 3', '2'))
        // send out actual poll
        const pollResponse = await sendPollMessage(interaction, pollItems)
        // handle the interactions to the poll
        const pollUpdateResponse = await sendPollUpdateMessage(pollResponse, pollItems)
    }
}