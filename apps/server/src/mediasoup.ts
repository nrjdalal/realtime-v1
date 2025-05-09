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
