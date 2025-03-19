import { Console, Effect } from "effect"

// A pre-defined list of misbehaviors
import { misbehaviors } from "./fixtures/Misbehaviors.js"
// The tags created in the previous exercise
import { PunDistributionNetwork } from "./shared/services/PunDistributionNetwork.js"
import { PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * **Todo List**:
 *   - Use the services we've defined to write the main program's business
 *     logic in the `main` Effect below
 *
 * **Business Logic**
 *   - For each misbehavior:
 *     - Use the `PunDistributionNetwork` to get a pun delivery channel
 *       for the pun
 *     - Use the `PunsterClient` to create a pun
 *     - Use the `PunDistributionNetwork` to deliver the pun to the delivery
 *       channel
 *     - Log out the result of delivering the pun
 *
 * **Hint**: You'll probably need to access the above services somehow!
 *
 * **Bonus Objectives**:
 *
 *   **Error Handling**:
 *     - Log a warning message if a child had an immunity token
 *     - Log an error message if a pun failed to be fetched from PUNSTER
 *
 *   **Other**:
 *     - Use the `ImmunityTokenManager` to give other children immunity
 *       - check `./fixtures/Misbehaviors.ts` to see the available children
 */

export const main = Effect.gen(function*() {
  // Your logic goes here
  const punDistributionNetwork = yield* PunDistributionNetwork
  const punsterClient = yield* PunsterClient

  for (const misbehavior of misbehaviors) {
    /**
     * Use the `PunDistributionNetwork` to get a pun delivery channel for the pun
     */
    const channel = yield* punDistributionNetwork.getChannel(misbehavior)

    /**
     * Use the `PunsterClient` to create a pun
     */

    const pun = yield* punsterClient.createPun(misbehavior)

    /**
     * Use the `PunDistributionNetwork` to deliver the pun to the delivery channel
     */

    const report = yield* punDistributionNetwork.deliverPun(pun, misbehavior, channel)

    yield* Console.log(report)
  }
}).pipe(
  Effect.catchTags({
    ChildImmuneError: (_) => Effect.logWarning(`Child ${_.childName} is immune, using immunity token`),
    PunsterFetchError: (_) => Effect.logError(`Failed to fetch pun for misbehavior: ${_.message}`)
  })
)
