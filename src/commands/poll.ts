import { ActionRowBuilder, Message, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField, Interaction, ButtonBuilder, ButtonStyle } from "discord.js"
import { create } from "domain"

class PollItem {
    readonly title: string
    readonly value: string
    votes: number
    voters: string[]

    constructor(title: string, value: string) {
        this.title = title
        this.value = value
        this.votes = 0
        this.voters = []
    }

}

class PollItemList {
    title: string = ''
    items: Map<string, PollItem> = new Map()
    voters: Map<string, string> = new Map()

    constructor(title: string) {
        this.title = title
    }

    vote(itemValue: string, voter: User): void {
        // check if item is valid
        const item: PollItem | undefined = this.items.get(itemValue)
        if (item == undefined) {
            console.error(`${itemValue} not a valid pollItem value`)
            return
        }
        // check if voter already voted and remove their previous vote
        const voterStr: string = voter.toString()
        const prevItemValue: string | undefined = this.voters.get(voterStr)
        if (prevItemValue != undefined) {
            const prevItem: PollItem | undefined = this.items.get(prevItemValue)
            if (prevItem == undefined) {
                console.error(`previous item ${prevItem} was not valid`)
                return
            }
            prevItem.voters = item.voters.filter(v => v !== voterStr)
            prevItem.votes -= 1
        }
        // update state of poll item
        this.voters.set(voterStr, itemValue)
        item.votes += 1
        item.voters.push(voterStr)
    }

    add(item: PollItem): void {
        if (this.items.get(item.value) != null) {
            console.log(`${item} already in poll items`)
            return
        }
        this.items.set(item.value, item)
    }

    toEmbedFields(): APIEmbedField[] {
        let fields: APIEmbedField[] = []
        this.items.forEach((i: any) => {
            let voteMsg = 'Votes'
            if (i.votes == 1) {
                voteMsg = 'Vote'
            }
            fields.push({
                name: i.title,
                value: `${i.votes} ${voteMsg} ${i.voters.toString()}`
            })
        })
        return fields
    }

    toStringSelectMenuOptions(): StringSelectMenuOptionBuilder[] {
        let options: StringSelectMenuOptionBuilder[] = []
        this.items.forEach((i: PollItem) => {
            options.push(new StringSelectMenuOptionBuilder()
                .setLabel(i.title)
                .setValue(i.value)
            )
        })
        return options
    }
}

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