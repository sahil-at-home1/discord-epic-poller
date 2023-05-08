import { REST, Routes } from 'discord.js'
import { Ping } from './commands/ping.js'
import { Poll } from './commands/poll.js'

require('dotenv').config();

const commands = [
    Ping.data.toJSON(),
    Poll.data.toJSON(),
]

const rest = new REST().setToken(process.env.DISCORD_TOKEN as string)

const registerCommands = async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands`)
        const data: any = await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID as string,
                process.env.GUILD_ID as string
            ),
            { body: commands }
        )
        console.log(`succesfully reloaded ${data.length} application (/) commands`)
    } catch (error) {
        console.error(error)
    }
}

registerCommands()