import { NodeRuntime } from "@effect/platform-node"
import { Cause, Effect, Exit, FiberId, FiberSet, Layer, Scope, Stream } from "effect"
import express from "express"
import { TracingLayer } from "../../Tracing.js"
import { OpenAi } from "../shared/OpenAi.js"

class ExpressApp extends Effect.Service<ExpressApp>()("ExpressApp", {
  scoped: Effect.gen(function*() {
    const app = express()
    const scope = yield* Effect.scope

    yield* Effect.acquireRelease(
      Effect.sync(() => app.listen(3000)),
      (server) =>
        Effect.async((resume) => {
          server.close(() => resume(Effect.void))
        })
    )

    // addRoute is a helper function to add routes to the express app
    //
    // It handles the following:
    //
    // - Tracking the Effect fibers using a FiberSet
    // - Adding tracing information to each request
    // - Handling cases where the response has not been sent
    // - Logging any unhandled errors excluding interruptions
    // - Interrupting the fiber if the request is closed
    //
    const addRoute = <E, R>(
      method: "get" | "post" | "put" | "delete",
      path: string,
      handler: (req: express.Request, res: express.Response) => Effect.Effect<void, E, R>
    ): Effect.Effect<void, never, R> =>
      Effect.gen(function*() {
        // create runFork attached to the Layer scope
        const runFork = yield* FiberSet.makeRuntime<R>().pipe(
          Scope.extend(scope)
        )

        app[method](path, (req, res) => {
          const fiber = handler(req, res).pipe(
            // add tracing information to each request
            Effect.withSpan(`Express.route(${method}, ${path})`),
            // handle cases where the response has not been sent
            Effect.onExit((exit) => {
              if (!res.headersSent) {
                res.writeHead(Exit.isSuccess(exit) ? 204 : 500)
              }
              if (!res.writableEnded) {
                res.end()
              }
              // log any unhandled errors excluding interruptions
              if (Exit.isFailure(exit) && !Cause.isInterruptedOnly(exit.cause)) {
                return Effect.annotateLogs(Effect.logWarning("Unhandled error in route", exit.cause), {
                  method,
                  path,
                  headers: req.headers
                })
              }
              return Effect.void
            }),
            runFork
          )

          // if the request is closed, interrupt the fiber
          req.on("close", () => {
            fiber.unsafeInterruptAsFork(FiberId.none)
          })
        })
      })

    return { app, addRoute } as const
  })
}) {}

const Routes = Layer.scopedDiscard(Effect.gen(function*() {
  const { addRoute, app } = yield* ExpressApp
  const ai = yield* OpenAi

  app.get("/", (_req, res) => {
    res.json({ message: "Hello, World!" })
  })

  yield* addRoute(
    "get",
    "/completions",
    Effect.fnUntraced(function*(req, res) {
      const query = req.query.q as string

      res.writeHead(200, { "Content-Type": "text/plain" })

      yield* ai.completion({
        model: "gpt-4o",
        messages: [{ role: "user", content: query }]
      }).pipe(Stream.runForEach((chunk) =>
        Effect.sync(
          () => res.write(chunk.choices[0].delta.content!)
        )
      ))

      res.end()
    })
  )
})).pipe(Layer.provide([ExpressApp.Default, OpenAi.Default]))

Routes.pipe(
  Layer.provide(TracingLayer),
  Layer.launch,
  NodeRuntime.runMain
)
