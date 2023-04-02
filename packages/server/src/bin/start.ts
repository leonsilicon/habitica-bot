import crypto from 'node:crypto'
import path from 'node:path'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import {
	type ColorResolvable,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	ChannelType,
	EmbedBuilder,
	Events,
	REST,
	Routes,
} from 'discord.js'
import dotenv from 'dotenv'
import { fastify } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import capitalize from 'just-capitalize'
import { getProjectDir } from 'lion-utils'
import schedule from 'node-schedule'
import invariant from 'tiny-invariant'
import { z } from 'zod'

import * as slashCommandsExports from '~/commands/_commands.js'
import { type SlashCommand } from '~/types/command.js'
import { type HabiticaRequest } from '~/types/habitica.js'
import { getDiscordClient } from '~/utils/discord.js'
import { getHabiticaEmbedThumbnail } from '~/utils/embed.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'
import { getPuppeteerBrowser } from '~/utils/puppeteer.js'
import { createTasksSummaryMessage, isTaskPublic } from '~/utils/tasks.js'

const slashCommandsMap = Object.fromEntries(
	Object.values(slashCommandsExports).map((slashCommandExport) => {
		if (process.env.NODE_ENV === 'development') {
			slashCommandExport.data.setName!(
				slashCommandExport.data.name! + '-development'
			)
		}

		return [slashCommandExport.data.name, slashCommandExport]
	})
) as Record<string, SlashCommand>

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.tz.setDefault('America/Toronto')

const monorepoDir = getProjectDir(import.meta.url, { monorepoRoot: true })

dotenv.config({ path: path.join(monorepoDir, '.env') })

const applicationId = '1061301445544128624'
const guildId = '1061299980792496199'

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!)

const slashCommandsJson: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
for (const slashCommand of Object.values(slashCommandsMap)) {
	invariant(slashCommand.data.toJSON !== undefined)
	invariant(slashCommand.data.setName !== undefined)
	try {
		const commandName = slashCommand.data.name
		invariant(commandName !== undefined)

		slashCommandsJson.push(slashCommand.data.toJSON())
	} catch (error: unknown) {
		console.error(
			`Error while retrieving command JSON for command \`${slashCommand.data
				.name!}\`:\n`,
			error
		)
		process.exit(1)
	}
}

const data = await rest.put(
	Routes.applicationGuildCommands(applicationId, guildId),
	{ body: slashCommandsJson }
)

console.log(
	`Successfully reloaded ${
		(data as { length: number }).length
	} application (/) commands.`
)

const client = getDiscordClient()

client.once(Events.ClientReady, (client) => {
	console.log(`Logged in as ${client.user.tag}`)
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return
	const command = slashCommandsMap[interaction.commandName]
	if (command === undefined) return

	try {
		await command.execute(interaction)
	} catch (error: unknown) {
		console.error('Interaction failed:', error)
		if (interaction.deferred || interaction.replied) {
			await interaction.editReply({
				content: `An error occurred: ${(error as { message: string }).message}`,
			})
		} else {
			await interaction.reply({
				ephemeral: true,
				content: `An error occurred: ${(error as { message: string }).message}`,
			})
		}
	}
})

client.on(Events.MessageCreate, async (message) => {
	const repliedTo = message.reference?.messageId
	if (repliedTo === undefined) {
		return
	}

	const needsProofMessage = await message.channel.messages.fetch(repliedTo)
	if (!needsProofMessage.content.startsWith(`<@${message.author.id}>`)) {
		return
	}

	const embed = needsProofMessage.embeds[0]
	if (embed === undefined) {
		return
	}

	const newEmbed = EmbedBuilder.from(embed)
	newEmbed.setColor('Green')
	newEmbed.addFields({
		name: 'Proof',
		value: message.url,
	})

	await needsProofMessage.edit({
		content: '',
		embeds: [newEmbed],
	})
})

const app = fastify({
	logger: {
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
			},
		},
	},
})

void app.register(fastifyRawBody, {
	field: 'rawBody',
	encoding: false,
	runFirst: true,
	routes: ['/linear-webhook'],
})

const notificationsChannelId = '1061299980792496202'

const rule = new schedule.RecurrenceRule()
rule.tz = 'America/Toronto'
rule.second = 0
rule.minute = 0
rule.hour = 0

schedule.scheduleJob(rule, async () => {
	const client = getDiscordClient()
	const channel = await client.channels.fetch(notificationsChannelId)

	if (channel?.isTextBased()) {
		// Get all users who have public tasks set to true

		const prisma = await getPrisma()
		const appUsers = await prisma.appUser.findMany({
			select: {
				id: true,
			},
			where: {
				areTasksPublic: true,
			},
		})

		await Promise.all(
			appUsers.map(async (appUser) => {
				await channel.send(
					await createTasksSummaryMessage({
						appUserId: appUser.id,
						taskType: 'daily',
					})
				)
			})
		)
	}
})

