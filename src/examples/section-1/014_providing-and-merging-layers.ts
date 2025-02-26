import { Layer } from "effect"

declare const layer1: Layer.Layer<"Out1", never, "Requirement">
declare const layer2: Layer.Layer<"Requirement", never, "In2">

//         ┌─── Layer<"Out1" | "Requirement", never, "In2">
//         ▼
const providedAndMerged = Layer.provideMerge(layer1, layer2)
