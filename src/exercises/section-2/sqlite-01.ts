import { NodeRuntime } from "@effect/platform-node"
import Sqlite from "better-sqlite3"
import { Effect, Schema } from "effect"

export class SqlClient extends Effect.Service<SqlClient>()("SqlClient", {
  scoped: Effect.gen(function*() {
    // TODO: add a `use` and `query` method
    //
    return {} as const
  })
}) {}

export class SqlError extends Schema.TaggedError<SqlError>()("SqlError", {
  cause: Schema.Defect
}) {}

// usage

Effect.gen(function*() {
  const sql = yield* SqlClient

  yield* sql.query("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
  yield* sql.query("INSERT INTO users (name) VALUES (?)", "Alice")

  const users = yield* sql.query<{ id: number; name: string }>("SELECT * FROM users")

  yield* Effect.log(users)
}).pipe(
  Effect.provide(SqlClient.Default),
  NodeRuntime.runMain
)
