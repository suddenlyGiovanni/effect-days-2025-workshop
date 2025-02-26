import { Context, Data, Effect } from "effect"

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> {}

class Cache extends Context.Tag("app/Cache")<Cache, {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}>() {}

//      ┌─── Effect<void, CacheMissError, Cache>
//      ▼
const program = Effect.gen(function*() {
  const cache = yield* Cache
  const value = yield* cache.lookup("my-key")
  console.log(value)
})

//       ┌─── Effect<void, CacheMissError, never>
//       ▼
const runnable = program.pipe(
  Effect.provideService(Cache, {
    lookup: (key) => Effect.succeed(`${key}-value`)
  })
)

Effect.runPromise(runnable)
// => "my-key-value"
