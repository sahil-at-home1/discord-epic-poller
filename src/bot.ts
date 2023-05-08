import { Collection, GatewayIntentBits } from 'discord.js'
import MyClient from './myClient.js'
import { onReady } from './events/ready.js'
import { onInteractionCreate } from './events/interactionCreate.js'
import { Poll } from './commands/poll.js'

require('dotenv').config();

// create a new client instance
const client: MyClient = new MyClient({ intents: [GatewayIntentBits.Guilds] });

// get the commands and add to collection
client.commands.set(Poll.data.name, Poll)

// get the event handlers and add to client
client.once(
    onReady.name,
    async () => await onReady.execute(client)
)
client.on(
    onInteractionCreate.name,
    async (interaction) => await onInteractionCreate.execute(interaction)
)

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);