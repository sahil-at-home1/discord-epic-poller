import { Client, ClientOptions, Collection } from 'discord.js'

// extending to add commands collection
class MyClient extends Client {
    commands: Collection<string, any>
    cooldowns: Collection<string, number>

    constructor(options: ClientOptions) {
        super(options)
        this.commands = new Collection()
        this.cooldowns = new Collection()
    }
}

export default MyClient