const fileExplorer = require('./fileExplorer');

module.exports = {
    fileName: '',

    fileHandleStrategy: {
        DELETE_NOTIFICATION_OFF: ['.*PLATE.*'],
        IGNORE: [],
    },

    hasStrategy() {
        const { fileHandleStrategy, fileName } = this;
        const strategy = [];
        Object.keys(fileHandleStrategy).forEach((key) => {
            if (fileHandleStrategy[key].length) {
                const regExp = new RegExp(
                    this.fileHandleStrategy[key].join('|'),
                    'gi'
                );
                if (regExp.test(fileName)) {
                    strategy.push(key);
                }
            }
        });
        return strategy;
    },

    fileHandle(fileName) {
        this.fileName = fileName;
        const strategiesNameList = this.hasStrategy();
        const applyStrategy = strategiesNameList.map(
            (name) => this.strategy[name]
        );
        return Promise.allSettled(applyStrategy);
    },

    strategy: {
        DELETE_NOTIFICATION_OFF: fileExplorer.rejectFileHandler(this.fileName),
    },
};
