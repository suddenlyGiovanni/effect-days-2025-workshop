import type { Effect } from "effect"
import { Context } from "effect"
import type {
  ChildImmuneError,
  MalformedPunError,
  NoChannelAvailableError,
  NoTokenAvailableError,
  PunsterFetchError
} from "./shared/domain/errors.js"
import type { Channel, Misbehavior, Pun } from "./shared/domain/models.js"

/**
 * **Solution Explanation**:
 *
 * The first step to creating a service in Effect is to create a unique
 * identifier at both the type-level and at runtime that we can use as a
 * "placeholder" for the service in our programs. In Effect, we call this
 * a `Tag`.
 *
 * Accessing the service in our programs via our "placeholder" (`Tag`) will
 * add the service to the program's requirements, so that we can remember
 * to provide the service when we try to run the program.
 *
 * Creating a `Tag` in Effect requires two things:
 *   - A unique type-level identifier
 *   - An interface for our service
 */

export interface PunsterClientShape {
  readonly createPun: (
    misbehavior: Misbehavior
  ) => Effect.Effect<Pun, ChildImmuneError | MalformedPunError | PunsterFetchError>
  readonly evaluatePun: (
    pun: Pun,
    misbehavior: Misbehavior,
    channel: Channel
  ) => Effect.Effect<string, PunsterFetchError>
}

/**
 * The Punster Client is responsible for interacting with PUNSTER to create puns
 * and perform evaluations on pun delivery.
 */
export class PunsterClient extends Context.Tag("Punsterclient")<
  PunsterClient,
  PunsterClientShape
>() {}

export interface PunDistributionNetworkShape {
  readonly getChannel: (misbehavior: Misbehavior) => Effect.Effect<Channel, NoChannelAvailableError>
  readonly deliverPun: (pun: Pun, misbehavior: Misbehavior, channel: Channel) => Effect.Effect<string>
}

/**
 * The Pun Distribution Network (PDN) is responsible for controlling access to
 * the most optimal communication channels for delivering puns.
 */
export class PunDistributionNetwork extends Context.Tag("app/PunDistributionNetwork")<
  PunDistributionNetwork,
  PunDistributionNetworkShape
>() {}

export interface ImmunityTokenManagerShape {
  readonly getBalance: (childName: string) => Effect.Effect<number>
  readonly awardToken: (childName: string, options: { readonly reason: string }) => Effect.Effect<void>
  readonly useToken: (childName: string) => Effect.Effect<number, NoTokenAvailableError>
}

/**
 * The Immunity Token Manager is a service that allows children to earn pun
 * immunity tokens, providing positive reinforcement for good behavior. All
 * tokens are reset each day at `00:00`.
 */
export class ImmunityTokenManager extends Context.Tag("app/ImmunityTokenManager")<
  ImmunityTokenManager,
  ImmunityTokenManagerShape
>() {}
