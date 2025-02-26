import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query"
import { Array } from "effect"
import * as React from "react"
import Markdown from "react-markdown"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Completions />
      </React.Suspense>

      <hr />

      <CompletionsStream />
    </QueryClientProvider>
  )
}

function Completions() {
  // TODO: Integrate the OpenAi Effect.Service with react query
  const completion = useSuspenseQuery({
    queryKey: ["completion"],
    queryFn: () =>
      Promise.resolve({
        choices: [
          {
            index: 0,
            message: {
              content: "Hello, how can I help you today?"
            }
          }
        ]
      })
  }).data

  return (
    <div>
      {completion.choices.map((choice) => <div key={choice.index}>{choice.message.content}</div>)}
    </div>
  )
}

function CompletionsStream() {
  const [chunks, setChunks] = React.useState(Array.empty<string>())

  // TODO: Consume effect Stream to update completion result
  React.useEffect(() => {}, [])
  const text = chunks.join("")

  return <Markdown>{text === "" ? "Loading stream..." : text}</Markdown>
}
