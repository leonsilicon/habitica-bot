import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'
import yn from 'yn'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'

export const settingsCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Interact with your personal settings')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('set')
				.setDescription('Configure your personal settings')
				.addStringOption((option) =>
					option
						.setName('set_choice')
						.setDescription('The setting you want to set')
						.setChoices({
							name: 'Public Tasks',
							value: 'public_tasks',
						})
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('set_value')
						.setDescription('The value you want to set')
				)
		),
	async execute(interaction) {
		const discordUser = interaction.options.getUser('user')
		invariant(discordUser !== null)

		if (interaction.options.getSubcommand() === 'set') {
			const choice = interaction.options.getString('set_choice')
			const stringValue = interaction.options.getString('set_value')
			invariant(value !== null)

			if (choice === 'public_tasks') {
				const value = yn(stringValue)
				invariant(value !== undefined)
				const prisma = await getPrisma()
				await prisma.user.update({
					data: {
						areTasksPublic: value,
					},
					where: {
						discordUserId: discordUser.id,
					},
				})
			}
		}

		await interaction.reply({
			ephemeral: true,
			content: `Successfully updated your settings!`,
		})
	},
})
