import { got } from 'got'

import {
	type HabiticaTasksResponse,
	type HabiticaUserResponse,
} from '~/types/habitica.js'
import { env } from '~/utils/env.js'

interface HabiticaCredentials {
	habiticaUserId: string
	habiticaApiToken: string
}

// TODO: make this a generic function

export async function getHabiticaUser({
	habiticaUserId,
	habiticaApiToken,
}: HabiticaCredentials): Promise<HabiticaUserResponse> {
	// Retrieve the Habitica user's name
	const response = await got.get('https://habitica.com/api/v3/user', {
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': habiticaUserId,
			'x-api-key': habiticaApiToken,
			'x-client': `${env('HABITICA_USER_ID')}-HabiticaBot`,
		},
	})

	const result = JSON.parse(response.body) as {
		success: boolean
		data: HabiticaUserResponse
	}

	if (!result.success) {
		throw new Error('Failed to get Habitica user.')
	}

	return result.data
}

export async function getHabiticaTasks({
	habiticaApiToken,
	habiticaUserId,
}: HabiticaCredentials) {
	const response = await got.get('https://habitica.com/api/v3/tasks/user', {
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': habiticaUserId,
			'x-api-key': habiticaApiToken,
			'x-client': `${env('HABITICA_USER_ID')}-HabiticaBot`,
		},
	})
	const result = JSON.parse(response.body) as {
		success: boolean
		data: HabiticaTasksResponse
	}

	if (!result.success) {
		throw new Error('Failed to get Habitica user.')
	}

	return result.data
}
