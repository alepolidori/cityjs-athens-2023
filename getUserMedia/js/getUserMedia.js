(async function main() {
  
  // define media constraints
  const constraints = { video: true, audio: false }
  
  // get the media stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  
  // get HTML video element
  const video = document.getElementById('video')

  // attach the media stream to the HTML video element
  video.srcObject = stream

})()