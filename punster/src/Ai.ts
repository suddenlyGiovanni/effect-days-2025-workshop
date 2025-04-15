import { AnthropicClient } from "@effect/ai-anthropic"
import { OpenAiClient, OpenAiCompletions } from "@effect/ai-openai"
import { Config, Layer } from "effect"

export const Anthropic = AnthropicClient.layerConfig({
  apiKey: Config.redacted("ANTHROPIC_API_KEY")
})

export const OpenAi = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENAI_API_KEY"),
  organizationId: Config.redacted("OPENAI_ORGANIZATION_ID"),
  projectId: Config.redacted("OPENAI_PROJECT_ID")
})

export const CompletionsGpt4oMini = OpenAiCompletions.layerCompletions({
  model: "gpt-4o-mini"
}).pipe(Layer.provide(OpenAi))
