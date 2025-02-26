import type { Effect } from "effect"
import { Context, Data } from "effect"

// Create a custom error using `Data.TaggedError`. Instances
// of the error will have a `_tag` property of `"CacheMissError"`.
class CacheMissError extends Data.TaggedError("CacheMissError")<{
  readonly message: string
}> {}

// Define the service identifier
interface Cache {
  readonly _: unique symbol
}

// Define the service interface
interface CacheShape {
  readonly lookup: (key: string) => Effect.Effect<string, CacheMissError>
}

// Define the service Tag
const Cache = Context.GenericTag<Cache, CacheShape>("app/Cache")
