import { Layer } from "effect"

declare const layer1: Layer.Layer<"Out1", never, "Requirement">
declare const layer2: Layer.Layer<"Requirement", never, "In2">

//       ┌─── Layer<"Out1", never, "In2">
//       ▼
const provided = Layer.provide(layer1, layer2)
