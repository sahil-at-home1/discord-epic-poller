import { ModalBuilder, ActionRowBuilder, Message, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField, Interaction, ButtonBuilder, ButtonStyle, ButtonInteraction, TextInputStyle, ModalSubmitInteraction } from "discord.js"
import { PollItemList } from '../pollItemList.js'
import { create } from "domain"

const sendPollCreationMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<InteractionResponse> => {
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
        .addComponents(addItem, removeItem)
    const pollModifyRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(createPoll, cancelPoll)
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

const handleAddItem = async (interaction: ButtonInteraction, pollItems: PollItemList) => {
    const modal = new ModalBuilder()
        .setCustomId("itemNameModal")
        .setTitle('Add Poll Item')
        .addComponents(new ActionRowBuilder<TextInputBuilder>()
            .addComponents(new TextInputBuilder()
                .setCustomId('itemNameInput')
                .setLabel('What should the item be called?')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setValue('Default')
                .setRequired(true)
            )
        )
    await interaction.showModal(modal)
    const filter = (m: ModalSubmitInteraction) =>
        m.user.id === interaction.user.id && m.customId === 'itemNameModal'
    const modalResponse = await interaction.awaitModalSubmit({
        filter: filter,
        time: 15_000
    })
    const itemName = modalResponse.fields.getTextInputValue('itemNameInput')
    pollItems.add(itemName)
    await modalResponse.deferUpdate()
    await modalResponse.editReply({
        content: `${pollItems.title}\r\n${pollItems.toString()}`,
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
        const pollItems: PollItemList = new PollItemList(title)
        const createResponse = await sendPollCreationMessage(interaction, pollItems)
        // listen for interactions with the buttons to modify the poll item list
        const collector = createResponse.createMessageComponentCollector({
            componentType: ComponentType.Button,
        })
        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === 'add') {
                handleAddItem(i, pollItems)
            } else if (i.customId === 'remove') {
            } else if (i.customId === 'cancel') {
                createResponse.delete()
            } else if (i.customId === 'create') {
                createResponse.delete()
                // send out actual poll
                const pollResponse = await sendPollMessage(interaction, pollItems)
                // handle the interactions to the poll
                const pollUpdateResponse = await sendPollUpdateMessage(pollResponse, pollItems)
            } else {
                console.error('invalid button id')
            }
        })

    }
}