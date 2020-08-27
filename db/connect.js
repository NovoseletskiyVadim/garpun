const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const CONNECTION_STRING = process.env.DB;

module.exports = {
  /*
   * Mongo Utility: Connect to client */

  clientConnect: async () =>
    (client = await (() =>
      new Promise((resolve, reject) =>
        MongoClient.connect(
          CONNECTION_STRING,
          {
            useUnifiedTopology: true,
          },
          (err, client) => {
            assert.equal(null, err);
            resolve(client);
          }
        )
      ))()),

  /*
   * Mongo Utility: Close client */

  clientClose: async (client) => {
    client.close();
    return true;
  },
};
