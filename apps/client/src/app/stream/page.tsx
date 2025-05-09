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

        // code to handle transport connection and media stream
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
