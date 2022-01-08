const config = require('./FileStatHandler.config.json');

function checkFileName(fileName) {
    const fileNameRegX = new RegExp(
        `^${config.eventTimeRegX}_${
            config.plateNumberRegX
        }_(${config.allowedEventsNames.join('|')})$`
    );
    const sysFileReX = new RegExp(`${config.ignoreSystemFileNames.join('|')}`);
    if (sysFileReX.test(fileName)) {
        return false;
    }
    if (!fileNameRegX.test(fileName)) {
        return false;
    }
    return true;
}
describe('checkFileName', () => {
    test('Name should be pass', () => {
        expect(
            checkFileName(
                '20211208181628982_AI7514MP_VEHICLE_DETECTION_BACKGROUND'
            )
        ).toBe(true);
    });
    test('Name with dif event name should be pass', () => {
        expect(
            checkFileName('20211208181628982_AI7514MP_VEHICLE_DETECTION')
        ).toBe(true);
    });
    test('Wrong file name - false', () => {
        expect(checkFileName('20211208181628982')).toBe(false);
    });
    test('Bad time format - false', () => {
        expect(
            checkFileName(
                '120211208181628982_AI7514MP_VEHICLE_DETECTION_BACKGROUND'
            )
        ).toBe(false);
    });

    test('Plate number format - false', () => {
        expect(
            checkFileName(
                '20211208181628982_AI75EERERR14MP_VEHICLE_DETECTION_BACKGROUND'
            )
        ).toBe(false);
    });
    test('Sys file "PLATE" - false', () => {
        expect(
            checkFileName('20211218104351959_CA0789OB_VEHICLE_DETECTION_PLATE')
        ).toBe(false);
    });
    test('Sys file "noPlate" - false', () => {
        expect(
            checkFileName('20211117181010654_noPlate_VEHICLE_DETECTION')
        ).toBe(false);
    });
});
