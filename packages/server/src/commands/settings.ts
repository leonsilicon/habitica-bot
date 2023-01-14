import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

export const settingsCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Interact with your personal settings')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('public_tasks')
				.setDescription('Whether your tasks are public')
				.addBooleanOption((option) =>
					option
						.setName('new_value')
						.setDescription(
							'true if you want your tasks to be public, false if you want them to be private'
						)
						.setRequired(false)
				)
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === 'public_tasks') {
			const value = interaction.options.getBoolean('new_value')
			invariant(value !== null)
			const prisma = await getPrisma()
			await prisma.user.update({
				data: {
					areTasksPublic: value,
				},
				where: {
					discordUserId: interaction.user.id,
				},
			})
		}

		await interaction.reply({
			ephemeral: true,
			content: `Successfully updated your settings!`,
		})
	},
})
