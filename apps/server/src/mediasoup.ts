import * as mediasoup from "mediasoup"

import config from "@/config"

let worker: mediasoup.types.Worker
let router: mediasoup.types.Router

const createWorker = async () => {
  worker = await mediasoup.createWorker(config.mediasoup.worker)
  worker.on("died", () => {
    console.error("MediaSoup worker has died!")
  })
  router = await worker.createRouter(config.mediasoup.router)
}

export { createWorker, router }
