const config = require('../../common/config');

/**
 * Class for store bot users
 * now get user list from config file in future should get user fron db
 */
class RecipientGroupsStore {
    constructor() {
        if (typeof RecipientGroupsStore.instance === 'object') {
            return RecipientGroupsStore.instance;
        }
        RecipientGroupsStore.instance = this;
        this.store = {
            ADMINS: config.USER_LIST, //
            ERROR_GROUP: config.BOT_ERROR_CHAT,
        };
        return this;
    }

    static groupTypes = {
        ADMINS: 'ADMINS',
        ERROR_GROUP: 'ERROR_GROUP',
        ALL: 'ALL',
    };

    getGroupUsersList(name) {
        if (name === RecipientGroupsStore.groupTypes.ALL) {
            return this.all;
        }
        return this.store[name] || [];
    }

    get all() {
        const storeKeyValues = Object.values(this.store);
        const allValuesArray = [];
        storeKeyValues.forEach((item) => {
            allValuesArray.push(...item);
        });
        return allValuesArray;
    }
}

module.exports = RecipientGroupsStore;
