import { AttachmentBuilder } from 'discord.js'

import {
	getCachedHabiticaUserAvatar,
	getHabiticaUserAvatar,
} from '~/utils/avatar.js'
import { getDiscordClient } from '~/utils/discord.js'

export async function getHabiticaEmbedThumbnail({
	discordUserId,
	habiticaUserId,
	habiticaApiToken,
}: {
	discordUserId: string
	habiticaUserId: string
	habiticaApiToken: string
}): Promise<{
	thumbnail: string
	files: AttachmentBuilder[]
}> {
	let thumbnail: string
	const files: AttachmentBuilder[] = []
	const cachedHabiticaUserAvatar = getCachedHabiticaUserAvatar({
		habiticaUserId,
	})
	const client = getDiscordClient()
	if (cachedHabiticaUserAvatar === undefined) {
		const discordUser = await client.users.fetch(discordUserId)
		thumbnail = discordUser.displayAvatarURL()
	} else {
		const avatarFile = new AttachmentBuilder(
			await getHabiticaUserAvatar({
				habiticaApiToken,
				habiticaUserId,
			}),
			{ name: 'avatar.jpeg' }
		)
		files.push(avatarFile)

		thumbnail = 'attachment://avatar.jpeg'
	}

	return {
		thumbnail,
		files,
	}
}
