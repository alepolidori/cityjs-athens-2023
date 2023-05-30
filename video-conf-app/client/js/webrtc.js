'use strict'

let pc
let role
let localStream, remoteStream

const pcConfig = {
  'iceServers': [
    { 'urls': 'stun:stun.l.google.com:19302' },
  ]
}

const constraints = {
  mandatory: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  }
}

document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('message', (event) => {
    const cmd = event.detail.cmd
    const data = event.detail.data

    if (cmd === 'setRole') {
      role = data
      console.log(`set role to "${role}"`)
      if (role === 'participant') {
        initLocalMedia(createPc)
      } else if (role === 'creator') {
        initLocalMedia()
      }
    }
    else if (cmd === 'descriptionOffer') {
      output('[SIGNALING]: received "descriptionOffer"')
      if (!pc) {
        // create a new peer connection for the received offer
        pc = createPeerConnection()
        // add local stream to the created peer connection
        const tracks = localStream.getTracks()
        tracks.forEach(track => {
          pc.addTrack(track, localStream)
        })
        output('attached local stream to the new peer connection')
      }
      output('set remote description')

      pc.setRemoteDescription(new RTCSessionDescription(data.description))
        .then(setRemoteDescriptionCb)
        .catch(printError)

      output('creating answer')
      pc.createAnswer(constraints)
        .then(createAnswerCb)
        .catch(printError)
    }
    else if (cmd === 'descriptionAnswer') {
      output('[SIGNALING]: received "descriptionAnswer"')

      output('set remote description')
      pc.setRemoteDescription(new RTCSessionDescription(data.description))
      .then(setRemoteDescriptionCb)
      .catch(printError)
    }
    else if (cmd === 'iceCandidate') {
      output('[SIGNALING]: received "iceCandidate"')
      // attach the new ice candidate to the corresponding peer connection
      let iceCandidate = new RTCIceCandidate({
        sdpMLineIndex: data.sdpMLineIndex,
        candidate: data.iceCandidate
      })
      pc.addIceCandidate(iceCandidate)
      output('added new iceCandidate to pc')
    }
  })
})

function initLocalMedia(cb) {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })
  .then(stream => {
    gotLocalMedia(stream)
    if (cb) { cb(); }
  })
  .catch(err => {
    alert(err)
  })
}

function gotLocalMedia(stream) {
  output('got local media stream: attach it (stream id: ' + stream.id + ')')
  localStream = stream
  const evt = new CustomEvent('message', { detail: { cmd: 'gotLocalMedia', data: localStream }})
  document.dispatchEvent(evt)
}

function output(msg, obj) {
  if (obj) {
    console.log(msg, obj)
  } else {
    console.log(msg)
  }
  const str = msg + (obj ? JSON.stringify(obj, null, 2) : '')
  const evt = new CustomEvent('message', { detail: { cmd: 'output', data: str }})
  document.dispatchEvent(evt)
}

function createPc() {
  output('creating new peer connection')
  pc = createPeerConnection()
  // add local stream to the created peer connection
  const tracks = localStream.getTracks()
  tracks.forEach(track => {
    pc.addTrack(track, localStream)
  })
  output('attached local stream to the peer connection')
  createOffer()
}

function createPeerConnection() {
  let pc = new RTCPeerConnection(pcConfig)
  output('created new peer connection')
  pc.onicecandidate = iceCandidateCb
  pc.oniceconnectionstatechange = iceConnectionStateChangeCb
  pc.onicegatheringstatechange = iceGatheringStateChangeCb
  pc.onnegotiationneeded = () => { output('negotiation needed'); }
  pc.ontrack = addTrackCb
  output('attached event listeners to the peer connection')
  return pc
}

function createOffer() {
  output(`creating offer`)
  // create an offer for the peer connection and send it to the other peer
  pc.createOffer(constraints)
    .then(createOfferCb)
    .catch(printError)
}

function createOfferCb(descr) {
  output(`created offer:`)
  output(`"type": ${descr.type}`)
  output(`"sdp": ${descr.sdp}`)

  pc.setLocalDescription(descr)
    .then(() => {
      setLocalDescrOfferCb(descr)
    })
    .catch(printError)
}

function setLocalDescrOfferCb(descr) {
  output(`set local description (offer) to pc complete`)
  // send description offer to the other peer
  let data = {
    evt: 'descriptionOffer',
    description: descr
  }
  const evt = new CustomEvent('message', { detail: { cmd: 'send', msg: data }})
  document.dispatchEvent(evt)
}

let extractSdp = function(sdpLine, pattern) {
  let result = sdpLine.match(pattern)
  return (result && result.length == 2)? result[1]: null
}

function setRemoteDescriptionCb() {
  output('set remote description to pc complete')
}


function createAnswerCb(descr) {
  output('created answer')
  // set local description answer to the peer connection
  pc.setLocalDescription(descr)
    .then(() => {
      output('set local description (answer) to pc complete')
    })
    .catch(printError)
  
  let data = {
    evt: 'descriptionAnswer',
    description: descr
  }
  const evt = new CustomEvent('message', { detail: { cmd: 'send', msg: data }})
  document.dispatchEvent(evt)
}

function iceCandidateCb(event) {
  if (event.candidate) {
    let data = {
      evt: 'iceCandidate',
      iceCandidate: event.candidate.candidate,
      sdpMLineIndex: event.candidate.sdpMLineIndex,
      sdpMid: event.candidate.sdpMid
    }
    const evt = new CustomEvent('message', { detail: { cmd: 'send', msg: data }})
    document.dispatchEvent(evt)
    output('new "iceCandidate":', data)
  } else {
    output('end of candidate')
  }
}

function iceConnectionStateChangeCb(event) {
  output('new "iceConnectionStateChange":', {
    connectionState: event.currentTarget.connectionState,
    iceConnectionState: event.currentTarget.iceConnectionState,
    iceGatheringState: event.currentTarget.iceGatheringState
  })
}

function iceGatheringStateChangeCb(event) {
  output('new "iceGatheringStateChange":', {
    connectionState: event.currentTarget.connectionState,
    iceConnectionState: event.currentTarget.iceConnectionState,
    iceGatheringState: event.currentTarget.iceGatheringState
  })
}

function addTrackCb(event) {
  // output(`"addStream" id ${event.stream.id}:`)
  remoteStream = event.streams[0]
  const evt = new CustomEvent('message', { detail: { cmd: 'addStream', data: event.streams[0] }})
  document.dispatchEvent(evt)
}

