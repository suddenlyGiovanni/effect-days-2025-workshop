import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Config, Effect, Layer, Redacted } from "effect"

export const TracingLayer = Layer.unwrapEffect(
  Effect.gen(function*() {
    const { apiKey, dataset } = yield* Config.all({
      apiKey: Config.option(Config.redacted("API_KEY")),
      dataset: Config.string("DATASET").pipe(Config.withDefault(
        "effect-pun-api"
      ))
    }).pipe(Config.nested("HONEYCOMB"))
    if (apiKey._tag === "None") {
      const endpoint = yield* Config.option(
        Config.string("OTEL_EXPORTER_OTLP_ENDPOINT")
      )
      if (endpoint._tag === "None") {
        return Layer.empty
      }
      return NodeSdk.layer(() => ({
        resource: {
          serviceName: dataset
        },
        spanProcessor: new BatchSpanProcessor(
          new OTLPTraceExporter({ url: `${endpoint.value}/v1/traces` })
        )
      }))
    }

    const headers = {
      "X-Honeycomb-Team": Redacted.value(apiKey.value),
      "X-Honeycomb-Dataset": dataset
    }

    return NodeSdk.layer(() => ({
      resource: {
        serviceName: dataset
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "https://api.honeycomb.io/v1/traces",
          headers
        })
      )
    }))
  })
)
