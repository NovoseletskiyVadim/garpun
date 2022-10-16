const expect = require('chai').expect;
require('dotenv').config({ path: '../../.env' });
const { setLogMessage, botIcons } = require('../../src/utils/logger/appLogger');

const logTypes = require('../../src/utils/logger/appLogger');

// describe('Test app logger', () => {
//   describe('Test api state alarm', () => {
//     it('alarm should sent', (done) => {
//       const apiRes = {
//         statusCode: 500,
//         statusMessage: 'Test msg',
//       };
//       apiLogger.apiState(apiRes);
//     });
//   });
// });
setLogMessage(botIcons.CAMERA_OFFLINE).error().botMessage(botIcons.CAMERA_OFFLINE);
