import { NodeRuntime } from "@effect/platform-node"
import { Effect, FiberSet, Stream } from "effect"
import express from "express"
import { OpenAi } from "../shared/OpenAi.js"

// TODO: Migrate to use Layer's

// TODO: addRoute helper function
//
// It should handle the following:
//
// - Tracking the Effect fibers using a FiberSet
// - Adding tracing information to each request
// - Handling cases where the response has not been sent
// - Logging any unhandled errors excluding interruptions
// - Interrupting the fiber if the request is closed

Effect.gen(function*() {
  const ai = yield* OpenAi

  const runFork = yield* FiberSet.makeRuntime()
  const app = express()

  app.get("/", (_req, res) => {
    res.json({ message: "Hello, World!" })
  })

  app.get("/completion", (req, res) => {
    const query = req.query.q as string
    runFork(
      Effect.gen(function*() {
        res.writeHead(200, { "Content-Type": "text/plain" })

        yield* ai.completion({
          model: "gpt-4o",
          messages: [{ role: "user", content: query }]
        }).pipe(
          Stream.runForEach((chunk) =>
            Effect.sync(() => {
              res.write(chunk.choices[0].delta.content!)
            })
          )
        )

        res.end()
      })
    )
  })

  yield* Effect.acquireRelease(
    Effect.sync(() => app.listen(3000)),
    (server) =>
      Effect.async((resume) => {
        server.close(() => resume(Effect.void))
      })
  )

  yield* Effect.never
}).pipe(
  Effect.scoped,
  Effect.provide(OpenAi.Default),
  NodeRuntime.runMain
)
