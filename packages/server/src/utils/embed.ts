import { AttachmentBuilder } from 'discord.js'

import { getHabiticaUserAvatarWithFallback } from '~/utils/avatar.js'

export async function getHabiticaEmbedThumbnail({
	discordUserId,
}: {
	discordUserId: string
}): Promise<{
	thumbnail: string
	files: AttachmentBuilder[]
}> {
	let thumbnail: string
	const files: AttachmentBuilder[] = []
	const avatar = await getHabiticaUserAvatarWithFallback({ discordUserId })
	if ('url' in avatar) {
		thumbnail = avatar.url
	} else {
		const avatarFileName = avatar.isAnimated ? 'avatar.gif' : 'avatar.jpeg'
		const avatarFile = new AttachmentBuilder(avatar.data, {
			name: avatarFileName,
		})
		files.push(avatarFile)

		thumbnail = `attachment://${avatarFileName}`
	}

	return {
		thumbnail,
		files,
	}
}
