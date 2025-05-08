// eslint-disable-next-line
import { Array, Config, Effect, flow, ParseResult, Random, Schedule } from "effect"
import { NodeHttpClient } from "@effect/platform-node"

/**
 * Now that you know all about `Effect.Service`, you have decided to use it to
 * simplify your service definitions for the Pun-ishment Protocol application.
 *
 * **Todo List**:
 *   - Define the Pun-ishment Protocol services using `Effect.Service`
 *     - `ImmunityTokenManager`
 *     - `PunsterClient`
 *     - `PunDistributionNetwork`
 *   - Use the provided service constructors in `Effect.Service`
 *
 * **Hint**: You'll probably want to import the `Effect` module from `"effect"`!
 *
 * **Bonus Objectives**
 *
 *   **Dependency Management**
 *     - Eliminate dependencies for each service locally
 *       - i.e. The third type parameter of `Layer` should not contain any of
 *         our Pun-ishment Protocol services (it might contain others)
 */

/* Implement the ImmunityTokenManager service below */

export class ImmunityTokenManager extends Effect.Service<ImmunityTokenManager>()("app/ImmunityTokenManager", {
  scoped: makeImmunityTokenManager()
}) {}

// eslint-disable-next-line
ImmunityTokenManager.Default
//                    ^?

/* Implement the PunsterClient service below */
export class PunsterClient extends Effect.Service<PunsterClient>()("app/PunsterClient", {
  effect: makePunsterClient(),
  dependencies: [ImmunityTokenManager.Default, NodeHttpClient.layerUndici]
}) {
}

// eslint-disable-next-line
PunsterClient.Default
//            ^?

/* Implement the PunDistributionNetwork service below */
export class PunDistributionNetwork extends Effect.Service<PunDistributionNetwork>()("app/PunDistributionNetwork", {
  effect: makePunDistributionNetwork(),
  dependencies: [PunsterClient.Default]
}) {
}

export const x = PunDistributionNetwork.Default
//           ^?

// =============================================================================
// IGNORE SECTION BELOW
// =============================================================================

/* eslint-disable */
import {
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import {
  ChildImmuneError,
  MalformedPunError,
  NoChannelAvailableError,
  NoTokenAvailableError,
  PunsterFetchError
} from "./shared/domain/errors.js"
import {
  Channel,
  ChannelType,
  Misbehavior,
  Pun,
  PunDeliveryReport
} from "./shared/domain/models.js"

/* eslint-enable */

function makeImmunityTokenManager() {
  return Effect.gen(function*() {
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
      function*(childName: string, options: {
        readonly reason: string
      }) {
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
    } as const
  })
}

function makePunDistributionNetwork() {
  return Effect.gen(function*() {
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
          Effect.annotateLogs({
            setup: pun.setup,
            punchline: pun.punchline
          })
        )
        return yield* Effect.orDie(punsterClient.evaluatePun(pun, misbehavior, channel))
      }
    )

    return {
      getChannel,
      deliverPun
    } as const
  })
}

function makePunsterClient() {
  return Effect.gen(function*() {
    const tokenManager = yield* ImmunityTokenManager

    const apiUrl = yield* Config.url("PUNSTER_API_URL")
    const apiToken = yield* Config.redacted("PUNSTER_API_TOKEN")
    const httpClient = yield* HttpClient.HttpClient
    const httpClientOk = httpClient.pipe(
      HttpClient.mapRequest(flow(
        HttpClientRequest.prependUrl(apiUrl.toString()),
        HttpClientRequest.bearerToken(apiToken),
        HttpClientRequest.acceptJson
      )),
      HttpClient.filterStatusOk
    )

    const createPun = Effect.fn("PunsterClient.createPun")(
      function*(misbehavior: Misbehavior) {
        const remainingTokens = yield* tokenManager.getBalance(misbehavior.childName)
        if (remainingTokens > 0) {
          const remainingTokens = yield* Effect.orDie(tokenManager.useToken(misbehavior.childName))
          return yield* new ChildImmuneError({
            childName: misbehavior.childName,
            remainingTokens
          })
        }
        yield* Effect.log("Creating pun for misbehavior...")
        return yield* httpClientOk.post("/puns/create", {
          body: HttpBody.unsafeJson({ misbehavior })
        }).pipe(
          Effect.flatMap(HttpClientResponse.schemaBodyJson(Pun)),
          Effect.catchTag("ParseError", (error) =>
            new MalformedPunError({
              message: ParseResult.TreeFormatter.formatErrorSync(error)
            })),
          Effect.mapError((cause) => new PunsterFetchError({ cause }))
        )
      },
      (effect, misbehavior) => Effect.annotateLogs(effect, { ...misbehavior })
    )

    const evaluatePun = Effect.fn("PunsterClient.evaluatePun")(
      function*(pun: Pun, misbehavior: Misbehavior, channel: Channel) {
        yield* Effect.log(`Sending pun for evaluation...`)
        return yield* httpClientOk.post("/puns/evaluate", {
          body: HttpBody.unsafeJson({
            pun,
            misbehavior,
            channel
          })
        }).pipe(
          Effect.flatMap(HttpClientResponse.schemaBodyJson(PunDeliveryReport)),
          Effect.as("Fake Report"),
          Effect.mapError((cause) => new PunsterFetchError({ cause }))
        )
      },
      (effect, pun) => Effect.annotateLogs(effect, { ...pun })
    )

    return {
      createPun,
      evaluatePun
    } as const
  })
}
