"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var restify = require('restify');

var path = require('path');

var axios = require('axios');

var times = {
  hour: 8,
  minute: 55
};

var moment = require('moment'); // Read botFilePath and botFileSecret from .env file.


var ENV_FILE = path.join(__dirname, '.env');

require('dotenv').config({
  path: ENV_FILE
}); // Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.


var _require = require('botbuilder'),
    BotFrameworkAdapter = _require.BotFrameworkAdapter,
    ConversationState = _require.ConversationState,
    MemoryStorage = _require.MemoryStorage,
    UserState = _require.UserState;

var conversationReferences = {};

var _require2 = require('./bots/dialogBot'),
    DialogBot = _require2.DialogBot;

var _require3 = require('./dialogs/rootDialog'),
    RootDialog = _require3.RootDialog;

var bodyParser = require('body-parser'); // const { time } = require('console');
// Create HTTP server.


var server = restify.createServer();
server.use(bodyParser());
server.listen(process.env.port || process.env.PORT || 8080, function () {
  console.log("\n".concat(server.name, " listening to ").concat(server.url));
  console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
}); // Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.

var adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
}); // Define the state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state storage system to persist the dialog and user state between messages.

var memoryStorage = new MemoryStorage(); // Create conversation and user state with in-memory storage provider.

var conversationState = new ConversationState(memoryStorage);
var userState = new UserState(memoryStorage); // Create the main dialog.

var dialog = new RootDialog(userState); // Create the bot's main handler.

var bot = new DialogBot(conversationState, userState, dialog, conversationReferences); // Listen for incoming requests.

server.post('/api/messages', function (req, res) {
  adapter.processActivity(req, res, function _callee(turnContext) {
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(bot.run(turnContext));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    });
  });
}); // Catch-all for errors.

adapter.onTurnError = function _callee2(context, error) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // This check writes out errors to console log .vs. app insights.
          // NOTE: In production environment, you should consider logging this to Azure
          //       application insights. See https://aka.ms/bottelemetry for telemetry
          //       configuration instructions.
          console.error("\n [onTurnError] unhandled error: ".concat(error)); // Send a trace activity, which will be displayed in Bot Framework Emulator

          _context2.next = 3;
          return regeneratorRuntime.awrap(context.sendTraceActivity('OnTurnError Trace', "".concat(error), 'https://www.botframework.com/schemas/error', 'TurnError'));

        case 3:
          _context2.next = 5;
          return regeneratorRuntime.awrap(context.sendActivity('The bot encountered an error or bug.'));

        case 5:
          _context2.next = 7;
          return regeneratorRuntime.awrap(context.sendActivity('To continue to run this bot, please fix the bot source code.'));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(conversationState.clear(context));

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
};

server.post('/api/notify', function _callee4(req, res) {
  var _i, _Object$values, conversationReference;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _i = 0, _Object$values = Object.values(conversationReferences);

        case 1:
          if (!(_i < _Object$values.length)) {
            _context4.next = 8;
            break;
          }

          conversationReference = _Object$values[_i];
          _context4.next = 5;
          return regeneratorRuntime.awrap(adapter.continueConversation(conversationReference, function _callee3(turnContext) {
            return regeneratorRuntime.async(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    _context3.next = 2;
                    return regeneratorRuntime.awrap(turnContext.sendActivity('It time to inform your task, please complete it before 9:00AM. If you not, Mr Quan will beat your ass'));

                  case 2:
                  case "end":
                    return _context3.stop();
                }
              }
            });
          }));

        case 5:
          _i++;
          _context4.next = 1;
          break;

        case 8:
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
          res.end();

        case 12:
        case "end":
          return _context4.stop();
      }
    }
  });
});
server.get('/api/remandServer', function _callee5(req, res) {
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.write('<html><body><h1>Remanding server request is sent</h1></body></html>');
          res.end();

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  });
});
server.get('/api/getContext', function _callee6(req, res) {
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          console.log(conversationReferences);
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.write('<html><body><h1>Remanding server request is sent</h1></body></html>');
          res.end();

        case 5:
        case "end":
          return _context6.stop();
      }
    }
  });
});
server.post('/api/setTime', function _callee8(req, res) {
  var _i2, _Object$values2, conversationReference;

  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          times.hour = req.body.hour;
          times.minute = req.body.minute;
          console.log(times);
          _i2 = 0, _Object$values2 = Object.values(conversationReferences);

        case 4:
          if (!(_i2 < _Object$values2.length)) {
            _context8.next = 11;
            break;
          }

          conversationReference = _Object$values2[_i2];
          _context8.next = 8;
          return regeneratorRuntime.awrap(adapter.continueConversation(conversationReference, function _callee7(turnContext) {
            return regeneratorRuntime.async(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    _context7.next = 2;
                    return regeneratorRuntime.awrap(turnContext.sendActivity("Daily scrum reminder will be start at ".concat(times.hour, ":").concat(times.minute)));

                  case 2:
                  case "end":
                    return _context7.stop();
                }
              }
            });
          }));

        case 8:
          _i2++;
          _context8.next = 4;
          break;

        case 11:
        case "end":
          return _context8.stop();
      }
    }
  });
});
setInterval(function () {
  moment.tz.setDefault('Asia/Ho_Chi_Minh');
  var date = moment();
  console.log(times);

  if (date.hours() === times.hour && date.minutes() === times.minute) {
    axios.post('https://a202a1f9a8aa.ngrok.io/api/notify');
  } else {
    axios.get('https://a202a1f9a8aa.ngrok.io/api/remandServer');
  }
}, 60000);