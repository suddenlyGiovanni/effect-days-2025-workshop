import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Layer } from "effect"
import { misbehaviors } from "./fixtures/Misbehaviors.js"
import { ImmunityTokenManager, makeImmunityTokenManager } from "./shared/services/ImmunityTokenManager.js"
import { makePunDistributionNetwork, PunDistributionNetwork } from "./shared/services/PunDistributionNetwork.js"
import { makePunsterClient, PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * **Solution Explanation**:
 * To be able to run the application, we first compose all of our service
 * `Layer`s into a final `MainLayer`.
 *
 * We chose to avoid locally eliminating the `HttpClient` dependency because
 * the implementation is platform-specific, so we want to provide it as close
 * to where we're running the program as possible.
 *
 * We then use `Effect.provide` to provide our `Layer` to the `main` program,
 * and we use `NodeRuntime.runMain` to run the program since it, by default,
 * swaps out the default logger for a pretty one.
 *
 * **Note**: It would also be valid to manually swap out the default logger for
 * the pretty one if you chose to do that bonus objective, and then run the
 * program with `Effect.runPromise`.
 */

export const ImmunityTokenManagerLayer = Layer.scoped(
  ImmunityTokenManager,
  makeImmunityTokenManager
)

export const PunsterClientLayer = Layer.effect(
  PunsterClient,
  makePunsterClient
).pipe(Layer.provide(ImmunityTokenManagerLayer))

export const PunDistributionNetworkLayer = Layer.effect(
  PunDistributionNetwork,
  makePunDistributionNetwork
).pipe(Layer.provide(PunsterClientLayer))

const MainLayer = Layer.mergeAll(
  ImmunityTokenManagerLayer,
  PunsterClientLayer,
  PunDistributionNetworkLayer
).pipe(Layer.provide(NodeHttpClient.layerUndici))

export const main = Effect.gen(function*() {
  const punster = yield* PunsterClient
  const pdn = yield* PunDistributionNetwork

  for (const misbehavior of misbehaviors) {
    const channel = yield* pdn.getChannel(misbehavior)
    yield* punster.createPun(misbehavior).pipe(
      Effect.andThen((pun) => pdn.deliverPun(pun, misbehavior, channel)),
      Effect.andThen((report) => Console.log(report)),
      Effect.catchTags({
        ChildImmuneError: () => Effect.logWarning(`Child ${misbehavior.childName} is immune, using immunity token`),
        PunsterFetchError: () => Effect.logError(`Failed to fetch pun for misbehavior: ${misbehavior}`)
      })
    )
  }
})

main.pipe(
  Effect.provide(MainLayer),
  NodeRuntime.runMain
)
