import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'
import { createTasksSummaryMessage } from '~/utils/tasks.js'

export const habitsCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('habits')
		.setDescription(
			"Show a summary of a user's habits (the user must have set their tasks to public)"
		)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user whose habits you want to view')
				.setRequired(true)
		),
	async execute(interaction) {
		const discordUser = interaction.options.getUser('user')
		invariant(discordUser !== null)

		const prisma = await getPrisma()
		const user = await prisma.user.findFirstOrThrow({
			select: {
				id: true,
				areTasksPublic: true,
			},
			where: {
				discordUserId: discordUser.id,
			},
		})

		if (!user.areTasksPublic) {
			throw new Error('User has set their tasks to private.')
		}

		await interaction.reply(
			await createTasksSummaryMessage({
				userId: user.id,
				taskType: 'habit',
			})
		)
	},
})
