import { Effect } from "effect"
import { Misbehavior } from "../shared/domain/models.js"
import { ImmunityTokenManager } from "../shared/services/ImmunityTokenManager.js"

export const misbehaviors = [
  Misbehavior.make({
    childName: "Michael Arnaldi",
    category: "DoesNotAppreciateNeovim",
    severity: 5,
    description: (
      "The beautiful Neovim configuration and editor setup provided " +
      "to Michael by Maxwell was severely underappreciated"
    )
  }),
  Misbehavior.make({
    childName: "Sebastian Lorenz",
    category: "TooMuchTimeSpentOnEffectCronModule",
    severity: 2,
    description: (
      "Spent way too much time agonizing over minutia while " +
      "designing the internals of Effect's Cron module"
    )
  }),
  Misbehavior.make({
    childName: "Johannes Schickling",
    category: "GratuitousUseOfRedArrows",
    severity: 3,
    description: (
      "Overutilization of red arrows for emphasis when asking " +
      "others questions about or for assistance with Effect"
    )
  })
]

export const awardDefaultTokens = Effect.gen(function*() {
  const tokenManager = yield* ImmunityTokenManager
  yield* tokenManager.awardToken("Sebastian Lorenz", {
    reason: "Cron is actually a pretty cool module"
  })
})
