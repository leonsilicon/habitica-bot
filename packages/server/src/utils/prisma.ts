import { PrismaClient } from '@prisma/client'
import onetime from 'onetime'

export const getPrisma = onetime(async () => {
	const prisma = new PrismaClient()
	await prisma.$connect()
	return prisma
})
