import { type BaseMessageOptions, EmbedBuilder } from 'discord.js'

import { type HabiticaTask } from '~/types/habitica.js'
import { gotHabitica } from '~/utils/habitica.js'

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

	const createTasksSummary = (tasks: HabiticaTask[]) =>
		tasks
			.map(
				(task) =>
					`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
						task.text
					}`
			)
			.join('\n')

	const fields: Array<{ name: string; value: string }> = [
		{
			name: 'Habits',
			value: createTasksSummary(tasks.filter((task) => task.type === 'habit')),
		},
		{
			name: 'Dailies',
			value: createTasksSummary(tasks.filter((task) => task.type === 'daily')),
		},
		{
			name: 'Todos',
			value: createTasksSummary(tasks.filter((task) => task.type === 'todo')),
		},
	]

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle(
					`Task Summary for ${habiticaUser.name} (@${habiticaUser.username})`
				)
				.setFields(...fields),
		],
	}
}
