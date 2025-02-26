import { Data, Effect } from "effect"
import * as fs from "node:fs/promises"

class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly message: string
}> {}

class FileSystem extends Effect.Service<FileSystem>()("app/FileSystem", {
  succeed: {
    readFileString: (path: string) =>
      Effect.tryPromise({
        try: () => fs.readFile(path, "utf-8"),
        catch: () => new FileReadError({ message: `Failed to read file at path "${path}"` })
      })
  }
}) {}

//           ┌─── Layer<FileSystem, never, never>
//           ▼
FileSystem.Default

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> {}

class Cache extends Effect.Service<Cache>()("app/Cache", {
  effect: Effect.gen(function*() {
    const fs = yield* FileSystem
    function lookup(key: string): Effect.Effect<string, CacheMissError> {
      return fs.readFileString(`./src/demos/session-1/cache/${key}`).pipe(
        Effect.mapError(() => {
          return new CacheMissError({ message: `failed to read file for cache key: "${key}"` })
        })
      )
    }
    return { lookup } as const
  }),
  dependencies: [FileSystem.Default]
}) {}

//      ┌─── Layer<Cache, never, never>
//      ▼
Cache.Default

//      ┌─── Effect<void, CacheMissError, Cache>
//      ▼
const program = Effect.gen(function*() {
  const cache = yield* Cache
  const data = yield* cache.lookup("my-key")
  console.log(data)
})

//      ┌─── Effect<void, CacheMissError, never>
//      ▼
const runnable = Effect.provide(program, Cache.Default)

Effect.runPromise(runnable)
