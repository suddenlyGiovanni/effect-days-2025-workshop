import { NodeRuntime } from "@effect/platform-node"
import { Layer } from "effect"
import { HttpLayer } from "./Http.js"
import { TracingLayer } from "./Tracing.js"

HttpLayer.pipe(
  Layer.provide(TracingLayer),
  Layer.launch,
  NodeRuntime.runMain
)
