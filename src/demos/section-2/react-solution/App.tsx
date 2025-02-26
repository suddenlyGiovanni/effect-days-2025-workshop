import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query"
import { Array, Effect, pipe, Stream } from "effect"
import * as React from "react"
import Markdown from "react-markdown"
import { OpenAi } from "./OpenAi.js"
import { makeReactRuntime } from "./Runtime.jsx"

const queryClient = new QueryClient()

const OpenAiRuntime = makeReactRuntime(() => OpenAi.Default)

export function App() {
  return (
    <OpenAiRuntime.Provider>
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Completions />
        </React.Suspense>

        <hr />

        <CompletionsStream />
      </QueryClientProvider>
    </OpenAiRuntime.Provider>
  )
}

function Completions() {
  const completion = useSuspenseQuery(
    OpenAiRuntime.useQueryOptions(
      ["completions"],
      Effect.gen(function*() {
        const openai = yield* OpenAi
        return yield* openai.use((client) =>
          client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "user", content: "What is the meaning of life?" }
            ]
          })
        )
      })
    )
  ).data
  const text = completion.choices[0].message.content

  return <Markdown>{text}</Markdown>
}

function CompletionsStream() {
  const runtime = OpenAiRuntime.use()
  const [chunks, setChunks] = React.useState(Array.empty<string>())

  React.useEffect(
    () =>
      runtime.runCallback(
        Effect.gen(function*() {
          const openai = yield* OpenAi
          return openai.completion({
            model: "gpt-4o",
            messages: [
              { role: "user", content: "What is the meaning of life?" }
            ]
          })
        }).pipe(
          Stream.unwrap,
          Stream.accumulate,
          Stream.runForEach((chunk) =>
            Effect.sync(() => {
              setChunks(
                pipe(
                  Array.fromIterable(chunk),
                  Array.map((c) => c.choices[0].delta.content!)
                )
              )
            })
          )
        )
      ),
    [runtime]
  )
  const text = chunks.join("")

  return <Markdown>{text === "" ? "Loading stream..." : text}</Markdown>
}
