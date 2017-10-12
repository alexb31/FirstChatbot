var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();
server.listen(process.env.port || 3987, function(){
    console.log('server name:' + server.name + ' | server url:' + server.url );
});

var connector = new builder.ChatConnector({
    appId      : process.env.appId || '',
    appPassword: process.env.appPassword || ''
})
    
server.post('/api/messages', connector.listen());
var res = [];

var bot = new builder.UniversalBot(connector, function(session){
    session.send("Bienvenue dans le ResaBot");
    session.beginDialog('askName');         
});

bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'Peut tu me dire ton nom?');
    },
    function (session, results){
        session.endDialog('Salut %s!', results.response);
        res['name'] = results.response;
        session.replaceDialog('askPhone');
    }
]);

bot.dialog('askPhone', [
    function (session, args) {
        if (args && args.reprompt) {
            builder.Prompts.text(session, "Veuillez entrer un numero au format 06XXXXXXXX ou 07XXXXXXXX")
        } else {
            builder.Prompts.text(session, "Quel est ton numero de téléphone?");
        }
    },
    function (session, results) {
        var matched = results.response.match(/\d+/g);
        var number  = matched ? matched.join('') : '';
        if (number.length == 10 && (number.substring(0,2) == '06' || number.substring(0,2) == '07') ) {
            session.endDialog('Ton numero est %s', number);
            res['phone'] = number;
            session.replaceDialog('askNumber'); 
        } else {
            session.replaceDialog('askPhone', { reprompt: true });
        }
    }
]); 


bot.dialog('askNumber', [
    function (session) {
        builder.Prompts.choice(session, "Combien de personnes?", "1|2|3|4", { listStyle: builder.ListStyle.button});
    },
    function (session, results){
        session.endDialog('Tu as reservé pour %s personnes', results.response.entity);
        res['number'] = results.response.entity;
        session.replaceDialog('askDate');
    }
]);

bot.dialog('askDate', [
    function (session) {
        builder.Prompts.time(session, 'A quelle date?');
    },
    function (session, results){
        session.endDialog('Tu as reservé pour le %s', builder.EntityRecognizer.resolveTime([results.response]));
        res['date'] = builder.EntityRecognizer.resolveTime([results.response]);;
        session.send("Voici le detail de ta reservation:<br> nom: %s <br> date: %s <br> nombre de personnes: %s", res['name'], res['date'], res['number']);
    }
]);

bot.dialog('menu', [
    function (session) {
        builder.Prompts.choice(session, "Choisis une etape", "nom|nombre de personnes|date|telephone", { listStyle: builder.ListStyle.button});
    },
    function (session, results){
        switch(results.response.index){
            case 0: 
                session.replaceDialog('askName');
            break;
            
            case 1: 
                session.replaceDialog('askNumber');
            break;

            case 2: 
                session.replaceDialog('askDate');
            break;
            
            case 3: 
                session.replaceDialog('askPhone');
            break;
        }
    }
]).triggerAction({
    matches      : /^menu$/i,
    confirmPrompt: "Veux tu retourner dans le menu?"
});

bot.dialog('restart', [ 
    function (session) {
        res = [];
        session.beginDialog('askName');   
    } 
]).triggerAction({
    matches      : /^restart$/i,
    confirmPrompt: "Veux tu recommencer ta reservation?"
});

bot.dialog('cancel', [ 
    function (session) {
        res = [];
        session.beginDialog('askName');   
    } 
]).triggerAction({
    matches      : /^cancel$/i,
    confirmPrompt: "Veux annuler ta reservation?"
});