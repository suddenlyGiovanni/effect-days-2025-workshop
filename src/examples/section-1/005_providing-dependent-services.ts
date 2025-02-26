import { Context, Data, Effect } from "effect"
import * as fs from "node:fs/promises"

class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly message: string
}> {}

class FileSystem extends Context.Tag("app/FileSystem")<FileSystem, {
  readonly readFileString: (path: string) => Effect.Effect<string, FileReadError>
}>() {}

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> {}

class Cache extends Context.Tag("app/Cache")<Cache, {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}>() {}

// Using the service results in an Effect that
// depends on `Cache`
//
//      ┌─── Effect<void, CacheMissError, Cache> ⛔
//      ▼
const program = Effect.gen(function*() {
  const cache = yield* Cache
  const value = yield* cache.lookup("my-key")
  console.log(value)
})

// Create a constructor for a `Cache` that relies on the `FileSystem`
//
//      ┌─── Effect<{ readonly lookup: ... }, never, FileSystem> ⛔
//      ▼
const makeFileSystemCache = Effect.gen(function*() {
  const fs = yield* FileSystem
  return Cache.of({
    lookup: (key) =>
      fs.readFileString(`./src/demos/session-1/cache/${key}`).pipe(
        Effect.mapError(() =>
          new CacheMissError({
            message: `failed to read file for cache key: "${key}"`
          })
        )
      )
  })
})

// Providing a Cache implementation that depends on a `FileSystem`
// results in an Effect that now requires `FileSystem`
//
//      ┌─── Effect<void, CacheMissError, FileSystem> ⛔
//      ▼
const nonRunnable = program.pipe(
  Effect.provideServiceEffect(Cache, makeFileSystemCache)
)

// Providing a FileSystem implementation eliminates
// all remaining service dependencies, making the Effect runnable
//
//       ┌─── Effect<void, CacheMissError> 🎉
//       ▼
const runnable = nonRunnable.pipe(
  Effect.provideService(FileSystem, {
    readFileString: (path) =>
      Effect.tryPromise({
        try: () => fs.readFile(path, "utf-8"),
        catch: () => new FileReadError({ message: `Failed to read file at path "${path}"` })
      })
  })
)

Effect.runPromise(runnable)
