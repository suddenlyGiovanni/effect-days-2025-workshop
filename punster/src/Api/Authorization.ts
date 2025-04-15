import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity } from "@effect/platform"
import { Config, Effect, Layer, Redacted, Schema } from "effect"

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {},
  HttpApiSchema.annotations({ status: 403 })
) {
  get message() {
    return `Not authorized`
  }
}

export class Authorization extends HttpApiMiddleware.Tag<Authorization>()(
  "Authorization",
  {
    failure: Unauthorized,
    security: { token: HttpApiSecurity.bearer }
  }
) {}

export const AuthorizationLayer = Layer.effect(
  Authorization,
  Effect.gen(function*() {
    return {
      token: Effect.fnUntraced(function*(bearer) {
        const authorizationToken = yield* Config.string("AUTHORIZATION_TOKEN")
        return yield* Redacted.value(bearer) === authorizationToken
          ? Effect.void
          : Effect.dieMessage("Invalid token")
      }, Effect.mapError(() => new Unauthorized()))
    }
  })
)
