import type { Effect } from "effect"
import { Context, Data } from "effect"

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
  // ✅ FileSystem is not leaked into the interface
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}>() {}
