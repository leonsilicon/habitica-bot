import { Prisma } from '@prisma/client'
import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { gotHabitica } from '~/utils/habitica.js'
import {
	createLinearWebhook,
	getLinear,
	getLinearTasks,
} from '~/utils/linear.js'
import { getPrisma } from '~/utils/prisma.js'

export const linearIntegrationCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('linear-integration')
		.setDescription('Habitica Linear integration')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('create')
				.setDescription('Create a new Habitica Linear integration')
				.addStringOption((option) =>
					option
						.setName('linear_api_key')
						.setDescription('Your Linear API key')
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('remove')
				.setDescription('Remove an existing Habitica Linear integration')
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('sync-tasks')
				.setDescription('Synchronize your Habitica tasks from Linear')
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand()

		const prisma = await getPrisma()
		const appUser = await prisma.appUser.findUnique({
			select: {
				id: true,
			},
			where: {
				discordUserId: interaction.user.id,
			},
		})

		if (appUser === null) {
			await interaction.reply({
				content: 'You do not have a linked Habitica account.',
				ephemeral: true,
			})
			return
		}

		switch (subcommand) {
			case 'create': {
				const linearApiKey = interaction.options.getString('linear_api_key')
				invariant(linearApiKey !== null, 'not null')
				const prisma = await getPrisma()

				try {
					const webhook = await createLinearWebhook({
						appUserId: appUser.id,
						apiKey: linearApiKey,
					})
					if (webhook?.secret === undefined) {
						throw new Error('Failed to create linear webhook')
					}

					const linear = getLinear({ apiKey: linearApiKey })
					const linearUser = await linear.viewer

					await prisma.integration.create({
						data: {
							appUser: {
								connect: {
									discordUserId: interaction.user.id,
								},
							},
							linearIntegration: {
								create: {
									apiKey: linearApiKey,
									webhookSigningSecret: webhook.secret,
									linearUserId: linearUser.id,
								},
							},
						},
					})
					await interaction.reply({
						ephemeral: true,
						content: 'Linear integration successfully created!',
					})
				} catch (error) {
					if (
						error instanceof Prisma.PrismaClientKnownRequestError && // P2022: Unique constraint failed
						// Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
						error.code === 'P2002'
					) {
						await interaction.reply({
							ephemeral: true,
							content: 'The Linear integration already exists.',
						})
					} else {
						throw error
					}
				}

				break
			}

			case 'remove': {
				const prisma = await getPrisma()
				await prisma.linearIntegration.delete({
					where: {
						appUserId: appUser.id,
					},
				})

				await interaction.reply({
					ephemeral: true,
					content: 'Linear integration successfully removed!',
				})

				break
			}

			case 'sync-tasks': {
				const prisma = await getPrisma()
				const { habiticaUser, linearIntegration } =
					await prisma.appUser.findUniqueOrThrow({
						select: {
							habiticaUser: {
								select: {
									apiToken: true,
									id: true,
								},
							},
							linearIntegration: {
								select: {
									apiKey: true,
								},
							},
						},
						where: {
							discordUserId: interaction.user.id,
						},
					})

				if (linearIntegration === null) {
					await interaction.reply({
						ephemeral: true,
						content:
							'You do not have an existing linear integration. You can one with `/linear-integration create`',
					})
					return
				}

				if (habiticaUser === null) {
					await interaction.reply({
						ephemeral: true,
						content:
							'You do not have a linked Habitica account. You can link one by running `/link`',
					})
					return
				}

				const linearTasks = await getLinearTasks({
					apiKey: linearIntegration.apiKey,
				})

				await interaction.deferReply({
					ephemeral: true,
				})

				const habiticaTasks = await gotHabitica('GET /api/v3/tasks/user', {
					habiticaUser,
					searchParams: {
						type: 'todos',
					},
				})

				// Retrieve all the linear tasks that haven't been added to Habitica yet
				const newLinearTasks = linearTasks.filter(
					(linearTask) =>
						!habiticaTasks.some(
							(habiticaTask) => habiticaTask.text === linearTask.title
						)
				)

				if (newLinearTasks.length > 0) {
					// Add the new linear tasks to Habitica
					await Promise.all(
						newLinearTasks.map(async (linearTask) =>
							gotHabitica('POST /api/v3/tasks/user', {
								habiticaUser,
								body: {
									text: linearTask.title,
									type: 'todo',
									priority: '1',
									notes: linearTask.description,
								},
							})
						)
					)

					await interaction.editReply({
						content: 'Linear tasks successfully synced with Habitica!',
					})
				} else {
					await interaction.editReply({
						content: 'Linear tasks are already synced with Habitica.',
					})
				}

				break
			}

			default: {
				throw new Error(`Unknown subcommand: ${subcommand}`)
			}
		}
	},
})
