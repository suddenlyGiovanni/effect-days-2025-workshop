import type { Effect } from "effect"
import { Context, Data } from "effect"

// Create a custom error using `Data.TaggedError`. Instances 
// of the error will have a `_tag` property of `"CacheMissError"`.
class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> { }

// Define the service identifier, shape, and Tag at once
class Cache extends Context.Tag("app/Cache")<Cache, {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}>() { }
