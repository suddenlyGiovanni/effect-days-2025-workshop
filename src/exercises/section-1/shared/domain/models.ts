import { DateTime, Duration, Effect, Order, Schema } from "effect"

const PositiveInt = Schema.Int.pipe(Schema.positive())

/**
 * Represents the severity of a pun, `5` being the most groan-inducing and `1`
 * being the least groan-inducing.
 */
export const Severity = Schema.Literal(1, 2, 3, 4, 5).annotations({
  identifier: "Severity"
})

export type Severity = typeof Severity.Type

/**
 * Represents the different types of communication channels available for
 * distributing puns.
 */
export const ChannelType = Schema.Literal(
  "DinnerConversation",
  "CarRide",
  "BedtimeRoutine",
  "FamilyGathering",
  "HomeworkSession"
).annotations({ identifier: "ChannelType" })

export type ChannelType = typeof ChannelType.Type

/**
 * A score from `1-100` which repreents how receptive an audience will be to
 * puns.
 */
export const Receptivity = PositiveInt.pipe(
  Schema.between(1, 100)
).annotations({ identifier: "Receptivity" })

export type Receptivity = typeof Receptivity.Type

/**
 * Disabling validation for statically constructed schemas to avoid the
 * overhead, given schema validation is not necessary in this case.
 */
const constDisableValidation = { disableValidation: true }

/**
 * Represents a communication channel for distributing puns.
 */
export class Channel extends Schema.Class<Channel>("Channel")({
  /**
   * The type of communication channel to use.
   */
  type: ChannelType,
  /**
   * How receptive the audience will be on a scale from 1-100.
   */
  receptivity: Receptivity,
  /**
   * Required recovery time between communications.
   */
  cooldown: Schema.DurationFromMillis,
  /**
   * The time that the channel was last used.
   */
  lastUsed: Schema.optionalWith(Schema.DateTimeUtcFromNumber, { exact: true })
}) {
  static AllTypes: ReadonlyArray<Channel> = [
    Channel.make({
      type: "BedtimeRoutine",
      receptivity: 75,
      cooldown: Duration.hours(24)
    }, constDisableValidation),
    Channel.make({
      type: "CarRide",
      receptivity: 65,
      cooldown: Duration.minutes(30)
    }, constDisableValidation),
    Channel.make({
      type: "DinnerConversation",
      receptivity: 80,
      cooldown: Duration.hours(1)
    }, constDisableValidation),
    Channel.make({
      type: "FamilyGathering",
      receptivity: 90,
      cooldown: Duration.hours(2)
    }, constDisableValidation),
    Channel.make({
      type: "HomeworkSession",
      receptivity: 45,
      cooldown: Duration.hours(3)
    }, constDisableValidation)
  ]

  static OrderReceptivityDesc = Order.mapInput(
    Order.number,
    (channel: Channel) => channel.receptivity
  )

  get isAvailable(): Effect.Effect<boolean> {
    return Effect.gen(this, function*() {
      if (this.lastUsed === undefined) {
        return true
      }
      const now = yield* DateTime.now
      return DateTime.lessThanOrEqualTo(this.lastUsed, now)
    })
  }
}

export class Misbehavior extends Schema.Class<Misbehavior>("Misbehavior")({
  /** The name of the child who committed the misbehavior */
  childName: Schema.String,
  /** The category of the misbehavior (e.g. TooMuchDeviceTime) */
  category: Schema.String,
  /** A detailed description of the misbehavior */
  description: Schema.String,
  /** The severity score of the misbehavior on a scale from 1-5 */
  severity: Severity
}) { }

export class Pun extends Schema.Class<Pun>("Pun")({
  /** The setup line for the pun */
  setup: Schema.String,
  /** The punch line of the pun */
  punchline: Schema.String,
  /** The likelihood that a pun will induce a groan from its recipient on a scale from 1-100 */
  groanPotential: PositiveInt.pipe(Schema.between(1, 100))
}) { }

export const DurationFromSeconds = Schema.transform(
  /**
   * A non-negative number to be decoded into a `Duration`.
   */
  Schema.NonNegative,
  Schema.DurationFromSelf,
  {
    strict: true,
    decode: (i) => Duration.seconds(i),
    encode: (a) => Duration.toSeconds(a)
  }
).annotations({ identifier: "DurationFromSeconds" })

/**
 * A comprehensive evaluation report generated after a pun is delivered to its
 * recipient.
 */
export class PunDeliveryReport extends Schema.Class<PunDeliveryReport>("PunDeliveryReport")({
  /** Summary of the overall pun delivery effectiveness */
  executiveSummary: Schema.String,
  /** Detailed narrative of how the pun delivery unfolded */
  deliveryNarrative: Schema.String,
  /** Qualitative observations about the delivery and reaction */
  observations: Schema.Array(Schema.String),
  /** Recommendations for future pun deliveries */
  recommendations: Schema.Array(Schema.String),
  /** Quantitative metrics about the pun delivery */
  metrics: Schema.Struct({
    /** Percentage of the pun that was comprehended (0-100). */
    comprehensionRate: PositiveInt.pipe(Schema.between(1, 100)),
    /** Intensity of the reaction on a scale from 1-100 */
    reactionIntensity: PositiveInt.pipe(Schema.between(1, 100)),
    /** The number of seconds the reaction lasted */
    reactionDuration: DurationFromSeconds,
    /** Percentage likelihood of the child repeating the pun to others (0-100) */
    repeatProbability: Schema.Number.pipe(Schema.between(1, 100)),
    /** Score representing the overall success of the pun delivery (0-100) */
    deliveryEffectiveness: PositiveInt.pipe(Schema.between(1, 100))
  })
}) { }
