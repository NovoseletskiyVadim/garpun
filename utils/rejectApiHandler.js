const { CamEvent, PendingList } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');

process.send('rejectApiHandler ok');

let interval = 5000;

let calc = 0;
const resend = () => {
  PendingList.findAll({ limit: 10 }).then((list) => {
    calc += list.length;
    process.send('Pending events' + list.length);
    if (list.length === 0) {
      interval = 5000;
    }
    const requests = list.map((item) => {
      return jsonSender(item.data).then((result) => {
        calc--;
        PendingList.destroy({
          where: {
            id: item.id,
          },
        });
        console.log('event sent ' + result);
        // TODO save successfully sent event
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
    if (requests.length > 0) {
      Promise.all(requests)
        .then((result) => {
          interval = 5000;
        })
        .catch((e) => {
          interval *= 2;
        });
    }
  });
  console.log(calc);
  process.send('Pending_interval' + interval);
  setTimeout(() => {
    if (interval < 100000) {
      resend();
    } else {
      interval = 5000;
      resend();
    }
  }, interval);
};

setTimeout(() => {
  resend();
}, interval);
