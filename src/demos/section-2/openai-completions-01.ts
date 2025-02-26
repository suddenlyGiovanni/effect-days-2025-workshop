import { NodeRuntime } from "@effect/platform-node"
import { Chunk, Config, Effect, Layer, Option, Redacted, Schema, Stream } from "effect"
import * as Api from "openai"
import type { AbstractPage, PagePromise } from "openai/core.mjs"
import type * as ApiStreaming from "openai/streaming.mjs"
import { TracingLayer } from "../../Tracing.js"

export class OpenAi extends Effect.Service<OpenAi>()("OpenAi", {
  effect: Effect.gen(function*() {
    const client = new Api.OpenAI({
      apiKey: Redacted.value(yield* Config.redacted("OPENAI_API_KEY"))
    })

    const use = Effect.fn("OpenAi.use")(<A>(
      f: (client: Api.OpenAI, signal: AbortSignal) => Promise<A>
    ): Effect.Effect<A, OpenAiError> =>
      Effect.tryPromise({
        try: (signal) => f(client, signal),
        catch: (cause) => new OpenAiError({ cause })
      })
    )

    const paginate = <Page extends AbstractPage<any>, A>(
      f: (client: Api.OpenAI) => PagePromise<Page, A>
    ): Stream.Stream<A, OpenAiError> =>
      Stream.paginateChunkEffect(
        undefined,
        Effect.fn("OpenAi.paginateChunk")(function*(cursor: Page | undefined) {
          const page = yield* Effect.tryPromise({
            try: () => cursor ? cursor.getNextPage() : f(client),
            catch: (cause) => new OpenAiError({ cause })
          })
          return [
            Chunk.unsafeFromArray(page.getPaginatedItems()),
            page.hasNextPage() ? Option.some(page) : Option.none()
          ]
        })
      ).pipe(
        Stream.withSpan("OpenAi.paginate")
      )

    const stream = <A>(
      f: (client: Api.OpenAI, signal: AbortSignal) => Promise<ApiStreaming.Stream<A>>
    ): Stream.Stream<A, OpenAiError> =>
      Effect.tryPromise({
        try: (signal) => f(client, signal),
        catch: (cause) => new OpenAiError({ cause })
      }).pipe(
        Effect.map((stream) =>
          Stream.fromAsyncIterable(stream, (cause) => new OpenAiError({ cause })).pipe(
            Stream.ensuring(Effect.sync(() => stream.controller.abort()))
          )
        ),
        Stream.unwrap,
        Stream.withSpan("OpenAi.stream")
      )

    return {
      client,
      use,
      paginate,
      stream
    } as const
  })
}) {}

export class OpenAiError extends Schema.TaggedError<OpenAiError>()("OpenAiError", {
  cause: Schema.Defect
}) {}

// usage

Effect.gen(function*() {
  const openai = yield* OpenAi

  yield* openai.stream((client, signal) =>
    client.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [{
        role: "user",
        content: "What is the meaning of life?"
      }]
    }, { signal })
  ).pipe(Stream.runForEach((chunk) =>
    Effect.sync(() => {
      process.stdout.write(chunk.choices[0].delta.content!)
    })
  ))
}).pipe(
  Effect.provide(OpenAi.Default.pipe(
    Layer.provideMerge(TracingLayer)
  )),
  NodeRuntime.runMain
)
