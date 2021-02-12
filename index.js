const Discord         = require("discord.js");
const prefix = "!";

const ytdl            = require("ytdl-core");
require("dotenv").config();

const client = new Discord.Client();

const queue = new Map();
client.login("TOKEN");


client.on("ready", () => {
        console.log("Ready!");
        client.user.setActivity("Developped by HentAiiryy⌛");
});

client.on("reconnecting", () => {
        console.log("Reconnecting!");
});

client.on("disconnect", () => {
        console.log("Disconnect!");
        
});

client.on("message", async message => {
        if (message.author.bot) {
                return;
        }
        if (!message.content.startsWith(prefix)) {
                return;
        }

        const serverQueue = queue.get(message.guild.id);

        if (message.content.startsWith(`${prefix}play`)) {
                execute(message, serverQueue); // On appel execute qui soit initialise et lance la musique soit ajoute à la queue la musique
                return;
        }
        else if (message.content.startsWith(`${prefix}skip`)) {
                skip(message, serverQueue); // Permettra de passer à la musique suivante
                return;
        }
        else if (message.content.startsWith(`${prefix}stop`)) {
                stop(message, serverQueue); // Permettra de stopper la lecture
                return;

                
        }
        else {
                message.channel.send("You need to enter a valid command!");
        }

});

async function execute(message, serverQueue) {
        const args = message.content.split(" "); // On récupère les arguments dans le message pour la suite

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) // Si l'utilisateur n'est pas dans un salon vocal
        {
                return message.channel.send(
                    "Vous devez être dans un salon vocal!"
                );
        }
        const permissions = voiceChannel.permissionsFor(message.client.user); // On récupère les permissions du bot pour le salon vocal
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) { // Si le bot n'a pas les permissions
                return message.channel.send(
                    "J'ai besoin des permissions pour rejoindre le salon et pour y jouer de la musique!"
                );
        }

        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
        title: songInfo.videoDetails.title,
        url : songInfo.videoDetails.video_url,
        };

        if (!serverQueue) {
                const queueConstruct = {
                        textChannel : message.channel,
                        voiceChannel: voiceChannel,
                        connection  : null,
                        songs       : [],
                        volume      : 0.00000000001,
                        playing     : true,
                };

                // On ajoute la queue du serveur dans la queue globale:
                queue.set(message.guild.id, queueConstruct);
                // On y ajoute la musique
                queueConstruct.songs.push(song);

                try {
                        // On connecte le bot au salon vocal et on sauvegarde l'objet connection
                        var connection           = await voiceChannel.join();
                        queueConstruct.connection = connection;
                        // On lance la musique
                        play(message.guild, queueConstruct.songs[0]);
                }
                catch (err) {
                        //On affiche les messages d'erreur si le bot ne réussi pas à se connecter, on supprime également la queue de lecture
                        console.log(err);
                        queue.delete(message.guild.id);
                        return message.channel.send(err);
                }
        }
        else {
                serverQueue.songs.push(song);
                console.log(serverQueue.songs);
                return message.channel.send(`${song.title} has been added to the queue!`);
        }

}

function skip(message, serverQueue) {
        if (!message.member.voice.channel) // on vérifie que l'utilisateur est bien dans un salon vocal pour skip
        {
                return message.channel.send(
                    "Vous devez être dans un salon vocal pour passer une musique!"
                );
        }
        if (!serverQueue) // On vérifie si une musique est en cours
        {
                return message.channel.send("Aucune lecture de musique en cours !");
        }
        serverQueue.connection.dispatcher.end(); // On termine la musique courante, ce qui lance la suivante grâce à l'écoute d'événement
                                                 // finish
}

function stop(message, serverQueue) {
        if (!message.member.voice.channel) // on vérifie que l'utilisateur est bien dans un salon vocal pour skip
        {
                return message.channel.send(
                    "Vous devez être dans un salon vocal pour stopper la lecture!"
                );
        }
        if (!serverQueue) // On vérifie si une musique est en cours
        {
                return message.channel.send("Aucune lecture de musique en cours !");
        }
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
        console.log(song);
        const serverQueue = queue.get(guild.id); // On récupère la queue de lecture
        if (!song) { // Si la musique que l'utilisateur veux lancer n'existe pas on annule tout et on supprime la queue de lecture
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                return;
        }
      
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url, { filter: 'audioonly' }))
            .on("finish", () => { // 
                    serverQueue.songs.shift(); // 
                    play(guild, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));
        dispatcher.setVolume(0.1); 
        serverQueue.textChannel.send(`Démarrage de la musique: **${song.title}**`);
}


           
