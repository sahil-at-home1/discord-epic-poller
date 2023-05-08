import { ModalBuilder, ActionRowBuilder, Message, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField, Interaction, ButtonBuilder, ButtonStyle, ButtonInteraction, TextInputStyle, ModalSubmitInteraction } from "discord.js"
import { PollItemList } from '../pollItemList.js'

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
            time: 15000
        })
        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === 'add') {
                console.log('add button pressed')
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
                await i.showModal(modal)
                const modalResponse = await i.awaitModalSubmit({
                    filter: m => m.user.id === i.user.id && m.customId === 'itemNameModal',
                    time: 15_000
                })
                console.log('add modal submit')
                const itemName = modalResponse.fields.getTextInputValue('itemNameInput')
                pollItems.add(itemName)
                await modalResponse.reply({
                    content: `added ${itemName} to poll items`,
                    ephemeral: true,
                })
            } else if (i.customId === 'remove') {
            } else if (i.customId === 'cancel') {
            } else if (i.customId === 'create') {
            } else {
                console.error('invalid button id')
            }
        })

        // TODO: this is a static list, need another message to have the first user
        // create the poll with a configuration message
        pollItems.add('Option 1')
        pollItems.add('Option 2')
        pollItems.add('Option 3')
        // send out actual poll
        const pollResponse = await sendPollMessage(interaction, pollItems)
        // handle the interactions to the poll
        const pollUpdateResponse = await sendPollUpdateMessage(pollResponse, pollItems)
    }
}