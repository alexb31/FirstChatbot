var builder = require('botbuilder');
var restify = require('restify');

// restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function () {
    console.log(`server name:${server.name} | server url: ${server.url}`)
});

//Chat Connector
var connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function(session){

    session.send(JSON.stringify(session.message.text));

    session.send(`Taille du texte : ${session.message.text.length}`);

    bot.on('typing', function (){
    session.send(`haha, t'es en train d'écrire`);    
    });

});

    // Welcome message AND message when ADD USER
bot.on('conversationUpdate',function(message){
    if(message.membersAdded && message.membersAdded.length > 0){
        message.membersAdded.forEach(function (identity) {

            // Check if not a bot
            if(identity.id != message.address.bot.id){

                // User info
                var membersAdded =  identity.name || ' ' + '(Id=' + identity.id + ' )';

                // Send message
                bot.send(new builder.Message()
                    .address(message.address)
                    .text('Salut ' + membersAdded + ' !')
                );
            }
        }).join(', ');
    }
});
    
    
    //session.send(`OK CA MARCHE | [Message.length = ${session.message.text.length}]`);
    //session.send(`DIALOG = ${JSON.stringify(session.dialogData)}]`);
    //session.send(`OK CA MARCHE | [Message.length = ${JSON.stringify(session.sessionState)}]`);
    