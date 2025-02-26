import { HttpBody, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Doc } from "@effect/printer"
import { Ansi, AnsiDoc } from "@effect/printer-ansi"
import { Config, Context, Duration, Effect, flow, Layer, Match, ParseResult } from "effect"
import { ChildImmuneError, MalformedPunError, PunsterFetchError } from "../domain/errors.js"
import type { Channel, Misbehavior } from "../domain/models.js"
import { Pun, PunDeliveryReport } from "../domain/models.js"
import { ImmunityTokenManager, ImmunityTokenManagerLayer } from "./ImmunityTokenManager.js"

export class PunsterClient extends Context.Tag("Punsterclient")<PunsterClient, {
  readonly createPun: (
    misbehavior: Misbehavior
  ) => Effect.Effect<Pun, ChildImmuneError | MalformedPunError | PunsterFetchError>
  readonly evaluatePun: (
    pun: Pun,
    misbehavior: Misbehavior,
    channel: Channel
  ) => Effect.Effect<string, PunsterFetchError>
}>() {}

export const makePunsterClient = Effect.gen(function*() {
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
        body: HttpBody.unsafeJson({ pun, misbehavior, channel })
      }).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(PunDeliveryReport)),
        Effect.map((response) => createReport(response)),
        Effect.mapError((cause) => new PunsterFetchError({ cause }))
      )
    },
    (effect, pun) => Effect.annotateLogs(effect, { ...pun })
  )

  return {
    createPun,
    evaluatePun
  } as const // Using "as const" to keep the types readonly and strict
})

export const PunsterClientLayer = Layer.effect(
  PunsterClient,
  makePunsterClient
).pipe(Layer.provide(ImmunityTokenManagerLayer))

const colorFromPercentage = Match.type<number>().pipe(
  Match.when((n) => n < 40, () => Ansi.red),
  Match.when((n) => n < 70, () => Ansi.yellow),
  Match.orElse(() => Ansi.green)
)

function formatMetricValue(
  value: number,
  maxValue: number = 100
): AnsiDoc.AnsiDoc {
  const percentage = (value / maxValue) * 100
  const color = colorFromPercentage(percentage)
  const formattedValue = value.toFixed(1).padStart(4, " ")
  return Doc.text(formattedValue).pipe(Doc.annotate(color))
}

function formatProgressBar(
  value: number,
  maxValue: number = 100,
  length: number = 20
): AnsiDoc.AnsiDoc {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100))
  const filledLength = Math.round((length * percentage) / 100)
  const emptyLength = length - filledLength
  const color = colorFromPercentage(percentage)
  const bar = "█".repeat(filledLength)
  const empty = " ".repeat(emptyLength)
  return Doc.text(bar).pipe(
    Doc.cat(Doc.text(empty)),
    Doc.squareBracketed,
    Doc.annotate(color),
    Doc.catWithSpace(Doc.text(percentage.toFixed(1)))
  )
}

function formatMetric(title: string, metric: number): AnsiDoc.AnsiDoc {
  return Doc.hcat([
    Doc.text(title).pipe(Doc.annotate(Ansi.underlined)),
    Doc.colon,
    Doc.spaces(5),
    formatMetricValue(metric),
    Doc.space,
    formatProgressBar(metric)
  ])
}

function formatSubheader(title: string): AnsiDoc.AnsiDoc {
  return Doc.text(title).pipe(
    Doc.annotate(Ansi.combine(Ansi.bold, Ansi.blue))
  )
}

/**
 * Formats a `PunDeliveryReport` into a detailed textual report suitable for
 * console output.
 *
 * @param report The `PunDeliveryReport` to format
 * @returns A formatted string ready to be printed to the console
 */
