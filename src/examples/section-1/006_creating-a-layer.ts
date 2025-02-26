import { Context, Data, Effect, Layer } from "effect"
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

//      ┌─── Effect<void, CacheMissError, Cache>
//      ▼
const program = Effect.gen(function*() {
  const cache = yield* Cache
  const data = yield* cache.lookup("my-key")
  console.log(data)
})

// Create a constructor for a `Cache` that relies on the `FileSystem`
//
//      ┌─── Effect<{ readonly lookup: ... }, never, FileSystem>
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

// Creating a `CacheLayer` from the `makeFileSystemCache` constructor
// results in a `Layer` that produces a `Cache` and requires a `FileSystem`
//
//           ┌─── Layer<Cache, never, FileSystem>
//           ▼
const CacheLayer = Layer.effect(Cache, makeFileSystemCache)

//         ┌─── Layer<FileSystem, never, never>
//         ▼
const FileSystemLayer = Layer.succeed(FileSystem, {
  readFileString: (path) =>
    Effect.tryPromise({
      try: () => fs.readFile(path, "utf-8"),
      catch: () => new FileReadError({ message: `Failed to read file at path "${path}"` })
    })
})

// Providing the `FileSystemLayer` to the `CacheLayer`
// results in a `Layer<Cache, never, never>`
//
//      ┌─── Layer<Cache, never, never>
//      ▼
const MainLayer = Layer.provide(CacheLayer, FileSystemLayer)

//      ┌─── Effect<void, CacheMissError, never>
//      ▼
const runnable = Effect.provide(program, MainLayer)

Effect.runPromise(runnable)
