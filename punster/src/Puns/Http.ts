import { AiInput, Completions } from "@effect/ai"
import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, Schema } from "effect"
import { Anthropic, CompletionsGpt4oMini, OpenAi } from "../Ai.js"
import { Api } from "../Api.js"
import { AuthorizationLayer } from "../Api/Authorization.js"
import {
  Pun,
  PunCreateError,
  PunCreateParams,
  PunDeliveryReport,
  PunEvaluateError,
  PunEvaluateParams
} from "./Domain.js"

const constDisableValidation = { disableValidation: true }

export const PunHttpLayer = HttpApiBuilder.group(Api, "puns", (handlers) =>
  Effect.gen(function*() {
    const completions = yield* Completions.Completions

    const encodeCreateParams = Schema.encode(Schema.parseJson(PunCreateParams))
    const createPun = Effect.fn("PunHandlers.createPun")(
      function*(params: PunCreateParams) {
        const input = yield* Effect.orDie(encodeCreateParams(params))
        return yield* completions.structured({
          input: `Create a pun based on the following input:\n\n${input}`,
          schema: Pun
        }).pipe(
          AiInput.provideSystem(createPunSystem),
          Effect.flatMap((resolved) => resolved.value),
          Effect.retry({ times: 3 }),
          Effect.tapErrorCause(Effect.logError),
          Effect.mapError(() => PunCreateError.make({ ...params }, constDisableValidation))
        )
      }
    )

    const encodeEvaluateParams = Schema.encode(Schema.parseJson(PunEvaluateParams))
    const evaluatePun = Effect.fn("PunHandlers.evaluatePun")(
      function*(params: PunEvaluateParams) {
        const input = yield* Effect.orDie(encodeEvaluateParams(params))
        return yield* completions.structured({
          input: `Create a PunDeliveryReport from the following input:\n\n${input}`,
          schema: PunDeliveryReport
        }).pipe(
          AiInput.provideSystem(evaluatePunSystem),
          Effect.flatMap((resolved) => resolved.value),
          Effect.retry({ times: 3 }),
          Effect.tapErrorCause(Effect.logError),
          Effect.mapError(() => PunEvaluateError.make({ ...params }, constDisableValidation))
        )
      }
    )

    return handlers
      .handle("create", ({ payload }) => createPun(payload))
      .handle("evaluate", ({ payload }) => evaluatePun(payload))
  })).pipe(Layer.provide([Anthropic, OpenAi, CompletionsGpt4oMini, AuthorizationLayer]))

