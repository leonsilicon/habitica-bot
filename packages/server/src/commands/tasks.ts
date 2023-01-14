import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import invariant from 'tiny-invariant'

import { defineSlashCommand } from '~/utils/command.js'
import { getHabiticaTasks } from '~/utils/habitica.js'
import { getPrisma } from '~/utils/prisma.js'

export const tasksCommand = defineSlashCommand({
	data: new SlashCommandBuilder()
		.setName('tasks')
		.setDescription(
			"Show a summary of a user's tasks (the user must have set their tasks to public)"
		)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user whose tasks you want to view')
				.setRequired(true)
		),
	async execute(interaction) {
		const discordUser = interaction.options.getUser('user')
		invariant(discordUser !== null)

		const prisma = await getPrisma()
		const user = await prisma.user.findFirstOrThrow({
			select: {
				areTasksPublic: true,
				habiticaUser: {
					select: {
						id: true,
						apiToken: true,
						name: true,
						username: true,
					},
				},
			},
			where: {
				discordUserId: discordUser.id,
			},
		})

		if (!user.areTasksPublic) {
			throw new Error('User has set their tasks to private.')
		}

		const tasks = await getHabiticaTasks({
			habiticaApiToken: user.habiticaUser.apiToken,
			habiticaUserId: user.habiticaUser.id,
		})

		const tasksSummary = tasks
			.filter((task) => task.type === 'daily')
			.map(
				(task) =>
					`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
						task.text
					}`
			)
			.join('\n')

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(
						`Task Summary for ${user.habiticaUser.name} (@${user.habiticaUser.username})`
					)
					.setDescription(tasksSummary),
			],
		})
	},
})
