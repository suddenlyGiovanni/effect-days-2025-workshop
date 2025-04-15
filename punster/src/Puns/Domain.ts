import { Duration, Schema } from "effect"

export const Severity = Schema.Literal(1, 2, 3, 4, 5).annotations({
  title: "Severity"
})

export const GroanPotential = Schema.Int.annotations({
  title: "GroanPotential",
  description:
    "An integer between 1-100 which describes the likelihood that a pun will induce a groan from its recipient"
})

export const ReceptivityScore = Schema.Int.annotations({
  title: "ReceptivityScore",
  description: "An integer between 1-100 which describes how receptive a pun's recipient will be to the pun"
})

export class CommunicationChannel extends Schema.Class<CommunicationChannel>("CommunicationChannel")({
  type: Schema.String,
  receptivity: ReceptivityScore,
  cooldown: Schema.Duration,
  lastUsed: Schema.optionalWith(Schema.DateTimeUtc, { exact: true })
}) {}

export class Misbehavior extends Schema.Class<Misbehavior>("Misbehavior")({
  childName: Schema.String.annotations({
    description: "The name of the child who committed the misbehavior"
  }),
  category: Schema.String.annotations({
    description: "The category that the pun should relate to"
  }),
  description: Schema.String.annotations({
    description: "A detailed description of the misbehavior"
  }),
  severity: Severity.annotations({
    description: "The severity score of the misbehavior on a scale from 1-5"
  })
}) {}

export class Pun extends Schema.Class<Pun>("Pun")({
  setup: Schema.String,
  punchline: Schema.String,
  groanPotential: GroanPotential
}) {}

export const DurationFromSeconds = Schema.transform(
  Schema.Int.annotations({
    description: "a non-negative number to be decoded into a Duration"
  }),
  Schema.DurationFromSelf,
  {
    strict: true,
    decode: (i) => Duration.seconds(i),
    encode: (a) => Duration.toSeconds(a)
  }
).annotations({ identifier: "DurationFromSeconds" })

export class PunDeliveryReport extends Schema.Class<PunDeliveryReport>("PunDeliveryReport")({
  executiveSummary: Schema.String.annotations({
    description: "Summary of the overall pun delivery effectiveness"
  }),
  deliveryNarrative: Schema.String.annotations({
    description: "Detailed narrative of how the pun delivery unfolded"
  }),
  observations: Schema.Array(Schema.String).annotations({
    description: "Qualitative observations about the delivery and reaction"
  }),
  recommendations: Schema.Array(Schema.String).annotations({
    description: "Recommendations for future pun deliveries"
  }),
  metrics: Schema.Struct({
    comprehensionRate: Schema.Number.annotations({
      description: "The percentage of the pun that was comprehended (0-100)"
    }),
    reactionIntensity: Schema.Int.annotations({
      description: "An integer which represents the intensity of the reaction on a scale from 1-100"
    }),
    reactionDuration: DurationFromSeconds.annotations({
      description: "The number of seconds the reaction lasted"
    }),
    repeatProbability: Schema.Number.annotations({
      description: "The percentage likelihood of the child repeating the pun to others (0-100)"
    }),
    deliveryEffectiveness: Schema.Int.annotations({
      description: "An integer which represents the overall success of the pun delivery (0-100)"
    })
  }).annotations({ description: "Quantitative metrics about the pun delivery" })
}, {
  description: "A comprehensive evaluation report generated after a pun is delivered to its recipient"
}) {}

export class PunCreateError extends Schema.TaggedClass<PunCreateError>("PunCreateError")("PunCreateError", {
  misbehavior: Misbehavior
}) {}

export class PunCreateParams extends Schema.Class<PunCreateParams>("PunCreateParams")({
  misbehavior: Misbehavior
}) {}

export class PunEvaluateError extends Schema.TaggedClass<PunEvaluateError>("PunEvaluateError")("PunEvaluateError", {
  misbehavior: Misbehavior,
  pun: Pun,
  channel: CommunicationChannel
}) {}

export class PunEvaluateParams extends Schema.Class<PunEvaluateParams>("PunEvaluateParams")({
  pun: Pun,
  misbehavior: Misbehavior,
  channel: CommunicationChannel
}) {}
