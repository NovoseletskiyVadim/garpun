const QuickChart = require('quickchart-js');

class ChartCreator extends QuickChart {
    constructor(chartData, chartType, titleText, labelText) {
        super();
        this.labels = Object.keys(chartData);
        this.data = Object.values(chartData);
        this.chartType = chartType;
        this.titleText = titleText || '';
        this.labelText = labelText || '';
    }

    createChart() {
        if (!this.chartType) throw new Error('Chart type is not set');
        this.setConfig({
            type: this.chartType,
            data: {
                datasets: [
                    {
                        data: this.data,
                        backgroundColor: [
                            '#FDAC53',
                            '#9BB7D4',
                            '#B55A30',
                            '#F5DF4D',
                            '#0072B5',
                            '#A0DAA9',
                            '#E9897E',
                            '#00A170',
                            '#926AA6',
                        ].sort(() => 0.5 - Math.random()),
                        label: this.labelText,
                    },
                ],
                labels: this.labels,
            },
            options: {
                title: {
                    display: true,
                    text: this.titleText,
                },
            },
        });
        return this;
    }
}

module.exports = ChartCreator;
