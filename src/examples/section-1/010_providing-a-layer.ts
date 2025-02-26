import { Context, Effect, Layer, Scope } from "effect"

// Service Definition
class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly doStuff: Effect.Effect<void> }
>() {}

// Layer Definition
const MyServiceLayer = Layer.succeed(
  MyService,
  { doStuff: Effect.log("Doing stuff!") }
)

Effect.gen(function*() {
  // A program which requires a `MyService` to be run.
  //
  //      ┌─── Effect<void, never, MyService>
  //      ▼
  const program = Effect.gen(function*() {
    const myService = yield* MyService
    yield* myService.doStuff
  })

  // -------------------------------------------------
  // Simulate Effect.provide(MyServiceLayer)
  // -------------------------------------------------

  // Manually create a scope
  const scope = yield* Scope.make()

  // Use `Layer.build` to create an `Effect` that can be run
  // to obtain the resolved dependency graph as a `Context`.
  //
  //      ┌─── Effect<Context<MyService>, never, Scope>
  //      ▼
  const layerBuilder = Layer.build(MyServiceLayer)

  // Build a `Context` from the `Layer` containing all
  // the services in the `Layer`'s dependency graph.
  //
  //      ┌─── Context<MyService>
  //      ▼
  const context = yield* Scope.extend(layerBuilder, scope)

  // Provide the built `Context` to the `program` to
  // satisfy all of `program`'s requirements.
  //
  //       ┌─── Effect<void, never, never>
  //       ▼
  const runnable = Effect.provide(program, context)

  // Run the program and obtain its exit value
  const exit = yield* Effect.exit(runnable)

  // Close the scope
  yield* Scope.close(scope, exit)
})
