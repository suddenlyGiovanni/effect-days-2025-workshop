import { Array, Context, Effect, Layer, Random } from "effect"
import { NoChannelAvailableError } from "../domain/errors.js"
import type { ChannelType, Misbehavior, Pun } from "../domain/models.js"
import { Channel } from "../domain/models.js"
import { PunsterClient, PunsterClientLayer } from "./PunsterClient.js"

export class PunDistributionNetwork extends Context.Tag("PunDistributionNetwork")<PunDistributionNetwork, {
  readonly getChannel: (misbehavior: Misbehavior) => Effect.Effect<Channel, NoChannelAvailableError>
  readonly deliverPun: (pun: Pun, misbehavior: Misbehavior, channel: Channel) => Effect.Effect<string>
}>() {}

export const makePunDistributionNetwork = Effect.gen(function*() {
  const punsterClient = yield* PunsterClient

  const channels: Map<ChannelType, Channel> = new Map()

  for (const channel of Channel.AllTypes) {
    channels.set(channel.type, channel)
  }

  const getChannel = Effect.fn("PunDistributionNetwork.getChannel")(
    function*(misbehavior: Misbehavior) {
      yield* Effect.log(`Detected new misbehavior for child: ${misbehavior.childName}`).pipe(
        Effect.annotateLogs({ ...misbehavior })
      )
      return yield* Effect.filter(channels.values(), (channel) => channel.isAvailable).pipe(
        Effect.map(Array.sort(Channel.OrderReceptivityDesc)),
        Effect.filterOrFail(
          (channels): channels is Array.NonEmptyArray<Channel> => Array.isNonEmptyArray(channels),
          () => new NoChannelAvailableError({ category: misbehavior.category })
        ),
        Effect.andThen((channels) =>
          // Select the channel based on channel receptivity / pun severity
          misbehavior.severity >= 4
            // For puns with a high severity, select the available channel with
            // the highest receptivity
            ? Effect.succeed(Array.headNonEmpty(channels))
            // Otherwise select a random channel
            : Random.choice(channels)
        ),
        Effect.tap((channel) => Effect.log(`Selected channel type "${channel.type}" for optimal pun delivery`))
      )
    }
  )

  const deliverPun = Effect.fn("PunDistributionNetwork.deliverPun")(
    function*(pun: Pun, misbehavior: Misbehavior, channel: Channel) {
      yield* Effect.log(`Delivering pun to ${misbehavior.childName} via channel type "${channel.type}"`).pipe(
        Effect.annotateLogs({ setup: pun.setup, punchline: pun.punchline })
      )
      return yield* Effect.orDie(punsterClient.evaluatePun(pun, misbehavior, channel))
    }
  )

  return {
    getChannel,
    deliverPun
  } as const // Using "as const" to keep the types readonly and strict
})

export const PunDistributionNetworkLayer = Layer.effect(
  PunDistributionNetwork,
  makePunDistributionNetwork
).pipe(Layer.provide(PunsterClientLayer))
