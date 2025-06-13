import * as OtlpTracer from "@effect/opentelemetry/OtlpTracer"
import * as Resource from "@effect/opentelemetry/Resource"
import { NodeHttpClient } from "@effect/platform-node"
import { Layer } from "effect"

const ResourceLayer = Resource.layer({
  serviceName: "effect-days-25"
})

export const TracingLayer = OtlpTracer.layer({
  url: "http://localhost:4318/v1/traces"
}).pipe(
  Layer.provide([ResourceLayer, NodeHttpClient.layerUndici])
)
