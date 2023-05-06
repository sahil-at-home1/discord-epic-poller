import { Client, Interaction, ClientOptions, Collection, Events, GatewayIntentBits } from 'discord.js';
import { Ping } from './commands/ping.js'

// extending to add commands collection
class MyClient extends Client {
    commands: Collection<string, any>

    constructor(options: ClientOptions) {
        super(options)
        this.commands = new Collection()
    }
}

require('dotenv').config();

// create a new client instance
const client: MyClient = new MyClient({ intents: [GatewayIntentBits.Guilds] });

// get the commands and add to collection
client.commands.set(Ping.data.name, Ping)

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
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
        console.error(error)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true
            })
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            })
        }
    }
})

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c: any) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);