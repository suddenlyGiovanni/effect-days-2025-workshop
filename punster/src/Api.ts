import { HttpApi, OpenApi } from "@effect/platform"
import { PunsApi } from "./Puns/Api.js"

export class Api extends HttpApi.make("Api")
  .add(PunsApi)
  .annotate(OpenApi.Title, "Puns API")
{}
