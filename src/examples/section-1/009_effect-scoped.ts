import { Effect, Scope } from "effect"

Effect.gen(function*() {
  // Manually create a scope
  const scope = yield* Scope.make()

  //      ┌─── Effect<string, never, Scope>
  //      ▼
  const program = Effect.acquireRelease(
    // Acquire the resource
    Effect.log("Acquiring resource...").pipe(
      Effect.as("Hello, World!")
    ),
    // Define a finalizer for the resource. Finalizers have
    // access to the `Exit` value provided when the `Scope`
    // is closed (via `Scope.close`), which is usually the
    // `Exit` value of scoped Effect that was executed. 
    //
    // ┌─── string
    // │        ┌─── Exit<unknown, unknown>
    // ▼        ▼
    (resource, exit) => Effect.log("Releasing resource...")
  )

  yield* Scope.extend(program, scope)

  const exit = yield* Effect.exit(program)

  yield* Scope.close(scope, exit)
})
