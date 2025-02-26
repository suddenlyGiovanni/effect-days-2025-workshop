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
  // Retrieve the Cache service from the Context
  const cache = yield* Cache
  // Use the Cache service
  const value = yield* cache.lookup("my-key")
  console.log(value)
})
