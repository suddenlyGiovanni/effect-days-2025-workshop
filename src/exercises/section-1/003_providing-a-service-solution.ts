import { Effect } from "effect"
import { Misbehavior, Pun } from "./shared/domain/models.js"
import { PunsterClient } from "./shared/services/PunsterClient.js"

/**
 * **Solution Explanation**:
 *
 * The first step is to create a test implementation of the `PunsterClient`. In
 * my solution, I've chosen to define a static implementation, but you could
 * create the test implementation however you like.
 *
 * Then, I use `Effect.provideService` to provide my test implementation of the
 * `PunsterClient` to the `main` program, associating it with the `PunsterClient`
 * `Tag`.
 *
 * Take note of the fact that the dependency injection capabilities of Effect
 * make it exceptionally easy to test how business logic interacts with services.
 *
 * For example, if we wanted to test if our business logic functions properly in
 * response to errors coming from the `PunsterClient`, we could simply provide
 * an implementation that always returns a particular error.
 */

const testPun = Pun.make({
  setup: "The setup",
  punchline: "The punchline",
  groanPotential: 50
})

const testEvaluation = "Pun Evaluation Report"

export const main = Effect.gen(function*() {
  const punster = yield* PunsterClient
  yield* punster.createPun(Misbehavior.make({
    childName: "Testy McTesterson",
    category: "TestCategory",
    description: "A test misbehavior",
    severity: 1
  }))
}).pipe(
  Effect.provideService(PunsterClient, {
    createPun: () => Effect.succeed(testPun),
    evaluatePun: () => Effect.succeed(testEvaluation)
  })
)
