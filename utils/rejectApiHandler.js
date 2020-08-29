const { CamEvent, PendingList } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');

process.send('rejectApiHandler ok');

let interval = 1000;
setInterval(() => {
  PendingList.findAll({ limit: 10 }).then((list) => {
    if (list.length === 0) {
      interval = 1000;
    }
    const requests = list.map((item) => {
      return jsonSender(item.data).then((result) => {
        PendingList.destroy({
          where: {
            id: item.id,
          },
        });
        console.log(result);
        // let eventData = {
        //   uuid: item.data.device.event.id,
        //   time: item.data.device.event.datetime,
        //   license_plate_number: item.data.device.event.plateNumber,
        //   camera: cameraName,
        // };
        // if (result) {
        //   eventData.uploaded = true;
        // }
        // CamEvent.create(eventData);
      });
    });

    Promise.all(requests).catch((e) => {
      interval * 1.5;
    });
    process.send('Pending ' + list.length);
  });
}, interval);
