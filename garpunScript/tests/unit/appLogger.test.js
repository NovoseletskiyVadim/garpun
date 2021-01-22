const expect = require('chai').expect;

require('dotenv').config({ path: '../../.env' });
const apiLogger = require('../../utils/logger/appLogger');
const logTypes = require('./../../utils/logger/logTypes');

describe('Test app logger', () => {
  describe('Test api state alarm', () => {
    it('alarm should sent', (done) => {
      const apiRes = {
        statusCode: 500,
        statusMessage: 'Test msg',
      };
      apiLogger.apiState(apiRes);
    });
  });
});
