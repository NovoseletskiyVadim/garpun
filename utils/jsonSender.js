'use strict';
const url = require('url');
const axios = require('axios');
var ObjectId = require('mongodb').ObjectId;
const { clientConnect, clientClose } = require('../db/connect');
const logger = require('./logger');
module.exports = (eventData) => {
  const { cameraName, fileName } = eventData;
  if (fileName) {
    const [time, plateNumber, ...rest] = fileName.split('_');
    let eventName = rest.join('_');
    if (eventName === `VEHICLE_DETECTION`) {
      clientConnect().then((connect) => {
        const db = connect.db('my-database');
        db.collection('events')
          .findOne({ name: fileName, device: cameraName })
          .then((doc) => {
            if (!doc) {
              db.collection('events')
                .insertOne({
                  name: fileName,
                  device: cameraName,
                })
                .then((doc) => {
                  const params = new url.URLSearchParams({ foo: 'bar' });
                  axios
                    .post(process.env.API_SERVER, params.toString())
                    .then((res) => {
                      let update = {};
                      if (res.status === 200) {
                        update = { $set: { api_res: res.data } };
                      } else {
                        update = { $push: { api_res: { status: 'ERROR' } } };
                      }
                      db.collection('events')
                        .findOneAndUpdate(
                          { _id: ObjectId(doc.ops[0]._id) },
                          update
                        )
                        .then((doc) => {
                          if (doc) {
                            console.log(doc.value);
                          } else {
                            console.log(
                              'No document matches the provided query.'
                            );
                          }
                          clientClose(connect);
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    });
                  // logger.saveDetectEvent({
                  //   id: doc.ops[0]._id,
                  //   cameraName,
                  //   time,
                  //   fileName,
                  //   plateNumber,
                  //   eventName,
                  // });
                });
            }
          });
      });
    } else {
      logger.saveErrorEvent({ message: 'wrong event name' + ' ' + eventName });
      console.log('wrong event name');
    }
  }
};
