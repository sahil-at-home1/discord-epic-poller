import { Events, Interaction } from 'discord.js'
import MyClient from '../myClient.js'

export const onInteractionCreate = {
    name: Events.InteractionCreate as string,
    execute: async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) {
            console.log(interaction.id)
            return
        }

        // get the command
        const command = (interaction.client as MyClient).commands.get(interaction.commandName)
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found`)
            return
        }

        // try to execute the command
        try {
            await command.execute(interaction)
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`)
            console.error(error)
        }
    }
}