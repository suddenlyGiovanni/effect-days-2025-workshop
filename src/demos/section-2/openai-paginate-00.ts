import { NodeRuntime } from "@effect/platform-node"
import { Chunk, Config, Effect, Layer, Option, Redacted, Schema, Stream } from "effect"
import * as Api from "openai"
import type { AbstractPage, PagePromise } from "openai/core.mjs"
import { TracingLayer } from "../../Tracing.js"

export class OpenAi extends Effect.Service<OpenAi>()("OpenAi", {
  effect: Effect.gen(function*() {
    const client = new Api.OpenAI({
      apiKey: Redacted.value(yield* Config.redacted("OPENAI_API_KEY"))
    })

    const use = Effect.fn("OpenAI.use")(<A>(
      f: (client: Api.OpenAI, signal: AbortSignal) => Promise<A>
    ): Effect.Effect<A, OpenAiError> =>
      Effect.tryPromise({
        try: (signal) => f(client, signal),
        catch: (cause) => new OpenAiError({ cause })
      })
    )

    // TODO: Add paginate method
    // We want to wrap the PagePromise type from OpenAI

    return {
      client,
      use
    } as const
  })
}) {}

export class OpenAiError extends Schema.TaggedError<OpenAiError>()("OpenAiError", {
  cause: Schema.Defect
}) {}

// usage

Effect.gen(function*() {
  const openai = yield* OpenAi

  yield* openai.paginate((client) => client.chat.completions.list({ query: { limit: 5 } })).pipe(
    Stream.runForEach(Effect.log)
  )
}).pipe(
  Effect.provide(OpenAi.Default.pipe(
    Layer.provideMerge(TracingLayer)
  )),
  NodeRuntime.runMain
)
