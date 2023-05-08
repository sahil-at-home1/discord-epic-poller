import { User, APIEmbedField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js'
import { Poll } from './commands/poll'

export class PollItem {
    readonly title: string
    readonly value: string
    votes: number
    voters: string[]

    constructor(title: string, value: string) {
        this.title = title
        this.value = value
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

    add(name: string): void {
        const item = new PollItem(name, String(this.length))
        if (this.items.get(item.value) != null) {
            console.log(`${item} already in poll items`)
            return
        }
        this.items.set(item.value, item)
        this.length += 1
    }

    delete(value: string): void {
        if (this.items.get(value) == null) {
            console.log(`${value} not in poll items`)
            return
        }
        this.items.delete(value)
        this.length -= 1
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
                .setValue(i.value)
            )
        })
        return options
    }

    toString(): string {
        return Array.from(this.items.keys()).join('\r\n')
    }
}