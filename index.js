const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const pending = new Map();

client.once('ready', () => {
    console.log(`✅ Bot Aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!cleanwebhook') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ Kamu butuh izin `Manage Messages` untuk ini.');
        }

        pending.set(message.author.id, message.channel.id);
        return message.reply(
            '⚠️ **PERINGATAN**: Ini akan menghapus **SEMUA** pesan dari **SEMUA WEBHOOK** (Spidey Bot, GitHub, IFTTT, dll) dalam 14 hari terakhir.\n' +
            'Ketik `!confirm` untuk lanjut.'
        );
    }

    if (message.content === '!confirm') {
        const channelId = pending.get(message.author.id);
        if (!channelId || channelId !== message.channel.id) return;

        pending.delete(message.author.id);

        const statusMsg = await message.channel.send('⏳ Memindai dan menghapus semua pesan webhook...');
        let totalDeleted = 0;
        let lastMessageId = message.id;

        try {
            while (true) {
                const msgs = await message.channel.messages.fetch({ limit: 100, before: lastMessageId });
                if (msgs.size === 0) break;

                const targets = msgs.filter(m =>
                    m.webhookId !== null &&
                    (Date.now() - m.createdTimestamp) < 1209600000
                );

                if (targets.size > 0) {
                    const deleted = await message.channel.bulkDelete(targets, true);
                    totalDeleted += deleted.size;
                }

                lastMessageId = msgs.last().id;

                const oldestMsg = msgs.last();
                if ((Date.now() - oldestMsg.createdTimestamp) > 1209600000) {
                    break;
                }
            }

            await statusMsg.edit(`✅ Berhasil menghapus total **${totalDeleted}** pesan dari semua webhook.`);
        } catch (error) {
            console.error(error);
            await statusMsg.edit('❌ Gagal menghapus pesan. Pastikan bot memiliki izin `Manage Messages`.');
        }
    }
});

client.login(process.env.TOKEN);