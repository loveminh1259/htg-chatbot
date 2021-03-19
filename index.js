// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const restify = require('restify');
const path = require('path');
const axios = require('axios');
const times = { hour: 8, minute: 55 };
const moment = require('moment');
// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState } = require('botbuilder');
const conversationReferences = {};
const { DialogBot } = require('./bots/dialogBot');
const { RootDialog } = require('./dialogs/rootDialog');
const bodyParser = require('body-parser');
// const { time } = require('console');
// Create HTTP server.
const server = restify.createServer();
server.use(bodyParser());
server.listen(process.env.port || process.env.PORT || 8080, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Define the state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state storage system to persist the dialog and user state between messages.
const memoryStorage = new MemoryStorage();

// Create conversation and user state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create the main dialog.
const dialog = new RootDialog(userState);

// Create the bot's main handler.
const bot = new DialogBot(conversationState, userState, dialog, conversationReferences);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        // Route the message to the bot's main handler.
        await bot.run(turnContext);
    });
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights. See https://aka.ms/bottelemetry for telemetry
    //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    // Clear out state
    await conversationState.clear(context);
};
server.post('/api/notify', async (req, res) => {
    for (const conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            await turnContext.sendActivity('It time to inform your task, please complete it before 9:00AM. If you not, Mr Quan will beat your ass');
        });
    }

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
    res.end();
});

server.get('/api/remandServer', async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Remanding server request is sent</h1></body></html>');
    res.end();
});
server.get('/api/getContext', async (req, res) => {
    console.log(conversationReferences);
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Remanding server request is sent</h1></body></html>');
    res.end();
});
server.post('/api/setTime', async (req, res) => {
    times.hour = req.body.hour;
    times.minute = req.body.minute;
    console.log(times);
    for (const conversationReference of Object.values(conversationReferences)) {
        await adapter.continueConversation(conversationReference, async turnContext => {
            await turnContext.sendActivity(`Daily scrum reminder will be start at ${ times.hour }:${ times.minute }`);
        });
    }
});
setInterval(function() {
    moment.tz.setDefault('Asia/Ho_Chi_Minh');
    const date = moment();
    console.log(times);
    if (date.hours() === times.hour && date.minutes() === times.minute) {
        axios.post('https://htg-chatbot.herokuapp.com/api/notify');
    } else {
        axios.get('https://htg-chatbot.herokuapp.com/api/remandServer');
    }
}, 60000);
