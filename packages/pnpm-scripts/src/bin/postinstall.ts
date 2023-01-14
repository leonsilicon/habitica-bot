import { packageDirs } from '@habitica-bot/paths'
import { execaCommand } from 'execa'

await execaCommand('pnpm exec prisma generate --schema=./schema.prisma', {
	cwd: packageDirs.server,
	stdio: 'inherit',
})
