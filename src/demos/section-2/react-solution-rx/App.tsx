import { useRxSuspenseSuccess } from "@effect-rx/rx-react"
import * as React from "react"
import Markdown from "react-markdown"
import { completionRx, completionStreamRx } from "./OpenAi/rx.js"

export function App() {
  return (
    <>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Completions />
      </React.Suspense>

      <hr />

      <React.Suspense fallback={<div>Loading stream...</div>}>
        <CompletionsStream />
      </React.Suspense>
    </>
  )
}

function Completions() {
  const text = useRxSuspenseSuccess(
    completionRx("What is the meaning of life?")
  ).value

  return <Markdown>{text}</Markdown>
}

function CompletionsStream() {
  const chunks = useRxSuspenseSuccess(
    completionStreamRx("What is the meaning of life?")
  ).value

  const text = Array.from(
    chunks,
    (chunk) => chunk.choices[0].delta.content
  ).join("")

  return (
    <>
      <Markdown>{text}</Markdown>
    </>
  )
}
