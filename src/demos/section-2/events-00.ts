import { NodeRuntime } from "@effect/platform-node"
import { Effect, Stream } from "effect"

const emitter = new EventTarget()

// TODO: Create a stream that listens to click events
declare const onClick: Stream.Stream<Event>

// usage

Effect.gen(function*() {
  yield* onClick.pipe(
    Stream.runForEach(Effect.log),
    Effect.fork
  )
  yield* Effect.yieldNow()

  emitter.dispatchEvent(new Event("click"))
  emitter.dispatchEvent(new Event("click"))

  yield* Effect.sleep(1000)
}).pipe(NodeRuntime.runMain)
