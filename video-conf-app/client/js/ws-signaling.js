'use strict';

let socket;

function initWebSocket() {

  socket = io.connect();

  socket.on('setRole', data => {
    console.log('recv "setRole":', data);
    const evt = new CustomEvent('message', { detail: { cmd: 'setRole', data: data.role }})
    document.dispatchEvent(evt)
  });

  socket.on('descriptionOffer', data => {
    console.log('recv "descriptionOffer" from other peer:', data);
    const evt = new CustomEvent('message', { detail: { cmd: 'descriptionOffer', data: data }})
    document.dispatchEvent(evt)
  });

  socket.on('descriptionAnswer', data => {
    console.log('recv "descriptionAnswer":', data);
    const evt = new CustomEvent('message', { detail: { cmd: 'descriptionAnswer', data: data }})
    document.dispatchEvent(evt)
  });

  socket.on('iceCandidate', data => {
    console.log('recv "iceCandidate":', data);
    const evt = new CustomEvent('message', { detail: { cmd: 'iceCandidate', data: data }})
    document.dispatchEvent(evt)
  });

  const evt = new CustomEvent('message', { detail: { cmd: 'connected' }})
  document.dispatchEvent(evt)
}

document.addEventListener('DOMContentLoaded', () => {
  initWebSocket()
  document.addEventListener('message', (event) => {
    if (event.detail.cmd === 'send') {
      socket.emit(event.detail.msg.evt, event.detail.msg);
      console.log('send ', event.detail.msg);
    }
  });
});