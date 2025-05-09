import http from "http"
import { createWorker, router } from "@/mediasoup"
import express from "express"
import { Server } from "socket.io"

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

app.get("/", (_, res) => {
  res.json({ message: "Streaming server is up!" })
})

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}!`)
  socket.on("handshake", async (data) => {
    console.log("Received handshake request:", data)

    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      })

      socket.emit("handshake-acknowledged", {
        time: Date.now(),
        routerRtpCapabilities: router.rtpCapabilities,
        transportOptions: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      })

      // code to handle transport connection and media stream
    } catch (error) {
      console.error("Error creating transport:", error)
      socket.emit("handshake-error", { error: "Failed to create transport." })
      return
    }
  })
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, async () => {
  await createWorker()
  console.log(`Server listening on port http://localhost:${PORT}`)
})
