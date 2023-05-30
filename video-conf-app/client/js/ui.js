'use strict'

let startBtn
let outputArea
let localVideo, remoteVideo
let bpsArea, packetArea

function printError(err) {
  console.error(err)
}

function init() {
  localVideo = document.getElementById('local-video')
  remoteVideo = document.getElementById('remote-video')
  startBtn = document.getElementById('start-btn')

  startBtn.addEventListener('click', () => {
    let data = { evt: 'getRole' }
    const evt = new CustomEvent('message', {
      detail: { cmd: 'send', msg: data },
    })
    document.dispatchEvent(evt)
  })
}

document.addEventListener('DOMContentLoaded', (event) => {
  init()
  document.addEventListener('message', (event) => {
    const cmd = event.detail.cmd
    const data = event.detail.data
    if (cmd === 'connected') {
      startBtn.disabled = false
    } else if (cmd ==='gotLocalMedia') {
      // user has received local media stream
      localVideo.srcObject = data
      console.log('local stream attached')
    } else if (cmd === 'setRole' && data === 'denied') {
      // maximum number of participants has been reached
      alert('Sorry: maximum number of participants has been reached!')
    } else if (cmd === 'addStream') {
      // user has received remote media stram
      remoteVideo.srcObject = remoteStream
      console.log('remote stream attached')
    }
  })
})
