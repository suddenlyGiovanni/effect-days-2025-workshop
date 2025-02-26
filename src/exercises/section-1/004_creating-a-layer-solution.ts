import { NodeHttpClient } from "@effect/platform-node"
import { Layer } from "effect"
import { ImmunityTokenManager, makeImmunityTokenManager } from "./shared/services/ImmunityTokenManager.js"
import { makePunDistributionNetwork, PunDistributionNetwork } from "./shared/services/PunDistributionNetwork.js"
import { makePunsterClient, PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * **Solution Explanation**:
 *
 * To create a `Layer` for a service, we need both a `Tag` to identify our
 * service, as well as a way to construct the service. In many cases, service
 * constructors are effectful, so it is common to utilize the `Layer.effect`
 * constructor.
 *
 * Because `Layer`s are memoized (by reference), we can provide service
 * dependencies locally (using e.g. `Layer.provide`), which simplifies the final
 * layer composition we will need to do to run our application.
 *
 * Notice, however, that we are still left with a lingering `Scope` in our
 * requirements even after we compose all our layers together. We will discuss
 * how to deal with *resourceful* layers a bit later on in the workshop.
 */

// !! IMPORTANT !!
// This implementation is not *technically* correct - we will see why soon
export const ImmunityTokenManagerLayer = Layer.effect(
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

export const MainLayer = Layer.mergeAll(
  ImmunityTokenManagerLayer,
  PunsterClientLayer,
  PunDistributionNetworkLayer
).pipe(Layer.provide(NodeHttpClient.layerUndici))