function createReport(report: PunDeliveryReport): string {
  // Utilities

  const horizontalBar = Doc.text("━".repeat(80))
  const divider = Doc.text("-".repeat(80)).pipe(
    Doc.annotate(Ansi.blackBright),
    Doc.surround(Doc.hardLine, Doc.hardLine)
  )

  // Header

  const header = Doc.vcat([
    Doc.empty,
    horizontalBar,
    Doc.text("                            PUN DELIVERY REPORT                                "),
    horizontalBar,
    Doc.empty
  ]).pipe(Doc.annotate(Ansi.combine(Ansi.bold, Ansi.cyan)))

  // Executive Summary

  const executiveSummary = Doc.vcat([
    formatSubheader("EXECUTIVE SUMMARY"),
    Doc.empty,
    ...makeLines(report.executiveSummary, 80).map((line) => Doc.text(line))
  ])

  // Delivery Narrative

  const deliveryNarrative = Doc.vcat([
    formatSubheader("DELIVERY NARRATIVE"),
    Doc.empty,
    ...makeLines(report.deliveryNarrative, 80).map((line) => Doc.text(line))
  ])

  // Metric Analysis

  const overallEffectiveness = Doc.catWithSpace(
    Doc.text("Overall Effectiveness").pipe(Doc.annotate(Ansi.combine(Ansi.bold, Ansi.magenta))),
    formatProgressBar(report.metrics.deliveryEffectiveness)
  )
  const comprehensionRate = formatMetric("Comprehension Rate", report.metrics.comprehensionRate)
  const reactionIntensity = formatMetric("Reaction Intensity", report.metrics.reactionIntensity)
  const reactionDuration = formatMetric("Reaction Duration ", Duration.toSeconds(report.metrics.reactionDuration))
  const repeatProbability = formatMetric("Repeat Probability", report.metrics.repeatProbability)
  const metricAnalysis = Doc.vsep([
    formatSubheader("METRIC ANALYSIS"),
    Doc.empty,
    overallEffectiveness,
    Doc.empty,
    comprehensionRate,
    reactionIntensity,
    reactionDuration,
    repeatProbability
  ])

  // Observations

  const observations = Doc.vcat([
    formatSubheader("OBSERVATIONS"),
    ...report.recommendations.flatMap((observation, index) => {
      const lines = makeLines(observation, 80)
      return [
        Doc.text(`${index + 1}.`).pipe(
          Doc.annotate(Ansi.magenta),
          Doc.cat(Doc.space),
          Doc.cat(Doc.text(lines[0]))
        ),
        ...lines.slice(1).map((line) => Doc.text(`   ${line}`))
      ]
    })
  ])

  // Recommendations

  const recommendations = Doc.vcat([
    formatSubheader("RECOMMENDATIONS"),
    ...report.recommendations.flatMap((recommendation, index) => {
      const lines = makeLines(recommendation, 80)
      return [
        Doc.text(`${index + 1}.`).pipe(
          Doc.annotate(Ansi.magenta),
          Doc.cat(Doc.space),
          Doc.cat(Doc.text(lines[0]))
        ),
        ...lines.slice(1).map((line) => Doc.text(`   ${line}`))
      ]
    })
  ])

  // Footer

  const footer = Doc.vcat([
    Doc.empty,
    horizontalBar,
    Doc.text(`Report generated at: ${new Date().toISOString()}`).pipe(Doc.annotate(Ansi.blackBright)),
    horizontalBar
  ]).pipe(Doc.annotate(Ansi.combine(Ansi.bold, Ansi.cyan)))

  const doc = Doc.vcat([
    header,
    executiveSummary,
    divider,
    deliveryNarrative,
    divider,
    metricAnalysis,
    divider,
    observations,
    divider,
    recommendations,
    footer
  ])

  return AnsiDoc.render(doc, { style: "pretty" })
}

const defaultOptions = { indentation: 3, indentFirstLine: true }
function makeLines(text: string, maxWidth: number, options?: {
  indentation?: number
  indentFirstLine?: boolean
}): ReadonlyArray<string> {
  const config = { ...defaultOptions, ...options }
  const normalizedText = text.trim().replace(/\s+/g, " ")
  if (normalizedText.length === 0) {
    return []
  }
  const words = normalizedText.split(" ")
  const firstLineMaxWidth = config.indentFirstLine ? maxWidth - config.indentation : maxWidth
  const lines: Array<string> = []
  let currentLine = ""
  for (let index = 0; index < words.length; index++) {
    const word = words[index]
    const isFirstWord = index === 0
    const isFirstLine = lines.length === 0
    const currentMaxWidth = isFirstLine ? firstLineMaxWidth : maxWidth
    const lineWithWord = isFirstWord ? word : `${currentLine} ${word}`
    if (isFirstWord || lineWithWord.length <= currentMaxWidth) {
      // Add the word to the current line
      currentLine = lineWithWord
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  // Add the last line if it's not empty
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }
  return lines
}
