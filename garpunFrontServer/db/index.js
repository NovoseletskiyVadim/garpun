require('dotenv').config();

const Sequelize = require('sequelize');

const self = module.exports;
let sequelize;

/**
 * Construct a singleton sequelize object to query the database
 *
 * @returns {object} - Sequelize object
 */
exports.initialize = () => {
  if (!sequelize) {
    return new Sequelize('database', 'username', 'password', {
      dialect: 'sqlite',
      storage: './../garpunScript/db/garpun.db',
      logging: false, // Disables logging
    });
  }
  return sequelize;
};

module.exports = self.initialize();
