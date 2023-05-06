const { SlashCommandBuilder } = require('discord.js')

const UserCommand = new SlashCommandBuilder()
    .setName('user')
    .setDescription('Provides information about the user.')

const UserCommandExecutor = async (interaction: any) => {
    await interaction.reply(`This command was run by ${interaction.user.username}`)
}

export { UserCommand, UserCommandExecutor }