import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

export const setCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('setting')
		.setDescription(
			"Configure your personal settings"
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('public_tasks')
				.setDescription('Whether your tasks are public to all users')
				.addBooleanOption((option) => option.setName('public_tasks_enabled'))
		),
	async execute(interaction) {
		const discordUser = interaction.options.getUser('user')
		invariant(discordUser !== null)

		if (interaction.options.getSubcommand() === 'public_tasks') {
			const publicTasksEnabled = interaction.options.getBoolean(
				'public_tasks_enabled'
			)

			const prisma = await getPrisma()
			await prisma.user.update({
				data: {
					areTasksPublic: publicTasksEnabled,
				},
				where: {
					discordUserId: discordUser.id,
				},
			})
		}

		await interaction.reply({
			ephemeral: true,
			content: `Successfully updated your settings!`,
		})
	},
})
