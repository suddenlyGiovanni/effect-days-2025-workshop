import { Console, Effect } from "effect"
import { misbehaviors } from "./fixtures/Misbehaviors.js"
import { PunDistributionNetwork } from "./shared/services/PunDistributionNetwork.js"
import { PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * **Solution Explanation**:
 *
 * The first step we need to do is access our `PunDistributionNetwork` and
 * `PunsterClient` services via their `Tag` placeholders. Once we have access
 * to these services, we are free to write the business logic of our `main`
 * Effect however we would like to.
 *
 * Take note of a few things in this exercise:
 *   - We've written out all the business logic for our `main` Effect without
 *     having defined an implementation for the services we're using
 *   - By accessing the `PunDistributionNetwork` and `PunsterClient` services,
 *     the type of our `main` Effect tracks that these services must be provided
 *
 * Effect allows you to "code to an interface, not an implementation". You
 * define the interface for services you want to interact with, and then you
 * can access their interface via their `Tag` placeholders. And because Effect
 * tracks this at the type level, you always know what services your program
 * will need.
 */

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
