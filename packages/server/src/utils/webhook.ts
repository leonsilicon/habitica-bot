export const habiticaBotWebhookUrl =
	'https://habitica-bot.leondreamed.com/habitica-webhook'

export const getLinearWebhookUrl = ({ appUserId }: { appUserId: string }) =>
	'https://habitica-bot.leondreamed.com/linear-webhook?userId=' + appUserId
