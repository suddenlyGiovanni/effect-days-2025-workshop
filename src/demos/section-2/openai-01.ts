import { Config, Effect, Redacted } from "effect"
import * as Api from "openai"

export class OpenAi extends Effect.Service<OpenAi>()("OpenAi", {
  effect: Effect.gen(function*() {
    const client = new Api.OpenAI({
      apiKey: Redacted.value(yield* Config.redacted("OPENAI_API_KEY"))
    })

    const use = <A>(f: (client: Api.OpenAI) => Promise<A>): Effect.Effect<A> =>
      Effect.promise(
        () => f(client)
      )

    return {
      client,
      use
    } as const
  })
}) {}
