import { Context, Effect, Layer, Schedule } from "effect"
import { NoTokenAvailableError } from "../domain/errors.js"

export class ImmunityTokenManager extends Context.Tag("ImmunityTokenManager")<ImmunityTokenManager, {
  readonly getBalance: (childName: string) => Effect.Effect<number>
  readonly awardToken: (childName: string, options: { readonly reason: string }) => Effect.Effect<void>
  readonly useToken: (childName: string) => Effect.Effect<number, NoTokenAvailableError>
}>() {}

export const makeImmunityTokenManager = Effect.gen(function*() {
  const tokens = new Map<string, number>()

  // Start a background fiber to reset all tokens at the start of every day
  yield* Effect.sync(() => tokens.clear()).pipe(
    Effect.schedule(Schedule.cron("0 0 * * *")),
    Effect.forkScoped,
    Effect.interruptible
  )

  const getBalance = Effect.fn("ImmunityTokenManager.getBalance")(
    function*(childName: string) {
      return yield* Effect.fromNullable(tokens.get(childName)).pipe(
        Effect.orElseSucceed(() => 0)
      )
    }
  )

  const awardToken = Effect.fn("ImmunityTokenManager.awardToken")(
    function*(childName: string, options: { readonly reason: string }) {
      yield* Effect.log(`Awarding immunity token to ${childName} because ${options.reason}`)
      const previous = tokens.get(childName) ?? 0
      tokens.set(childName, previous + 1)
    }
  )

  const useToken = Effect.fn("ImmunityTokenManager.useToken")(
    function*(childName: string) {
      return yield* Effect.fromNullable(tokens.get(childName)).pipe(
        Effect.andThen((previous) => {
          const amount = previous - 1
          tokens.set(childName, amount)
          return amount
        }),
        Effect.mapError(() => new NoTokenAvailableError({ childName }))
      )
    }
  )

  return {
    getBalance,
    awardToken,
    useToken
  } as const // Using "as const" to keep the types readonly and strict
})

export const ImmunityTokenManagerLayer = Layer.scoped(
  ImmunityTokenManager,
  makeImmunityTokenManager
)
