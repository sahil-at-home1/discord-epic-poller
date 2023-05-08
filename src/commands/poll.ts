import { ActionRowBuilder, bold, User, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection, APIEmbedField } from "discord.js"

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
    items: Map<string, PollItem> = new Map()
    voters: Map<string, any> = new Map()

    vote(itemValue: string, voter: User): void {
        if (this.voters.get(voter.toString()) != undefined) {
            console.log(`${voter} has already voted`)
            return
        }
        this.voters.set(voter.toString(), {})
        const item: PollItem | undefined = this.items.get(itemValue)
        if (item == undefined) {
            console.error(`${itemValue} not a valid pollItem value`)
            return
        }
        item.votes += 1
        item.voters.push(voter.toString())
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
        // immediate reply
        await interaction.deferReply({
            // ephemeral: true,
        })

        const pollItems: PollItemList = new PollItemList()
        pollItems.add(new PollItem('Option 1', '0'))
        pollItems.add(new PollItem('Option 2', '1'))
        pollItems.add(new PollItem('Option 3', '2'))

        // creating the poll selections
        const poll = new StringSelectMenuBuilder()
            .setCustomId('poll')
            .setPlaceholder('Choose from the following...')
            .setOptions(pollItems.toStringSelectMenuOptions())
        const select_row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(poll)

        // create the embed to show the results
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        const results = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Poll: ${title}`)
            .setTimestamp()
            .addFields(pollItems.toEmbedFields())

        // send the message
        const response = await interaction.followUp({
            content: `${title}`,
            embeds: [results],
            components: [select_row]
        })

        // handle the response 
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        })

        // send update
        collector.on('collect', async i => {
            const selection: string = i.values[0]
            console.log(selection)
            console.log(pollItems)
            // create new results embed
            pollItems.vote(selection, i.user)
            const newResults = EmbedBuilder.from(response.embeds[0])
            newResults.setFields(pollItems.toEmbedFields())
            await interaction.editReply({ embeds: [newResults] })
        })
    }
}