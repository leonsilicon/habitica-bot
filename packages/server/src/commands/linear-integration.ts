import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { gotHabitica } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'
import { habiticaBotWebhookUrl } from '~/utils/webhook.js'

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
				const prisma = await getPrisma()
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


				break
			}

			case 'remove': {
				const prisma = await getPrisma()
				await prisma.linearIntegration.delete({
					where: {
						userId: interaction.user.id,
					},
				})
				break
			}

			case 'sync-tasks': {

			}

			default: {
				throw new Error(`Unknown subcommand: ${subcommand}`)
			}
		}
	},
})
