/**
 * @author: Alessandro Polidori
 */
'use strict'

const fs = require('fs')
const https = require('https')
const socketIO = require('socket.io')
const nodeStatic = require('node-static')
const PORT = process.argv[2] || 443
const peers = {
  creator: null,
  participant: null,
}
let io

const options = {
  key: fs.readFileSync(process.cwd() + '/server/key.pem'),
  cert: fs.readFileSync(process.cwd() + '/server/cert.pem'),
}

const fileServer = new nodeStatic.Server()
const serverHttp = https.createServer(options, (req, res) => {
  fileServer.serve(req, res)
})
io = socketIO(serverHttp)

io.on('connection', (socket) => {
  console.log('new ws connection', socket.id)

  // manage the roles of the peers
  socket.on('getRole', (data) => {
    console.log('recv "getRole"')
    let role
    if (!peers.creator) {
      role = 'creator'
      peers.creator = socket
    } else if (!peers.participant) {
      role = 'participant'
      peers.participant = socket
    } else {
      role = 'denied'
    }
    socket.role = role
    socket.emit('setRole', { role: role })
    console.log(`send "setRole": ${role}`)
  })

  // manages the offer
  socket.on('descriptionOffer', (data) => {
    console.log(`recv "descriptionOffer": "${data.description.type}" from "${socket.role}" "${socket.id}"`)
    let recipientSocket
    if (socket.role === 'participant') {
      recipientSocket = peers.creator
    } else {
      recipientSocket = peers.participant
    }
    if (recipientSocket) {
      io.to(recipientSocket.id).emit('descriptionOffer', data)
      console.log(`send "descriptionOffer" to "${recipientSocket.role}" socket id "${recipientSocket.id}"`)
    }
  })

  // manages an ice candidate
  socket.on('iceCandidate', (data) => {
    console.log(`recv "iceCandidate" from "${socket.role}" socket id "${socket.id}"`)
    let recipientSocket
    if (socket.role === 'participant') {
      recipientSocket = peers.creator
    } else {
      recipientSocket = peers.participant
    }
    if (recipientSocket) {
      io.to(recipientSocket.id).emit('iceCandidate', data)
      console.log(`send "iceCandidate" to "${recipientSocket.role}" socket id "${recipientSocket.id}"`)
    }
  })

  // manages the answer
  socket.on('descriptionAnswer', (data) => {
    console.log(`recv "descriptionAnswer": "${data.description.type}" from "${socket.role}" "${socket.id}"`)
    let recipientSocket
    if (socket.role === 'participant') {
      recipientSocket = peers.creator
    } else {
      recipientSocket = peers.participant
    }
    if (recipientSocket) {
      io.to(recipientSocket.id).emit('descriptionAnswer', data)
      console.log(`send "descriptionAnswer" to "${recipientSocket.role}" socket id "${recipientSocket.id}"`)
    }
  })

  // manages a client websocket disconnection
  socket.on('disconnect', () => {
    console.log('evt disconnect ' + socket.id)
    if (socket.role === 'creator') {
      peers.creator = null
    } else if (socket.role === 'participant') {
      peers.participant = null
    }
  })
})

serverHttp.listen(PORT, () => {
  console.log('listening on', PORT)
})
