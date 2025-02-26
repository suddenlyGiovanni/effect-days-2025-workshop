import type { Result } from "@effect-rx/rx-react"
import { Rx } from "@effect-rx/rx-react"
import type { Chunk, ConfigError } from "effect"
import { ConfigProvider, Effect, Layer, Stream } from "effect"
import type { ChatCompletionChunk } from "openai/resources/index.mjs"
import type { OpenAiError } from "../OpenAi.js"
import { OpenAi } from "../OpenAi.js"

// Create a ConfigProvider from the Vite environment variables
const ViteConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromJson(import.meta.env)
)

// Create the Rx equivalent of a "ManagedRuntime"
const runtime = Rx.runtime(
  OpenAi.Default.pipe(Layer.provideMerge(ViteConfigProvider))
)

export const completionRx = Rx.family(
  (
    message: string
  ): Rx.Rx<Result.Result<string, ConfigError.ConfigError | OpenAiError>> =>
    runtime.rx(
      Effect.gen(function*() {
        const openai = yield* OpenAi
        const result = yield* openai.use((client) =>
          client.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: message }]
          })
        )
        return result.choices[0].message.content!
      })
    )
)

export const completionStreamRx = Rx.family(
  (
    message: string
  ): Rx.Rx<
    Result.Result<
      Chunk.Chunk<ChatCompletionChunk>,
      ConfigError.ConfigError | OpenAiError
    >
  > =>
    runtime.rx(
      Effect.gen(function*() {
        const openai = yield* OpenAi
        return openai.completion({
          model: "gpt-4o",
          messages: [{ role: "user", content: message }]
        })
      }).pipe(
        // Turn Effect<Stream<Chunk>> into Stream<Chunk>
        Stream.unwrap,
        // As chunks arrive, accumulate them into a single chunk
        Stream.accumulate
      )
    )
)
