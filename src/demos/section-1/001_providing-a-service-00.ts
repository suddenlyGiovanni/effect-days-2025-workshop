import { Context, Data, Effect } from "effect"

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly key: string
}> {}

class Cache extends Context.Tag("app/Cache")<Cache, {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}>() {}

const store: Map<string, string> = new Map([
  ["key1", "in-memory-value1"],
  ["key2", "in-memory-value2"],
  ["key3", "in-memory-value3"]
])

const InMemoryCache = Cache.of({
  lookup: (key) =>
    Effect.fromNullable(store.get(key)).pipe(
      Effect.catchTag("NoSuchElementException", () => new CacheMissError({ key }))
    )
})

const subProgramOne = Effect.gen(function*() {
  const cache = yield* Cache
  const value = yield* cache.lookup("key1")
  console.log(value)
})

const subProgramTwo = Effect.gen(function*() {
  const cache = yield* Cache
  const value = yield* cache.lookup("key2")
  console.log(value)
})

const program = Effect.gen(function*() {
  yield* subProgramOne
  yield* subProgramTwo
})

const runnable = program.pipe(
  Effect.provideService(Cache, InMemoryCache)
)

Effect.runPromise(runnable)
/*
Output:
in-memory-value1
in-memory-value2
*/
