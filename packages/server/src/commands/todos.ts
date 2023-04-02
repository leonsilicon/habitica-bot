import { SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getPrisma } from '~/utils/prisma.js'
import { createTasksSummaryMessage } from '~/utils/tasks.js'

export const todosCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('todos')
		.setDescription(
			"Show a summary of a user's todos (the user must have set their tasks to public)"
		)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user whose todos you want to view')
				.setRequired(true)
		),
	async execute(interaction) {
		const discordUser = interaction.options.getUser('user')
		invariant(discordUser !== null)

		const prisma = await getPrisma()
		const appUser = await prisma.appUser.findFirstOrThrow({
			select: {
				areTasksPublic: true,
				id: true,
			},
			where: {
				discordUserId: discordUser.id,
			},
		})

		if (!appUser.areTasksPublic) {
			throw new Error('User has set their tasks to private.')
		}

		await interaction.reply(
			await createTasksSummaryMessage({
				appUserId: appUser.id,
				taskType: 'todo',
			})
		)
	},
})