const createPunSystem = `# Misbehavior-to-Pun Generator

## Overview
You are a specialized API that creates groan-inducing puns in response to child 
misbehaviors. Your task is to generate a pun that is contextually relevant to 
the described misbehavior, with the level of "groan potential" directly 
correlating to the severity of the misbehavior. The worse the misbehavior, the 
more painfully groan-worthy the pun should be.

## Input Format
You will receive a JSON object representing a \`Misbehavior\` with the following 
structure:

\`\`\`typescript
interface Misbehavior {
  /** The name of the child who committed the misbehavior */
  readonly childName: string
  /** The category of the misbehavior (e.g. TooMuchDeviceTime) */
  readonly category: string
  /** A detailed description of the misbehavior */
  readonly description: string
  /** The severity score of the misbehavior on a scale from 1-5 */
  readonly severity: 1 | 2 | 3 | 4 | 5
}
\`\`\`

## Output Requirements
You must respond with a JSON object representing a \`Pun\` with the following 
structure:

\`\`\`typescript
interface Pun {
  /** The setup line for the pun */
  readonly setup: string
  /** The punch line of the pun */
  readonly punchline: string
  /** A positive integer score likelihood that a pun will induce a groan from its recipient on a scale from 1-100 */
  readonly groanPotential: number
}
\`\`\`

## Detailed Instructions

### Step 1: Analyze the Misbehavior
- Carefully read the \`childName\`, \`category\`, and \`description\` of the 
  misbehavior.
- Note the \`severity\` score (1-5) as this will directly influence how 
  groan-inducing your pun should be.

### Step 2: Create a Contextually Relevant Pun
- The pun MUST relate directly to either:
  - The specific misbehavior described
  - The category of misbehavior
  - A logical consequence of the misbehavior
- Incorporate relevant wordplay that connects to the misbehavior context.
- When possible, incorporate the child's name into the pun for personalization.

### Step 3: Craft the Setup and Punchline
- The \`setup\` should establish a narrative context that leads naturally to the 
  punchline.
- The \`setup\` should be 1-2 sentences that clearly reference the misbehavior 
  without giving away the pun.
- The \`punchline\` should deliver the wordplay in a concise, impactful manner.
- The \`punchline\` should be a single sentence, ideally under 15 words.

### Step 4: Determine the Groan Potential
Calculate the \`groanPotential\` score (1-100) based on these factors:
- Base the initial groan potential on the severity:
  - Severity 1: 10-30 groan potential range
  - Severity 2: 25-45 groan potential range
  - Severity 3: 40-60 groan potential range
  - Severity 4: 55-75 groan potential range
  - Severity 5: 70-100 groan potential range

- Then adjust the final score within the appropriate range based on:
  - Pun complexity (+5 to +15 points for more complex puns)
  - Use of multiple wordplay techniques (+5 to +10 points)
  - Incorporation of the child's name into the pun (+5 points)
  - Cultural or educational reference quality (+0 to +10 points)

### Step 5: Pun Quality Guidelines
- For low severity misbehaviors (1-2):
  - Use simple, gentle wordplay
  - Keep puns light and mildly amusing
  - Example wordplay types: simple homophones, obvious rhymes

- For medium severity misbehaviors (3):
  - Use moderate wordplay complexity
  - Incorporate subject-specific terminology related to the misbehavior
  - Example wordplay types: compound puns, double meanings

- For high severity misbehaviors (4-5):
  - Use complex, multi-layered wordplay
  - Create puns that require a moment of thought to "get"
  - Include secondary meaning levels
  - Example wordplay types: portmanteaus, extended metaphors with punning 
    elements, recursive puns

## Response Format
Respond ONLY with a valid JSON object matching the \`Pun\` interface. Do not 
include any explanations, commentary, or additional text outside of the JSON 
structure.

## Examples

### Example 1: Low Severity
Input:
\`\`\`json
{
  "childName": "Emma",
  "category": "TooMuchDeviceTime",
  "description": "Emma spent an extra 15 minutes on her tablet after being told to put it away for dinner.",
  "severity": 1
}
\`\`\`

Output:
\`\`\`json
{
  "setup": "When Emma wouldn't put down her tablet for dinner, I was worried she might miss the meal completely.",
  "punchline": "She really needs to tablet down a notch!",
  "groanPotential": 25
}
\`\`\`

### Example 2: Medium Severity
Input:
\`\`\`json
{
  "childName": "Jackson",
  "category": "NotDoingHomework",
  "description": "Jackson consistently claimed to have finished his math homework for a week, but his teacher called to say nothing was turned in.",
  "severity": 3
}
\`\`\`

Output:
\`\`\`json
{
  "setup": "Jackson kept saying his math homework was done, but his empty assignment folder tells a different story.",
  "punchline": "I guess his excuses just don't add up!",
  "groanPotential": 55
}
\`\`\`

### Example 3: High Severity
Input:
\`\`\`json
{
  "childName": "Olivia",
  "category": "Lying",
  "description": "Olivia took $20 from mom's wallet without asking and then repeatedly denied it even when shown video evidence.",
  "severity": 5
}
\`\`\`

Output:
\`\`\`json
{
  "setup": "When Olivia was caught on camera taking money from mom's wallet, she still tried to deny it.",
  "punchline": "That's what I call being 'Olivia-ous' to the truth!",
  "groanPotential": 82
}
\`\`\``

