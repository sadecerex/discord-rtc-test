const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


let userDisconnects = {};


let usersExceedingLimit = [];


const notificationChannelId = config.notificationChannelId;

client.once('ready', () => {
    console.log('Bot giriş yaptı!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.id;

    
    if (oldState.channel && !newState.channel) {
        const currentTime = Date.now();
        
        
        if (!userDisconnects[userId]) {
            userDisconnects[userId] = { lastDisconnect: currentTime, disconnectCount: 0 };
        }
        
        
        userDisconnects[userId].lastDisconnect = currentTime;
        userDisconnects[userId].disconnectCount++;
        
        console.log(`${newState.member.user.username} sesli kanaldan ayrıldı. Ayrılma sayısı: ${userDisconnects[userId].disconnectCount}`);
        
        
        if (userDisconnects[userId].disconnectCount >= 10 && !usersExceedingLimit.includes(userId)) {
            
            usersExceedingLimit.push(userId);
            console.log(`${newState.member.user.username} 10 defa bağlantı kopardı ve listeye eklendi.`);

            
            sendEmbedNotification(newState.member.user);
        }
    }

    
    if (!oldState.channel && newState.channel) {
        if (userDisconnects[userId] && userDisconnects[userId].disconnectCount >= 10) {
            
            console.log(`${newState.member.user.username} sesli kanala katıldı, ancak önce 10 defa bağlantı koptu.`);
           
            userDisconnects[userId].disconnectCount = 0;
        }
    }
});


function sendEmbedNotification(user) {
    
    const embed = new EmbedBuilder()
        .setColor('#FF0000') 
        .setTitle('Potansiyel Saldırı Uyarısı')
        .setDescription(`${user.username} adlı kullanıcı 10 defa bağlantı koparıp tekrar bağlandı!`)
        .addFields(
            { name: 'Kullanıcı', value: user.username, inline: true },
            { name: 'ID', value: user.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'J2pon ❤️' });

    
    const channel = client.channels.cache.get(notificationChannelId);
    if (channel) {
        channel.send({ embeds: [embed] });
    }
}


client.on('messageCreate', (message) => {
    if (message.content === '!süpheliliste') {
        if (usersExceedingLimit.length > 0) {
            const userList = usersExceedingLimit.map((userId) => {
                const user = client.users.cache.get(userId);
                return user ? user.username : 'Unknown User';
            }).join('\n');
            message.reply(`10 defa bağlantı koparıp tekrar bağlanan kullanıcılar:\n${userList}`);
        } else {
            message.reply('Henüz 10 defa bağlantı koparıp tekrar bağlanan bir kullanıcı yok.');
        }
    }
});


client.login(config.botToken);
