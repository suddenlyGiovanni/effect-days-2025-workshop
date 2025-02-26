import { Layer } from "effect"

declare const layer1: Layer.Layer<"Out1", never, "In1">
declare const layer2: Layer.Layer<"Out2", never, "In2">

//      ┌─── Layer<"Out1" | "Out2", never, "In1" | "In2">
//      ▼
const merged = Layer.merge(layer1, layer2)
