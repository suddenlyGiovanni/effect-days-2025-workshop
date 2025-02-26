import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"

export const TracingLayer = NodeSdk.layer(() => ({
  resource: {
    serviceName: "effect-days-25"
  },
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" })
  )
}))
