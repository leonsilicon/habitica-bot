import path from 'node:path'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import { ChannelType, Client, EmbedBuilder } from 'discord.js'
import dotenv from 'dotenv'
import { fastify } from 'fastify'
import { getProjectDir } from 'lion-utils'
import invariant from 'tiny-invariant'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.tz.setDefault('America/Toronto')

const monorepoDir = getProjectDir(import.meta.url, { monorepoRoot: true })

console.log(monorepoDir)
dotenv.config({ path: path.join(monorepoDir, '.env') })

const client = new Client({ intents: [] })
client.on('ready', () => {
	invariant(client.user !== null)
	console.log(`Logged in as ${client.user.tag}`)
})

const app = fastify()

interface HabiticaRequest {
	type: string
	direction: string
	delta: number
	task: {
		repeat: {
			m: boolean
			t: boolean
			w: boolean
			th: boolean
			f: boolean
			s: boolean
			su: boolean
		}
		challenge: Record<string, unknown>
		group: {
			completedBy: Record<string, unknown>
			assignedUsers: unknown[]
		}
		frequency: string
		everyX: number
		streak: number
		nextDue: string[]
		yesterDaily: true
		history: Array<Record<string, unknown>>
		completed: boolean
		collapseChecklist: boolean
		type: string
		notes: string
		tags: unknown[]
		value: number
		priority: number
		attribute: string
		byHabitica: boolean
		startDate: string
		daysOfMonth: unknown[]
		weeksOfMonth: unknown[]
		checklist: unknown[]
		reminders: unknown[]
		createdAt: string
		updatedAt: string
		_id: string
		text: string
		userId: string
		isDue: boolean
		id: string
	}
	user: Record<string, unknown>
	webhookType: string
}

app.post('/webhook', async (request, reply) => {
	console.log('Webhook called with:', request.body)
	const data = request.body as HabiticaRequest
	const { task } = data

	let title: string
	let description: string
	if (data.direction === 'up') {
		title = 'Task Completed'
		description = 'A task has been checked off!'
	} else {
		title = 'Task Undone'
		description = 'A task has been unchecked!'
	}

	const embed = new EmbedBuilder()
		.setColor('Orange')
		.setTitle(title)
		.setDescription(description)
		.addFields(
			{
				name: 'Name',
				value: task.text,
			},
			{
				name: 'Notes',
				value: task.notes,
			},
			{
				name: 'Date',
				value: dayjs().tz().format('LLL'),
			}
		)

	const notificationsChannel = await client.channels.fetch(
		'1061299980792496202'
	)
	invariant(notificationsChannel?.type === ChannelType.GuildText)

	await notificationsChannel.send({ embeds: [embed] })

	if (task.notes.includes('Needs Proof:')) {
		const proofDescription = /\*\*Needs Proof:\*\* (.*)/.exec(task.notes)?.[1]
		invariant(proofDescription !== undefined, 'missing proof item')
		const proofChannel = await client.channels.fetch('1061343393881530448')
		invariant(proofChannel?.type === ChannelType.GuildText)
		await proofChannel.send(
			`<@1022267596382408755>, please send a proof for your task _${task.text}_ (${proofDescription})`
		)
	}

	console.debug('Webhook finished!')
	void reply.status(200)
})

app.listen({ port: 3000 }, (err, address) => {
	console.info(`Server listening on ${address}`)
})

invariant(process.env.DISCORD_TOKEN !== undefined)
await client.login(process.env.DISCORD_TOKEN)
