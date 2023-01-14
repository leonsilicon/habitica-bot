import { got } from 'got'

import { env } from '~/utils/env.js'
import { getPrisma } from '~/utils/prisma.js'

export async function createUser({
	habiticaUserId,
	discordUserId,
	habiticaApiToken,
}: {
	habiticaUserId: string
	discordUserId: string
	habiticaApiToken: string
}) {
	// Retrieve the Habitica user's name
	const response = await got('https://habitica.com/api/v3/user', {
		headers: {
			'Content-Type': 'application/json',
			'x-api-user': habiticaUserId,
			'x-api-key': habiticaApiToken,
			'x-client': `${env('HABITICA_USER_ID')}-HabiticaBot`,
		},
	})
	const { profile } = JSON.parse(response.body) as { profile: { name: string } }

	const prisma = await getPrisma()
	await prisma.user.create({
		data: {
			habiticaUserId,
			habiticaUser: {
				name: profile.name,
				apiToken: habiticaApiToken,
			},
			discordUserId,
		},
	})
}
