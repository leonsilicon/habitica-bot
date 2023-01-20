import { type BaseMessageOptions, EmbedBuilder } from 'discord.js'

import { type HabiticaTask } from '~/types/habitica.js'
import { gotHabitica } from '~/utils/habitica.js'

export function isTaskPublic(task: { notes: string }) {
	const notes = task.notes.toLowerCase()
	return notes.includes('hidden') || notes.includes('private')
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

export async function createTasksSummaryMessage(habiticaUser: {
	apiToken: string
	id: string
	name: string
	username: string
}): Promise<BaseMessageOptions> {
	const publicTasks = await getPublicTasks(habiticaUser)

	const createTasksSummary = (tasks: HabiticaTask[]) =>
		tasks
			.map(
				(task) =>
					`${task.completed ? ':white_check_mark:' : ':white_large_square:'} ${
						task.text
					}`
			)
			.join('\n')
	const fields: Array<{ name: string; value: string }> = []

	const habitsSummary = createTasksSummary(
		publicTasks.filter((task) => task.type === 'habit')
	)
	if (habitsSummary !== '') {
		fields.push({
			name: 'Habits',
			value: habitsSummary,
		})
	}

	const dailiesSummary = createTasksSummary(
		publicTasks.filter((task) => task.type === 'daily')
	)
	if (dailiesSummary !== '') {
		fields.push({
			name: 'Dailies',
			value: dailiesSummary,
		})
	}

	const todosSummary = createTasksSummary(
		publicTasks.filter((task) => task.type === 'todo')
	)
	if (todosSummary !== '') {
		fields.push({
			name: 'Todos',
			value: todosSummary,
		})
	}

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