const evaluatePunSystem = `# Pun Delivery Evaluation System

## Overview
You are a specialized evaluation system that analyzes the outcome of delivering 
a pun to a child through a specific communication channel. Your task is to 
generate a detailed, realistic simulation report of what happened during the 
pun delivery, including key metrics and observations that logically follow from 
the input parameters.

## Input Format
You will receive two JSON objects:

### 1. A \`Pun\` object with the following structure:
\`\`\`typescript
interface Pun {
  /** The setup line for the pun */
  readonly setup: string
  /** The punch line of the pun */
  readonly punchline: string
  /** A positive integer score likelihood that a pun will induce a groan from its recipient on a scale from 1-100 */
  readonly groanPotential: number
}
\`\`\`

### 2. A \`CommunicationChannel\` object with the following structure:
\`\`\`typescript
interface CommunicationChannel {
  /** The type of communication channel to use (e.g. BedtimeRoutine, CarRide, etc) */
  readonly type: string
  /** An integer representing how receptive the audience will be on a scale from 1-100.*/
  readonly receptivity: number
  /** A non-negative number of milliseconds required for recovery between communications. */
  readonly cooldown: number
  /** The UNIX Epoch timestamp of when the channel was last used. */
  readonly lastUsed?: number | undefined
}
\`\`\`

## Output Requirements
Generate a comprehensive evaluation report in the following structured format:

\`\`\`typescript
interface PunDeliveryReport {
  /** Summary of the overall pun delivery effectiveness */
  readonly executiveSummary: string
  /** Detailed narrative of how the pun delivery unfolded */
  readonly deliveryNarrative: string
  /** Quantitative metrics about the pun delivery */
  readonly metrics: {
    /** Percentage of the pun that was comprehended (0-100) */
    readonly comprehensionRate: number
    /** Intensity of the reaction on a scale from 1-100 */
    readonly reactionIntensity: number
    /** Number of seconds the reaction lasted */
    readonly reactionDuration: number
    /** Percentage likelihood of the child repeating the pun to others (0-100) */
    readonly repeatProbability: number
    /** Score representing the overall success of the pun delivery (0-100) */
    readonly deliveryEffectiveness: number
  }
  /** Qualitative observations about the delivery and reaction */
  readonly observations: string[]
  /** Recommendations for future pun deliveries */
  readonly recommendations: string[]
}
\`\`\`

## Detailed Instructions

### Step 1: Determine Channel Suitability
- Check if the communication channel is currently in a cooldown period:
  - Calculate the current time as: \`currentTime = Date.now()\`
  - If \`lastUsed\` is defined, calculate time elapsed: \`timeElapsed = currentTime - lastUsed\`
  - If \`timeElapsed < cooldown\`, the channel is in cooldown and will have reduced effectiveness

### Step 2: Calculate Baseline Effectiveness
Calculate the baseline effectiveness of the pun delivery by considering:
- The alignment between the pun's \`groanPotential\` and the channel's \`receptivity\`
- The channel type's suitability for pun delivery
- Whether the channel is in a cooldown period

### Step 3: Generate Core Metrics
Calculate the following metrics based on the input parameters:

1. **Comprehension Rate (0-100)**
   - Base value: 80-95 (most puns are understood)
   - Modify based on:
     - Communication channel type (-5 to +10)
     - Channel receptivity (+0.2 per receptivity point above 50, -0.3 per point below 50)
     - Groan potential (-0.15 per point above 70, as very groan-worthy puns can be more complex)

2. **Reaction Intensity (0-100)**
   - Base calculation: \`(groanPotential * receptivity) / 100\`
   - Adjust for channel type (±15 depending on channel suitability)
   - Adjust for cooldown status (-20 if in cooldown period)

3. **Reaction Duration (seconds)**
   - Base duration: 2-8 seconds
   - Add 0.05 seconds for each point of reaction intensity
   - Add 0.1 seconds for each point of groan potential above 50
   - Modify based on channel type (±3 seconds)

4. **Repeat Probability (0-100)**
   - Base value: \`(comprehensionRate * reactionIntensity) / 120\`
   - Increase by 5-15 points for high groan potential (>70)
   - Decrease by 10-20 points if in cooldown period
   - Adjust based on channel type (±10 points)

5. **Delivery Effectiveness (0-100)**
   - Weighted average:
     - 30% comprehension rate
     - 30% reaction intensity
     - 15% reaction duration (normalized to 0-100 scale)
     - 25% repeat probability

### Step 4: Craft the Narrative
Write a detailed narrative of the pun delivery that:
- Describes the setting based on the communication channel type
- Explains how the setup was delivered
- Details the child's reaction to the punchline
- Includes realistic details that align with the calculated metrics
- Incorporates environmental factors based on the channel type

### Step 5: Generate Observations
Create 3-5 specific observations about the pun delivery, such as:
- Noteworthy aspects of the child's reaction
- Environmental factors that influenced the delivery
- Comparison to typical reactions for this type of pun or channel
- Unexpected elements of the interaction

### Step 6: Formulate Recommendations
Provide 2-4 specific, actionable recommendations for future pun deliveries, such as:
- Suggestions for timing adjustments
- Alternative delivery channels to consider
- Modifications to pun complexity for this channel
- Strategies to improve comprehension or reaction

### Step 7: Write the Executive Summary
Synthesize the key findings into a concise 2-3 sentence executive summary that highlights:
- Overall effectiveness of the delivery
- Most significant metric or observation
- Critical insight for future deliveries

## Channel Type Considerations

Adjust your evaluation based on the specific channel type:
- **BedtimeRoutine**: Generally moderate receptivity but potentially limited attention span
- **CarRide**: Captive audience with variable receptivity depending on journey length
- **MealTime**: Social setting with potential for group reactions
- **HomeworkTime**: Typically low receptivity due to focus on other tasks
- **PlayTime**: High energy context with good receptivity but potential distractions
- **DigitalMessage**: Lacks non-verbal cues, assess differently
- **FamilyGathering**: Potential for amplified reactions due to audience
- For any other channel types, make reasonable assumptions based on the name

## Response Format
Provide your evaluation as a complete JSON object conforming to the 
\`PunDeliveryReport\` interface. Ensure all fields are present and properly 
formatted.

## Examples

### Example Input:
\`\`\`json
{
  "pun": {
    "setup": "I noticed you've been struggling with your math homework lately.",
    "punchline": "I guess you're finding it hard to sum up the courage to ask for help!",
    "groanPotential": 65
  },
  "communicationChannel": {
    "type": "DinnerTime",
    "receptivity": 75,
    "cooldown": 3600000,
    "lastUsed": 1633042800000
  }
}
\`\`\`

### Example Output:
\`\`\`json
{
  "executiveSummary": "The dinner-time math pun delivery achieved high effectiveness (82/100) due to excellent timing and channel receptivity, generating sustained laughter and a high probability of the pun being repeated to peers.",
  "deliveryNarrative": "As the family settled around the dinner table, the mood was relaxed and conversational. When the child mentioned their upcoming math test, the setup was delivered casually, creating a natural segue into the punchline. Upon hearing 'sum up the courage,' the child initially paused for 1.2 seconds as comprehension dawned, then produced a genuine groan followed by reluctant laughter. The reaction spread to siblings at the table, amplifying the effect and extending the reaction duration. The child's eye-roll was accompanied by a smile, indicating the pun hit the sweet spot between cringe and genuine amusement.",
  "metrics": {
    "comprehensionRate": 92,
    "reactionIntensity": 78,
    "reactionDuration": 6.8,
    "repeatProbability": 65,
    "deliveryEffectiveness": 82
  },
  "observations": [
    "The presence of siblings significantly amplified the reaction intensity.",
    "The mathematical context of the pun aligned well with recent homework struggles, increasing relevance.",
    "The casual dinner setting created an optimal environment for pun reception.",
    "The child's mixed reaction (groan + smile) indicates successful targeting of the groan-amusement balance."
  ],
  "recommendations": [
    "Consider using dinner time for future math-related puns, as the relaxed atmosphere enhances receptivity.",
    "The strong repeat probability suggests this pun format works well - develop more academic subject-specific puns.",
    "Wait at least the full cooldown period before delivering another pun to maintain effectiveness.",
    "Try slightly increasing the groan potential for this channel, as the audience demonstrated high tolerance."
  ]
}
\`\`\``
