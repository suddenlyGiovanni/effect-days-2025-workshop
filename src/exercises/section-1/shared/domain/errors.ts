import { Data } from "effect"

export class ChildImmuneError extends Data.TaggedError("ChildImmuneError")<{
  readonly childName: string
  readonly remainingTokens: number
}> {}

export class NoChannelAvailableError extends Data.TaggedError("NoChannelAvailableError")<{
  readonly category: string
}> {}

export class NoTokenAvailableError extends Data.TaggedError("NoTokenAvailableError")<{
  readonly childName: string
}> {}

export class MalformedPunError extends Data.TaggedError("MalformedPunError")<{
  readonly message: string
}> {}

export class PunsterFetchError extends Data.TaggedError("PunsterFetchError")<{
  readonly cause: unknown
}> {}
