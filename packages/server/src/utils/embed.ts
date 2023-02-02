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
	const { avatar } = await prisma.habiticaUser.findUniqueOrThrow({
		select: {
			avatar: true,
		},
		where: {
			id: habiticaUserId,
		},
	})
	const client = getDiscordClient()
	if (avatar === null) {
		const discordUser = await client.users.fetch(discordUserId)
		thumbnail = discordUser.displayAvatarURL()
	} else {
		const avatarFileName = avatar.isAnimated ? 'avatar.gif' : 'avatar.jpeg'
		const avatarFile = new AttachmentBuilder(
			Buffer.from(avatar.base64Data, 'base64'),
			{
				name: avatarFileName,
			}
		)
		files.push(avatarFile)

		thumbnail = `attachment://${avatarFileName}`
	}

	return {
		thumbnail,
		files,
	}
}
