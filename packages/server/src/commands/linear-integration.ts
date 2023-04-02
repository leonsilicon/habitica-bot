import { Prisma } from '@prisma/client'
import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getLinearTasks } from '~/utils/linear.js'
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
		switch (subcommand) {
			case 'create': {
				const linearApiKey = interaction.options.getString('linear_api_key')
				invariant(linearApiKey !== null, 'not null')
				const prisma = await getPrisma()

				try {
					await prisma.integration.create({
						data: {
							user: {
								connect: {
									discordUserId: interaction.user.id,
								},
							},
							linearIntegration: {
								create: {
									apiKey: linearApiKey,
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
					}
				}

				break
			}

			case 'remove': {
				const prisma = await getPrisma()
				await prisma.linearIntegration.delete({
					where: {
						userId: interaction.user.id,
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
					await prisma.user.findUniqueOrThrow({
						select: {
							habiticaUser: {
								select: {
									apiToken: true,
									userId: true,
								},
							},
							linearIntegration: {
								select: {
									apiKey: true,
								},
							},
						},
						where: {
							id: interaction.user.id,
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

				const linearTasks = await getLinearTasks({ apiKey: linearIntegration.apiKey })

				invariant(
					habiticaUser !== null,
					'user must have a habitica user account'
				)

				const habiticaTasks = await gotHabitica('GET /api/v3/tasks/user', {
					apiToken: habiticaUser.apiToken,
					userId: habiticaUser.userId,
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
								apiToken: habiticaUser.apiToken,
								userId: habiticaUser.userId,
								body: {
									text: linearTask.title,
									type: 'todo',
									priority: '1',
								},
							})
						)
					)

					await interaction.reply({
						ephemeral: true,
						content: 'Linear tasks successfully synced with Habitica!',
					})
				} else {
					await interaction.reply({
						ephemeral: true,
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
