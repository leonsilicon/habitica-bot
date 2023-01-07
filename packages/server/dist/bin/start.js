import path from 'node:path';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { ChannelType, Client, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { fastify } from 'fastify';
import { getProjectDir } from 'lion-utils';
import invariant from 'tiny-invariant';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Toronto');
const monorepoDir = getProjectDir(import.meta.url, { monorepoRoot: true });
console.log(monorepoDir);
dotenv.config({ path: path.join(monorepoDir, '.env') });
const client = new Client({ intents: [] });
client.on('ready', () => {
    invariant(client.user !== null);
    console.log(`Logged in as ${client.user.tag}`);
});
const app = fastify();
app.post('/webhook', async (request, reply) => {
    console.log('Webhook called with:', request.body);
    const data = request.body;
    const { task } = data;
    let description;
    if (data.direction === 'up') {
        description = 'A task has been checked off!';
    }
    else {
        description = 'A task has been unchecked.';
    }
    const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('Habitica Event')
        .setDescription(description)
        .addFields({
        name: 'Task Name',
        value: task.text,
    }, {
        name: 'Date',
        value: dayjs().tz().format('LLL'),
    });
    console.debug('Fetching channel...');
    const channel = await client.channels.fetch('1061299980792496202');
    invariant(channel?.type === ChannelType.GuildText);
    console.debug('Sending message...');
    await channel.send({ embeds: [embed] });
    console.debug('Webhook finished!');
    void reply.status(200);
});
app.listen({ port: 3000 }, (err, address) => {
    console.info(`Server listening on ${address}`);
});
invariant(process.env.DISCORD_TOKEN !== undefined);
await client.login(process.env.DISCORD_TOKEN);
