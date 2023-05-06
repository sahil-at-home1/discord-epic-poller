const { SlashCommandBuilder } = require('discord.js')

const ServerCommand = new SlashCommandBuilder()
    .setName('server')
    .setDescription('Provides information about the server.')

const ServerCommandExecutor = async (interaction: any) => {
    await interaction.reply(`This server is ${interaction.guild.name}`)
}

export { ServerCommand, ServerCommandExecutor }