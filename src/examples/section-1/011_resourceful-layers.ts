import { Data, Effect } from "effect"
import * as fs from "node:fs/promises"
import * as os from "node:os"

class FileReadError extends Data.TaggedError("FileReadError")<{
  readonly message: string
}> {}

class FileSystem extends Effect.Service<FileSystem>()("app/FileSystem", {
  succeed: {
    //   ┌─── Effect<string, never, Scope>
    //   ▼
    makeTempDirectory: Effect.acquireRelease(
      Effect.promise(() => fs.mkdtemp(os.tmpdir())),
      (tempDir) => Effect.promise(() => fs.rm(tempDir, { recursive: true }))
    ),
    writeFileString: (path: string, content: string) =>
      Effect.promise(
        () => fs.writeFile(path, content, "utf-8")
      ),
    readFileString: (path: string) =>
      Effect.tryPromise({
        try: () => fs.readFile(path, "utf-8"),
        catch: () => new FileReadError({ message: `Failed to read file at path "${path}"` })
      })
  }
}) {}

class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> {}

class Cache extends Effect.Service<Cache>()("app/Cache", {
  scoped: Effect.gen(function*() {
    const fs = yield* FileSystem

    const cacheDir = yield* fs.makeTempDirectory

    function lookup(key: string): Effect.Effect<string, CacheMissError> {
      return fs.readFileString(`${cacheDir}/${key}`).pipe(
        Effect.mapError(() => {
          return new CacheMissError({ message: `failed to read file for cache key: "${key}"` })
        })
      )
    }

    return { cacheDir, lookup } as const
  }),
  dependencies: [FileSystem.Default]
}) {}

//      ┌─── Effect<void, CacheMissError, Cache | FileSystem>
//      ▼
const program = Effect.gen(function*() {
  const cache = yield* Cache
  const fs = yield* FileSystem
  yield* fs.writeFileString(`${cache.cacheDir}/key1`, "value1")
  const value = yield* cache.lookup("key1")
  console.log(value)
})

program.pipe(
  Effect.provide([Cache.Default, FileSystem.Default]),
  Effect.runPromise
)
