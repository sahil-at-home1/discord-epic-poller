const { SlashCommandBuilder } = require("discord.js");


const PingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')

const PingCommandExecutor = async (interaction: any) => {
    await interaction.reply('Pong!')
}

export { PingCommand, PingCommandExecutor }