app.post('/linear-webhook', async (request, reply) => {
	console.log('Linear Webhook called with:', request.body)
	const { userId } = z.object({ userId: z.string() }).parse(request.query)

	const prisma = await getPrisma()
	const { linearIntegration, habiticaUser } =
		await prisma.appUser.findUniqueOrThrow({
			select: {
				linearIntegration: {
					select: {
						webhookSigningSecret: true,
					},
				},
				habiticaUser: {
					select: {
						apiToken: true,
						id: true,
					},
				},
			},
			where: {
				id: userId,
			},
		})

	if (linearIntegration === null) {
		return reply.status(400).send('User does not have a Linear integration')
	}

	const signature = crypto
		.createHmac('sha256', linearIntegration.webhookSigningSecret)
		.update(request.rawBody!)
		.digest('hex')

	if (signature !== request.headers['linear-signature']) {
		void reply.status(400)
		return
	}

	if (habiticaUser === null) {
		return reply.status(400).send('User must have a habitica account.')
	}

	const { type, data } = z
		.object({
			type: z.string(),
			data: z.object({ title: z.string(), description: z.string() }),
		})
		.parse(request.body)

	if (type === 'IssueCreated') {
		await gotHabitica('POST /api/v3/tasks/user', {
			body: {
				text: data.title,
				type: 'todo',
				notes: data.description,
			},
			habiticaUser,
		})
	}
})

app.post('/webhook', async (request, reply) => {
	console.log('Webhook called with:', request.body)
	const data = request.body as HabiticaRequest
	const { task } = data

	if (!isTaskPublic(task)) {
		return
	}

	const prisma = await getPrisma()
	const appUser = await prisma.appUser.findUniqueOrThrow({
		select: {
			id: true,
			discordUserId: true,
			habiticaUser: {
				select: {
					id: true,
					apiToken: true,
					name: true,
				},
			},
		},
		where: {
			habiticaUserId: data.user._id,
		},
	})
	console.info(`User ID: ${appUser.id}`)

	if (appUser.habiticaUser === null) {
		return
	}

	let title: string
	let description: string
	if (data.direction === 'up') {
		title = `${capitalize(data.task.type)} Completed`
		description = `A ${data.task.type} has been checked off!`
	} else {
		title = `${capitalize(data.task.type)} Undone`
		description = `A ${data.task.type} has been unchecked!`
	}

	const doesTaskNeedProof =
		task.notes.includes('Needs Proof:') && data.direction === 'up'
	const fields: Array<{ name: string; value: string }> = [
		{
			name: 'User',
			value: appUser.habiticaUser.name,
		},
		{
			name: 'Task Name',
			value: task.text,
		},
	]

	if (task.notes.trim() !== '') {
		fields.push({
			name: 'Task Notes',
			value: task.notes,
		})
	}

	fields.push({
		name: 'Date',
		value: dayjs().tz().format('LLL'),
	})

	let taskColor: ColorResolvable
	if (data.direction === 'up') {
		taskColor = doesTaskNeedProof ? 'Orange' : 'Green'
	} else {
		taskColor = 'Red'
	}

	const { files, thumbnail } = await getHabiticaEmbedThumbnail({
		discordUserId: appUser.discordUserId,
	})

	const embed = new EmbedBuilder()
		.setColor(taskColor)
		.setTitle(title)
		.setDescription(description)
		.setThumbnail(thumbnail)
		.addFields(...fields)

	const notificationsChannel = await client.channels.fetch(
		notificationsChannelId
	)
	invariant(notificationsChannel?.type === ChannelType.GuildText)

	if (doesTaskNeedProof) {
		const proofDescription = /Needs Proof:\S*(.*)/.exec(task.notes)?.[1]
		invariant(proofDescription !== undefined, 'missing proof item')
		const notificationsChannel = await client.channels.fetch(
			notificationsChannelId
		)
		invariant(notificationsChannel?.type === ChannelType.GuildText)
		console.info('Sending proof message...')
		await notificationsChannel.send({
			embeds: [embed],
			content: `<@${appUser.discordUserId}>, please send proof of completion for your task _${task.text}_ (${proofDescription})`,
		})
	} else {
		console.info('Sending embed...')
		await notificationsChannel.send({
			embeds: [embed],
			files,
		})
	}

	console.debug('Webhook finished!')
	void reply.status(200)
})

app.listen({ port: 3000 }, (err, address) => {
	console.info(`Server listening on ${address}`)
})

// Launch the Puppeteer browser for faster browser operations in future
void getPuppeteerBrowser()

invariant(process.env.DISCORD_TOKEN !== undefined)

await client.login(process.env.DISCORD_TOKEN)

process.on('uncaughtException', (error) => {
	console.error(error)
})
process.on('unhandledRejection', (error) => {
	console.error(error)
})
