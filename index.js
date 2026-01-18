const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const TARGET_WEBHOOK_ID = '1462284662213836997';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const pending = new Map();

client.once('ready', () => {
    console.log(`Login sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // STEP 1
    if (message.content === '!cleanwebhook') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Tidak punya izin');
        }

        pending.set(message.author.id, message.channel.id);
        return message.reply(
            '⚠️ Ini akan menghapus **SEMUA pesan dari webhook Spidey Bot (<14 hari)** di channel ini.\n' +
            'Ketik `!confirm` untuk lanjut.'
        );
    }

    // STEP 2
    if (message.content === '!confirm') {
        const channelId = pending.get(message.author.id);
        if (channelId !== message.channel.id) return;

        pending.delete(message.author.id);
        await message.delete();

        let total = 0;

        while (true) {
            const msgs = await message.channel.messages.fetch({ limit: 100 });
            if (msgs.size === 0) break;

            const targets = msgs.filter(m =>
                m.webhookId === TARGET_WEBHOOK_ID &&
                Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );

            if (targets.size === 0) break;

            await message.channel.bulkDelete(targets, true);
            total += targets.size;
        }

        return message.channel.send(
            `✅ Selesai. ${total} pesan webhook Spidey Bot terhapus.`
        );
    }
});

client.login(process.env.TOKEN);
