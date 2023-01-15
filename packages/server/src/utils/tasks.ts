import { type BaseMessageOptions, type MessagePayload } from 'discord.js'

import { gotHabitica } from '~/utils/habitica.js'
import { EmbedBuilder } from 'discord.js'
export async function createTasksSummaryMessage(habiticaUser: {
	apiToken: string
	id: string
	name: string
	username: string
}): Promise<BaseMessageOptions> {
	const tasks = await gotHabitica('GET /api/v3/tasks/user', {
		apiToken: habiticaUser.apiToken,
		userId: habiticaUser.id,
	})

	const tasksSummary = tasks
		.filter((task) => task.type === 'daily' && task.isDue)
		.map(
			(task) =>
				`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
					task.text
				}`
		)
		.join('\n')

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle(
					`Task Summary for ${habiticaUser.name} (@${habiticaUser.username})`
				)
				.setDescription(tasksSummary),
		],
	}
}
