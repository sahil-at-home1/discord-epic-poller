import { ActionRowBuilder, bold, BaseSelectMenuBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, InteractionResponse, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, EmbedBuilder, Collection } from "discord.js"

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

        const options: any[] = [
            { title: 'Option 1', value: 'options1' },
            { title: 'Option 2', value: 'options2' },
            { title: 'Option 3', value: 'options3' },
        ]

        // creating the poll selections
        const poll = new StringSelectMenuBuilder()
            .setCustomId('poll')
            .setPlaceholder('Choose from the following...')
        options.forEach((o: any) => {
            poll.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(o.title)
                    .setValue(o.value)
            )
        })
        const select_row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(poll)


        // create the embed to show the results
        const results = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Poll: ${title}`)
            .setTimestamp()
        options.forEach((o: any) => {
            results.addFields({ name: o.title, value: o.value })
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
        // create new results embed
        const newEmbed = EmbedBuilder.from(response.embeds[0])
        newEmbed.setFields()
        // send update
        collector.on('collect', async i => {
            const selection = i.values[0]
            await interaction.editReply(`${i.user} has selected ${selection}`)
            // await interaction.editReply(`${i.user} has selected ${selection}`)
        })


    }
}