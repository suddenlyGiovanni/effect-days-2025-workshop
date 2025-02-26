import { NodeRuntime } from "@effect/platform-node"
import { Config, Effect, Layer, Redacted } from "effect"
import * as Api from "openai"
import { TracingLayer } from "../../Tracing.js"

export class OpenAi extends Effect.Service<OpenAi>()("OpenAi", {
  effect: Effect.gen(function*() {
    // TODO: Implement `use` method
    return {} as const
  })
}) {}

// usage

Effect.gen(function*() {
  const openai = yield* OpenAi

  const result = yield* openai.use((client, signal) =>
    client.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: "What is the meaning of life?"
      }]
    }, { signal })
  )

  yield* Effect.log(result.choices)
}).pipe(
  Effect.provide(OpenAi.Default.pipe(
    Layer.provideMerge(TracingLayer)
  )),
  NodeRuntime.runMain
)
