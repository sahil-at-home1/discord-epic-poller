import { User, APIEmbedField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js'
import { Poll } from './commands/poll'

export class PollItem {
    readonly title: string
    votes: number
    voters: string[]

    constructor(title: string, value: string) {
        this.title = title
        this.votes = 0
        this.voters = []
    }

}

export class PollItemList {
    title: string = ''
    items: Map<string, PollItem> = new Map()
    voters: Map<string, string> = new Map()
    length: number = 0

    constructor(title: string) {
        this.title = title
    }

    vote(itemValue: string, voter: User): void {
        // check if item is valid
        const item: PollItem | undefined = this.items.get(itemValue)
        if (item == undefined) {
            console.error(`${itemValue} not a valid pollItem value`)
            return
        }
        // check if voter already voted and remove their previous vote
        const voterStr: string = voter.toString()
        const prevItemValue: string | undefined = this.voters.get(voterStr)
        if (prevItemValue != undefined) {
            const prevItem: PollItem | undefined = this.items.get(prevItemValue)
            if (prevItem == undefined) {
                console.error(`previous item ${prevItem} was not valid`)
                return
            }
            prevItem.voters = item.voters.filter(v => v !== voterStr)
            prevItem.votes -= 1
        }
        // update state of poll item
        this.voters.set(voterStr, itemValue)
        item.votes += 1
        item.voters.push(voterStr)
    }

    add(title: string): boolean {
        if (this.items.get(title) != null) {
            console.log(`${title} already in poll items`)
            return false
        }
        const item = new PollItem(title, String(this.length))
        this.items.set(item.title, item)
        this.length += 1
        return true
    }

    delete(title: string): boolean {
        if (this.items.get(title) == null) {
            console.log(`${title} not in poll items`)
            return false
        }
        this.items.delete(title)
        this.length -= 1
        return true
    }

    toEmbedFields(): APIEmbedField[] {
        let fields: APIEmbedField[] = []
        this.items.forEach((i: any) => {
            let voteMsg = 'Votes'
            if (i.votes == 1) {
                voteMsg = 'Vote'
            }
            fields.push({
                name: i.title,
                value: `${i.votes} ${voteMsg} ${i.voters.toString()}`
            })
        })
        return fields
    }

    toStringSelectMenuOptions(): StringSelectMenuOptionBuilder[] {
        let options: StringSelectMenuOptionBuilder[] = []
        this.items.forEach((i: PollItem) => {
            options.push(new StringSelectMenuOptionBuilder()
                .setLabel(i.title)
                .setValue(i.title)
            )
        })
        return options
    }

    toString(): string {
        return Array.from(this.items.values())
            .map((item) => `- ${item.title}`)
            .join('\r\n')
    }
}