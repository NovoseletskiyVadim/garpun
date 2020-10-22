'use strict';
const socket = io('ws://10.15.1.235:8888');
// const socket = io('ws://localhost:8888');
const eventListWrapper = document.getElementById('events-monitor');

const showBigImg = (target) => {
  const docBody = document.body;
  const popupWrapper = document.createElement('div');
  popupWrapper.classList.add('popup-wrapper');
  const img = document.createElement('IMG');
  img.classList.add('popup-img');
  img.setAttribute('src', target);
  img.setAttribute('alt', '');
  popupWrapper.appendChild(img);
  docBody.appendChild(popupWrapper);
  img.addEventListener('click', () => {
    popupWrapper.remove();
  });
};

const hoverMsg = (message, TYPE) => {
  const hoverBox = document.createElement('ul');
  hoverBox.classList.add('hoverMsg');
  switch (TYPE) {
    case 'ERROR':
      hoverBox.classList.add('hoverMsg-danger');
      break;
    case 'WARNING':
      hoverBox.classList.add('hoverMsg-warning');
      break;
    default:
      hoverBox.classList.add('hoverMsg-success');
      break;
  }
  message.forEach((msg) => {
    const msgText = document.createElement('li');
    msgText.textContent = msg;
    hoverBox.appendChild(msgText);
  });
  return hoverBox;
};

socket.on('connect', () => {
  socket.emit('setCamerasFilter', ['Cherk_park_50']);
});

socket.on('cam-status', (msg) => {
  console.log(msg);
});

socket.on('get-event', (msg) => {
  const eventWrapper = document.createElement('li');
  eventWrapper.classList.add('event-wrap');
  eventWrapper.classList.add('event-one');
  Object.keys(msg).forEach((key) => {
    if (key === 'uuid') {
      eventWrapper.setAttribute('uuid', msg.uuid);
    }
    if (key !== 'uuid') {
      const cell = document.createElement('div');
      switch (key) {
        case 'isErrors':
          cell.classList.add('event-msg');
          if (msg.isErrors.length > 0) {
            eventWrapper.appendChild(hoverMsg(msg.isErrors, 'ERROR'));
            eventWrapper.classList.add('with-error');
            cell.textContent = 'FILE_ERR';
          } else {
            cell.innerHTML = '&#9203;';
          }
          break;
        case 'filePath':
          cell.classList.add('event-img');
          if (msg.filePath) {
            const img = document.createElement('IMG');
            img.setAttribute('src', msg.filePath);
            img.setAttribute('alt', '');
            img.addEventListener('click', (e) => {
              showBigImg(msg.filePath);
            });
            cell.appendChild(img);
          } else {
            cell.classList.add('hoverMsg-danger');
            cell.textContent = 'FILE NOT IMG';
          }

          break;
        case 'plateNumber':
          cell.classList.add('event-fileName');
          cell.textContent = msg[key];
          break;
        case 'cameraName':
          cell.classList.add('event-camera');
          cell.textContent = msg[key];
          break;
        case 'eventTime':
          cell.classList.add('event-time');
          cell.textContent = msg.eventTime;
        default:
          break;
      }
      eventWrapper.appendChild(cell);
    }
  });
  const childNodes = eventListWrapper.childNodes;
  if (childNodes.length === 1) {
    eventListWrapper.appendChild(eventWrapper);
  } else {
    eventListWrapper.insertBefore(eventWrapper, childNodes[1]);
  }
});

socket.on('api-res', (msg) => {
  const { apiRes, uuid: eventID } = msg;
  const event = document.querySelector(`[uuid='${msg.uuid}']`);
  const status = apiRes.status;
  let apiMsg = '';
  let isApiError = false;
  if (status !== 'OK') {
    isApiError = true;
    event.classList.add('with-error');
    if (apiRes.statusCode && apiRes.statusCode > 0) {
      apiMsg = 'API ' + apiRes.statusCode;
    } else {
      apiMsg = 'API NO CODE ERROR';
    }
  } else {
    event.classList.remove('with-error');
    apiMsg = status;
  }
  event.appendChild(hoverMsg([JSON.stringify(apiRes)], isApiError && 'ERROR'));
  const eventMsg = event.querySelector('.event-msg');
  eventMsg.textContent = apiMsg;
});

const camFiler = document.querySelector('.cam-filter');
const camsSelectors = camFiler.getElementsByTagName('input');
Array.from(camsSelectors).forEach(function (item) {
  item.addEventListener('change', (e) => {
    console.log(e.target.name, e.target.checked);
  });
});
console.log(camsSelectors);
