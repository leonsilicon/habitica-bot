import { type BaseMessageOptions, EmbedBuilder } from 'discord.js'
import pluralize from 'pluralize'

import { gotHabitica } from '~/utils/habitica.js'

export function isTaskPublic(task: { notes: string }) {
	const notes = task.notes.toLowerCase()
	return !notes.includes('hidden') && !notes.includes('private')
}

export async function getPublicTasks(habiticaUser: {
	apiToken: string
	id: string
}) {
	const allTasks = await gotHabitica('GET /api/v3/tasks/user', {
		apiToken: habiticaUser.apiToken,
		userId: habiticaUser.id,
	})
	const publicTasks = allTasks.filter((task) => isTaskPublic(task))

	return publicTasks
}

export async function createTasksSummaryMessage(
	habiticaUser: {
		apiToken: string
		id: string
		name: string
		username: string
	},
	options: { taskType: 'habit' | 'todo' | 'daily' }
): Promise<BaseMessageOptions> {
	const publicTasks = await getPublicTasks(habiticaUser)

	const tasksSummary = publicTasks
		.filter((task) => task.type === options.taskType)
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
					`Viewing ${pluralize(options.taskType)} of ${habiticaUser.name} (@${
						habiticaUser.username
					})`
				)
				.setDescription(
					tasksSummary === ''
						? `[no ${pluralize(options.taskType)} found]`
						: tasksSummary
				),
		],
	}
}
