// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, TurnContext } = require('botbuilder');
class DialogBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog, conversationReferences) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        this.conversationReferences = conversationReferences;
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');
            const botname = context._activity.recipient.name;
            const inputText = context.activity.text.replace(botname, '').trim();
            console.log(inputText);
            const currentDialog = await this.dialogState.get(context);
            console.log(currentDialog);
            if (currentDialog === undefined) {
                if (inputText.toLowerCase() === 'set time notify') {
                    await this.dialog.run(context, this.dialogState);
                } else if (inputText.toLowerCase() === 'action') {
                    const replyText = '1 - Set time notify (Set up time to remind daily scrum\n';
                    await context.sendActivity(MessageFactory.text(replyText, replyText));
                } else {
                    await context.sendActivity(MessageFactory.text('There is not action can activate from your message!'));
                }
            } else if (currentDialog.dialogStack && currentDialog.dialogStack.length > 0) {
                await this.dialog.run(context, this.dialogState);
            } else {
                this.dialog.run(context, this.dialogState);
            }
            // Run the Dialog with the new message Activity.

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
        this.onMembersRemoved(async (context, next) => {
            context.sendActivity('Good bye');
            await next();
        });
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
        this.onConversationUpdate(async (context, next) => {
            this.addConversationReference(context.activity);
            console.log('Conversation updated');
            await next();
        });
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    addConversationReference(activity) {
        const conversationReference = TurnContext.getConversationReference(activity);
        console.log('conversation added');
        this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    }
}

module.exports.DialogBot = DialogBot;
