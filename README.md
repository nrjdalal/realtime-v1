## How to run the project?

1. Clone the repository.

```sh
pnpx gitpick https://github.com/nrjdalal/realtime-v1
```

2. Install dependencies, rebuild binaries and run the server.

```sh
pnpm install
npm rebuild mediasoup
pnpm run dev
```

- Visit `http://localhost:3000/stream` to access/test the streaming client.

> [!NOTE]
> Make sure to rebuild the `mediasoup` package using `npm` instead of `pnpm`.

## What to do? Search via `TODO:` in the code.

apps/client/src/app/stream/page.tsx

```tsx
"use client"

import { useEffect, useRef, useState } from "react"

import { Mic, MicOff, Monitor, MonitorOff, Play, Square, Video, VideoOff } from "lucide-react"
import { io, Socket } from "socket.io-client"

import { cn } from "@/lib/utils"
import { useWindowSize } from "@/hooks/use-window-size"
import { Toggle } from "@/components/ui/toggle"
import { StreamTimer } from "@/components/stream-timer"

export default function Page() {
  const { resize } = useWindowSize()

  const [audioToggle, setAudioToggle] = useState(false)
  const [videoToggle, setVideoToggle] = useState(false)
  const [shareToggle, setShareToggle] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  const combinedStreamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stream = new MediaStream()
    combinedStreamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [])

  useEffect(() => {
    if (isStreaming) {
      const socket = io("http://localhost:3001")
      socketRef.current = socket

      socket.on("connect", () => console.log(`Socket connected: ${socket.id}!`))

      socket.emit("handshake", { time: Date.now() })

      socket.on("handshake-acknowledged", async (data) => {
        console.log("Received handshake acknowledgment:", data)

        /*
        TODO:
        1. Create a transport using the transport options received from the server.
        2. Connect the transport using the dtls parameters received from the server.
        3. Create a producer for the audio and video tracks and send them to the server.
        */
      })
    } else {
      socketRef.current?.disconnect()
      socketRef.current = null
    }

    return () => {
      socketRef.current?.disconnect()
    }
  }, [isStreaming])

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-white p-3">
      <div
        className={cn("relative aspect-video rounded-lg", resize ? "h-full" : "w-full", "bg-black")}
      >
        <StreamTimer isActive={isStreaming} />

        {isStreaming && !videoToggle && !shareToggle && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-white">Stream will begin shortly!</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <div className="*:[&[data-state=off]]:!bg-border flex items-center gap-3 *:size-12 *:cursor-pointer *:border-2 [&_svg]:!size-5 [&_svg]:text-white">
            <Toggle
              aria-label="Audio"
              pressed={audioToggle}
              onPressedChange={async (enabled) => {
                const stream = combinedStreamRef.current!
                if (enabled) {
                  try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
                    const audioTrack = audioStream.getAudioTracks()[0]
                    stream.addTrack(audioTrack)
                    setAudioToggle(true)
                  } catch (err) {
                    console.warn("Failed to start audio!", err)
                    setAudioToggle(false)
                  }
                } else {
                  stream.getAudioTracks().forEach((t) => {
                    stream.removeTrack(t)
                    t.stop()
                  })
                  setAudioToggle(false)
                }
              }}
            >
              {audioToggle ? <Mic className="!text-green-500" /> : <MicOff />}
            </Toggle>

            <Toggle
              aria-label="Video"
              pressed={videoToggle}
              onPressedChange={async (enabled) => {
                const stream = combinedStreamRef.current!
                if (enabled) {
                  try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
                    const videoTrack = videoStream.getVideoTracks()[0]
                    stream.addTrack(videoTrack)
                    setVideoToggle(true)
                  } catch (err) {
                    console.warn("Failed to start video!", err)
                    setVideoToggle(false)
                  }
                } else {
                  stream
                    .getVideoTracks()
                    .filter((t) => !t.label.toLowerCase().includes("screen"))
                    .forEach((t) => {
                      stream.removeTrack(t)
                      t.stop()
                    })
                  setVideoToggle(false)
                }
              }}
            >
              {videoToggle ? <Video className="!text-green-500" /> : <VideoOff />}
            </Toggle>

            <Toggle
              aria-label="Screen"
              pressed={shareToggle}
              onPressedChange={async (enabled) => {
                const stream = combinedStreamRef.current!
                if (enabled) {
                  try {
                    const shareStream = await navigator.mediaDevices.getDisplayMedia({
                      video: true,
                    })
                    const shareTrack = shareStream.getVideoTracks()[0]
                    shareTrack.onended = () => {
                      stream
                        .getTracks()
                        .filter((t) => t.id === shareTrack.id)
                        .forEach((t) => {
                          stream.removeTrack(t)
                          t.stop()
                        })
                      setShareToggle(false)
                    }
                    stream.addTrack(shareTrack)
                    setShareToggle(true)
                  } catch (err) {
                    console.warn("Failed to start screen share!", err)
                    setShareToggle(false)
                  }
                } else {
                  stream
                    .getVideoTracks()
                    .filter((t) => t.label.toLowerCase().includes("screen"))
                    .forEach((t) => {
                      stream.removeTrack(t)
                      t.stop()
                    })
                  setShareToggle(false)
                }
              }}
            >
              {shareToggle ? <Monitor className="!text-green-500" /> : <MonitorOff />}
            </Toggle>

            <Toggle
              className="ml-3"
              aria-label="Play"
              pressed={isStreaming}
              onPressedChange={() => {
                const enabled = !isStreaming
                setIsStreaming(enabled)
                if (enabled) {
                  socketRef.current?.emit("handshake", { time: Date.now() })
                }
              }}
            >
              {isStreaming ? <Square className="!text-red-500" /> : <Play />}
            </Toggle>
          </div>
        </div>
      </div>
    </main>
  )
}
```

app/server/index.ts

```ts
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

      /*
      TODO:
      1. Wait for the client to connect the transport using the dtls parameters.
      2. Once the client connects the transport, create producers for the audio and video tracks.
      3. From the producers, transcode the media to HLS and send it to the consumers.
      */
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
```

app/server/mediasoup.ts

```ts
import * as mediasoup from "mediasoup"

const workerSettings = {
  logLevel: "warn" as mediasoup.types.WorkerLogLevel,
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
}

const routerOptions = {
  mediaCodecs: [
    {
      kind: "audio" as mediasoup.types.MediaKind,
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video" as mediasoup.types.MediaKind,
      mimeType: "video/VP8",
      clockRate: 90000,
    },
  ],
}

let worker: mediasoup.types.Worker
let router: mediasoup.types.Router

const createWorker = async () => {
  worker = await mediasoup.createWorker(workerSettings)
  worker.on("died", () => {
    console.error("MediaSoup worker has died!")
  })
  router = await worker.createRouter({ mediaCodecs: routerOptions.mediaCodecs })
}

export { createWorker, worker, router }
```
