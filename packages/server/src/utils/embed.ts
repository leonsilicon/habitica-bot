import { Buffer } from 'node:buffer'

import { AttachmentBuilder } from 'discord.js'

import { getDiscordClient } from '~/utils/discord.js'
import { getPrisma } from '~/utils/prisma.js'

export async function getHabiticaEmbedThumbnail({
	discordUserId,
	habiticaUserId,
}: {
	discordUserId: string
	habiticaUserId: string
}): Promise<{
	thumbnail: string
	files: AttachmentBuilder[]
}> {
	let thumbnail: string
	const files: AttachmentBuilder[] = []
	const prisma = await getPrisma()
	const { cachedAvatarBase64 } = await prisma.habiticaUser.findUniqueOrThrow({
		select: {
			cachedAvatarBase64: true,
		},
		where: {
			id: habiticaUserId,
		},
	})
	const client = getDiscordClient()
	if (cachedAvatarBase64 === null) {
		const discordUser = await client.users.fetch(discordUserId)
		thumbnail = discordUser.displayAvatarURL()
	} else {
		const avatarFile = new AttachmentBuilder(
			Buffer.from(cachedAvatarBase64, 'base64'),
			{
				name: 'avatar.jpeg',
			}
		)
		files.push(avatarFile)

		thumbnail = 'attachment://avatar.jpeg'
	}

	return {
		thumbnail,
		files,
	}
}
