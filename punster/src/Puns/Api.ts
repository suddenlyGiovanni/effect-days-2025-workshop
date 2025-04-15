import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "@effect/platform"
import { Authorization } from "../Api/Authorization.js"
import {
  Pun,
  PunCreateError,
  PunCreateParams,
  PunDeliveryReport,
  PunEvaluateError,
  PunEvaluateParams
} from "./Domain.js"

export class PunsApi extends HttpApiGroup.make("puns")
  .add(
    HttpApiEndpoint.post("create", "/create")
      .setPayload(PunCreateParams)
      .addError(PunCreateError)
      .addSuccess(Pun)
  )
  .add(
    HttpApiEndpoint.post("evaluate", "/evaluate")
      .setPayload(PunEvaluateParams)
      .addError(PunEvaluateError)
      .addSuccess(PunDeliveryReport)
  )
  .middleware(Authorization)
  .prefix("/puns")
  .annotate(OpenApi.Title, "Puns")
{}
