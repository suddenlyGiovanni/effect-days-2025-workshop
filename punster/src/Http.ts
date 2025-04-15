import { HttpApiBuilder, HttpApiScalar, HttpMiddleware, HttpServer } from "@effect/platform"
import { NodeHttpClient, NodeHttpServer } from "@effect/platform-node"
import { Layer } from "effect"
import { createServer } from "node:http"
import { Api } from "./Api.js"
import { PunHttpLayer } from "./Puns/Http.js"

const ApiLayer = HttpApiBuilder.api(Api).pipe(
  Layer.provide(PunHttpLayer)
)

export const HttpLayer = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiScalar.layer()),
  Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLayer),
  Layer.provide(NodeHttpClient.layerUndici),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)
