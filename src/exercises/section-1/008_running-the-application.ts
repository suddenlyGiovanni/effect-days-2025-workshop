import { Console, Effect, Layer } from "effect"
import { misbehaviors } from "./fixtures/Misbehaviors.js"
import { ImmunityTokenManager, makeImmunityTokenManager } from "./shared/services/ImmunityTokenManager.js"
import { makePunDistributionNetwork, PunDistributionNetwork } from "./shared/services/PunDistributionNetwork.js"
import { makePunsterClient, PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * Let's actually run the Pun-ishment Protocol application!
 *
 * **Todo List**:
 *   - Build a `MainLayer` which can be used to provide all required services
 *     - Prefer local elimination of requirements where possible
 *   - Provide the `MainLayer` to your program
 *   - Run the program!
 *
 * **Hint**: Make sure that you understand the difference between `Effect.provide`
 * and `Effect.provideService` / `Effect.provideServiceEffect`
 *
 * **Hint 2**: You can use the command below to run this file:
 *   `pnpm exercise ./src/exercises/session-1/008_running-the-application.ts`
 *
 * **Bonus Objectives**:
 *   - Add pretty logging to the application
 *   - Customize the functionality!
 */

export const ImmunityTokenManagerLayer = Layer.scoped(
  ImmunityTokenManager,
  makeImmunityTokenManager
)

export const PunsterClientLayer = Layer.effect(
  PunsterClient,
  makePunsterClient
)

export const PunDistributionNetworkLayer = Layer.effect(
  PunDistributionNetwork,
  makePunDistributionNetwork
)

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
