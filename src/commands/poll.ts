import { ActionRowBuilder, bold, Embed, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection } from "discord.js"

class PollItem {
    title: string
    value: string
    votes: number
    voters: string[]

    constructor(title: string, value: string, votes: number, voters: string[]) {
        this.title = title
        this.value = value
        this.votes = votes
        this.voters = voters
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
            // ephemeral: true
        })
        // await interaction.reply(`your title was ${title}`)
        const title: string = bold(interaction.options.get('title')?.value as string ?? 'Untitled Poll')
        // const title_row = new ActionRowBuilder<Text>

        let pollItems: PollItem[] = [
            { title: 'Option 1', value: '1', votes: 0, voters: [] },
            { title: 'Option 2', value: '2', votes: 0, voters: [] },
            { title: 'Option 3', value: '3', votes: 0, voters: [] },
        ]

        // creating the poll selections
        const poll = new StringSelectMenuBuilder()
            .setCustomId('poll')
            .setPlaceholder('Choose from the following...')
        pollItems.forEach((pi: PollItem) => {
            poll.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(pi.title)
                    .setValue(pi.value)
            )
        })
        const select_row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(poll)


        // create the embed to show the results
        const results = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Poll: ${title}`)
            .setTimestamp()
        pollItems.forEach((pi: any) => {
            results.addFields({
                name: pi.title,
                value: `${pi.votes} Vote(s) ${pi.voters.toString()}`
            })
        })

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
            const selection: number = Number(i.values[0])
            // create new results embed
            pollItems[selection].votes += 1
            pollItems[selection].voters.push(i.user.toString())
            const newResults = EmbedBuilder.from(response.embeds[0])
            newResults.setFields([])
            pollItems.forEach((pi: PollItem) => {
                newResults.addFields({
                    name: pi.title,
                    value: `${pi.votes} Vote(s) ${pi.voters.toString()}`
                })
            })
            await interaction.editReply({ embeds: [newResults] })
        })
    }
}