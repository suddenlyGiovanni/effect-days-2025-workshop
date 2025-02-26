import { NodeRuntime } from "@effect/platform-node"
import { Effect, FiberSet, Stream } from "effect"
import express from "express"
import { OpenAi } from "../shared/OpenAi.js"

// TODO: Effect-ify express, and add OpenAi completion route

const app = express()

app.get("/", (_req, res) => {
  res.json({ message: "Hello, World!" })
})

app.listen(3000, () => {
  console.log("Listening on port 3000")
})
