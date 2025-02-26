import { Console, Effect } from "effect"

// Performing resourceful operations in Effect adds a `Scope` to
// the program's requirements
//
//           ┌─── Effect<void, never, Scope>
//           ▼
const resourcefulOperation = (label: string) =>
  Effect.acquireRelease(
    Console.log(`Acquiring ${label}`),
    // The below finalizer will be added to the `Scope`
    () => Console.log(`Releasing ${label}`)
  )

// The `Scope` is propagated just like any other requirement.
// Finalizers of each resourceful operation are added to the
// `Scope`, and will be run in reverse order when the `Scope`
// is closed.
//
//       ┌─── Effect<void, never, Scope>
//       ▼
const program = Effect.gen(function*() {
  yield* resourcefulOperation("1") // ◀───────────┐
  yield* resourcefulOperation("2") //  Finalizers Added to Scope
  yield* resourcefulOperation("3") // ◀───────────┘
})

// Providing a `Scope` to the program will erase the `Scope`
// from the requirements and extend that `Scope` to all
// resourceful operations in the program. Remember, the
// finalizers will not be run until the `Scope` is closed.
//
// Here, `Effect.scoped` creates a `Scope`, provides it to
// the program, and closes the `Scope` when the program exits.
//
//       ┌─── Effect<void, never, never>
//       ▼
const runnable = Effect.scoped(program)

Effect.runPromise(runnable)
/*
Output:
Acquiring 1
Acquiring 2
Acquiring 3
Releasing 3
Releasing 2
Releasing 1
*/
