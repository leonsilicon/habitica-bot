import { got } from 'got'

import { type HabiticaUser } from '~/types/habitica.js'
import { env } from '~/utils/env.js'

export async function getHabiticaUser({
	habiticaUserId,
	habiticaApiToken,
}: {
	habiticaUserId: string
	habiticaApiToken: string
}): Promise<HabiticaUser> {
	// Retrieve the Habitica user's name
	const response = await got('https://habitica.com/api/v3/user', {
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': habiticaUserId,
			'x-api-key': habiticaApiToken,
			'x-client': `${env('HABITICA_USER_ID')}-HabiticaBot`,
		},
	})
	const { data } = JSON.parse(response.body) as { data: HabiticaUser }
	return data
}
