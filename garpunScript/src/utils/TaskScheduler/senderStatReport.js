const { Op } = require('sequelize');

const { sendManyMessages } = require('../telegBot/harpoonBot');
const GetEventsStat = require('../statCollector/eventStat');
const ReportsQuery = require('../../models/reports');

class SenderStatReport {
    constructor(timeToday) {
        this.timeToday = timeToday;
    }

    send() {
        return ReportsQuery.findOne({
            where: {
                createdAt: { [Op.startsWith]: this.timeToday },
            },
        })
            .then((report) => {
                if (!report)
                    throw new Error(
                        `Cameras report for ${this.timeToday} not found`
                    );
                const { reportData } = report;
                const reportObject = JSON.parse(reportData);
                return GetEventsStat.printStatReport(reportObject);
            })
            .then((chunkToPrint) => sendManyMessages(chunkToPrint));
    }
}

module.exports = SenderStatReport;
