import { ModalBuilder, ActionRowBuilder, Message, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField, Interaction, ButtonBuilder, ButtonStyle, ButtonInteraction, TextInputStyle, ModalSubmitInteraction } from "discord.js"
import { PollItemList } from '../pollItemList.js'
import { create } from "domain"

const MODAL_TIMEOUT: number = 5 * 60 * 1000 // 5 minutes in ms

const sendPollCreationMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<InteractionResponse> => {
    const setTitle = new ButtonBuilder()
        .setCustomId('setTitle')
        .setLabel('Set Poll Title')
        .setStyle(ButtonStyle.Primary)
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
    const titleRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(setTitle)
    const itemModifyRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(addItem, removeItem)
    const pollModifyRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(createPoll, cancelPoll)
    return interaction.reply({
        ephemeral: true,
        content: `Create a new poll`,
        components: [titleRow, itemModifyRow, pollModifyRow]
    })
}


const sendPollMessage = async (interaction: CommandInteraction, pollItems: PollItemList): Promise<Message> => {
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
                .setValue('')
                .setRequired(true)
            )
        )
    await interaction.showModal(modal)
    const filter = (m: ModalSubmitInteraction) =>
        m.user.id === interaction.user.id && m.customId === 'itemNameModal'
    const modalResponse = await interaction.awaitModalSubmit({
        filter: filter,
        time: MODAL_TIMEOUT
    })
    const itemName = modalResponse.fields.getTextInputValue('itemNameInput')
    await modalResponse.deferUpdate()
    const added: boolean = pollItems.add(itemName)
    if (added === true) {
        await modalResponse.editReply({
            content: `${pollItems.title}\r\n${pollItems.toString()}`,
        })
    } else {
        await modalResponse.followUp({
            content: `Poll item already in list`,
            ephemeral: true,
        })
    }
}

const handleRemoveItem = async (interaction: ButtonInteraction, pollItems: PollItemList) => {
    const modal = new ModalBuilder()
        .setCustomId("removeItemNameModal")
        .setTitle('Remove Poll Item')
        .addComponents(new ActionRowBuilder<TextInputBuilder>()
            .addComponents(new TextInputBuilder()
                .setCustomId('removeItemNameInput')
                .setLabel('What item should be removed?')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setValue('')
                .setRequired(true)
            )
        )
    await interaction.showModal(modal)
    const filter = (m: ModalSubmitInteraction) =>
        m.user.id === interaction.user.id && m.customId === 'removeItemNameModal'
    const modalResponse = await interaction.awaitModalSubmit({
        filter: filter,
        time: MODAL_TIMEOUT
    })
    const itemName = modalResponse.fields.getTextInputValue('removeItemNameInput')
    await modalResponse.deferUpdate()
    const deleted: boolean = pollItems.delete(itemName)
    if (deleted === true) {
        await modalResponse.editReply({
            content: `${pollItems.title}\r\n${pollItems.toString()}`,
        })
    } else {
        await modalResponse.followUp({
            content: `Poll item not in list`,
            ephemeral: true
        })
    }
}

const handleSetTitle = async (interaction: ButtonInteraction, pollItems: PollItemList) => {
    const modal = new ModalBuilder()
        .setCustomId('setTitleModal')
        .setTitle('Set Poll Title')
        .addComponents(new ActionRowBuilder<TextInputBuilder>()
            .addComponents(new TextInputBuilder()
                .setCustomId('titleInput')
                .setLabel('What should the poll be called?')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100)
                .setValue('')
                .setRequired(true)
            )
        )
    await interaction.showModal(modal)
    const filter = (m: ModalSubmitInteraction) =>
        m.user.id === interaction.user.id && m.customId === 'setTitleModal'
    const modalResponse = await interaction.awaitModalSubmit({
        filter: filter,
        time: MODAL_TIMEOUT
    })
    const pollTitle = modalResponse.fields.getTextInputValue('titleInput')
    pollItems.title = pollTitle
    await modalResponse.deferUpdate()
    await modalResponse.editReply({
        content: `${pollItems.title}\r\n${pollItems.toString()}`,
    })
}

export const Poll = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Sets up a new poll'),
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
            if (i.customId === 'setTitle') {
                handleSetTitle(i, pollItems)
            } else if (i.customId === 'add') {
                handleAddItem(i, pollItems)
            } else if (i.customId === 'remove') {
                handleRemoveItem(i, pollItems)
            } else if (i.customId === 'cancel') {
                createResponse.delete()
            } else if (i.customId === 'create') {
                createResponse.delete()
                if (pollItems.length === 0) {
                    await interaction.followUp({
                        content: `No poll options were set`,
                        ephemeral: true
                    })
                    return
                }
                // send out actual poll
                const pollResponse = await sendPollMessage(interaction, pollItems)
                // handle the interactions to the poll
                const pollUpdateResponse = await sendPollUpdateMessage(pollResponse, pollItems)
            } else {
                console.error('invalid button id')
                return
            }
        })

    }
}