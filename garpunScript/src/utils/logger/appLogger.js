/* eslint-disable no-case-declarations */
const { EOL } = require('os');
const RecipientGroupsStore = require('../telegBot/RecipientGroupsStore');
const AbstractErrorLogEvent = require('../errorHandlers/AbstractErrorLogEvent');
const { appErrorLog } = require('./logToFile');
const { HarpoonBotMsgSender } = require('../telegBot/harpoonBot');

module.exports = {
    printLog(event) {
        let message = '';
        if (event instanceof AbstractErrorLogEvent) {
            message = event.PrepareMsgToPrint();
        }
        else {
            message = event;
        }
        return {
            errorSecond() {
                process.stdout.write(`\x1b[1;31m${message}\x1b[0m${EOL}`);
                return this;
            },

            appInfoMessage() {
                process.stdout.write(`\x1b[36m${message}\x1b[0m${EOL}`);
                return this;
            },

            warning() {
                process.stdout.write(`\x1b[33m${message}\x1b[0m${EOL}`);
                return this;
            },

            successful() {
                process.stdout.write(`\x1b[32m${message}\x1b[0m${EOL}`);
                return this;
            },
            /**
             * Show error in console log
             * @returns 
             */
            error() {
                process.stderr.write(`\x1b[31m${message}\x1b[0m${EOL}`);
                return this;
            },
            /**
             * Save error to error log file
             * @returns 
             */
            toErrorLog() {
                appErrorLog({ message });
                return this;
            },
            /**
             *Send one msg to the group
             * @param {*} groupName
             * @param {*} iconType
             */
            botMessage(groupName, iconType) {
                const icon = iconType || '';
                new HarpoonBotMsgSender().sendMessage(
                    `${message} ${icon}`,
                    groupName
                );
            },
            errorGroupChatMessage() {
                const { emitter, stack } = event;
                const splittedStack = stack.split('\n');
                const messageArray = [
                    ` ${HarpoonBotMsgSender.telegramIcons.CAMERA_OFFLINE_WARNING}\nEmitter: ${emitter}\n`,
                ];
                messageArray.push(splittedStack[0]); // Error message
                let text = '';
                splittedStack.forEach((item, i) => {
                    if (i > 0) {
                        let tempText = text;
                        tempText += `${item}\n`;
                        if (tempText.length > 150) {
                            messageArray.push(text);
                            text = '';
                        }
                        text += `${item}\n`;
                    }
                });
                new HarpoonBotMsgSender().sendManyMessages(
                    messageArray,
                    RecipientGroupsStore.groupTypes.ERROR_GROUP
                );
            },
        };
    },
};
