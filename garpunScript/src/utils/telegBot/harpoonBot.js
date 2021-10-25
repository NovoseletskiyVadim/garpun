const axios = require('axios');

const { BOT_TOKEN } = require('../../common/config');
const RecipientGroupsStore = require('./RecipientGroupsStore');

class HarpoonBotMsgSender {
    constructor() {
        this.userStore = new RecipientGroupsStore();
        this.groupList = [];
    }

    static telegramIcons = {
        API_OK: '\xF0\x9F\x9A\x80',
        API_ERROR: '\xE2\x9B\x94',
        JSON_RESENDER: '\xE2\x8F\xB3',
        QUERY_UP: '\xE2\xAC\x86',
        QUERY_DOWN: '\xE2\xAC\x87',
        CAMERA_ONLINE: '\xE2\x9C\x85',
        CAMERA_OFFLINE: '\xE2\x9D\x8C',
        APP_START: '\xF0\x9F\x94\xB1',
        CAMERA_OFFLINE_WARNING: '\xE2\x81\x89',
    };

    getGroupUsersList(groupName) {
        if (!this.userStore) throw new Error('User store not exist');
        return this.userStore.getGroupUsersList(groupName);
    }

    sendMessage(msg, groupName) {
        const groupUserList = this.getGroupUsersList(groupName);
        const usersMsgReq = groupUserList.map((user) =>
            axios
                .get(
                    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${user}&text=${msg}&parse_mode=HTML`
                )
                .catch((error) => {
                    console.error(error);
                })
        );
        return Promise.all(usersMsgReq);
    }

    // eslint-disable-next-line class-methods-use-this
    sendManyMessages(msgArr, groupName) {
        if (Array.isArray(msgArr)) {
            let i = 0;
            const arrLength = msgArr.length;
            // eslint-disable-next-line no-inner-declarations
            const startQuery = () =>
                this.sendMessage(
                    `<i>${i + 1}\\${arrLength}</i>\n${msgArr[i]}`,
                    groupName
                )
                    .then(() => {
                        i += 1;
                        if (i < arrLength) {
                            startQuery();
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            startQuery();
        }
    }
}

module.exports = {
    HarpoonBotMsgSender,
};
