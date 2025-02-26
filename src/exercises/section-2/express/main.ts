import Sqlite from "better-sqlite3"
import express from "express"

// TODO list:
//
// 1. Wrap express app with Effect, without changing any the request handlers
// 2. Add an route for updating a user by id, using a Effect request handler
//   2.1. Use `SqlClient` from previous exercise to interact with sqlite database
// 3. Convert the existing request handlers to use Effect
//
// Optional challenges:
//
// - Add error handling to return 500 status code on database errors, and log
//   the errors
//   - Return 404 status code when a user is not found
//
// - Add tracing spans for each request
//
// - Parse the request parameters using "effect/Schema"
//   - Encode the responses using "effect/Schema"
//
// - Migrate to `HttpApi` from "@effect/platform"
//
// Advanced challenges:
//
// - Create a SqlClient .withTransaction method, and use it for the POST /users
//   route
//   - Bonus points if it supports nested transactions with savepoints
//

// setup sqlite

const db = new Sqlite(":memory:")
db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
for (let i = 0; i < 30; i++) {
  db.prepare("INSERT INTO users (name) VALUES (?)").run(`User ${i}`)
}

// setup express

const app = express()

// inject db into express context
declare global {
  namespace Express {
    interface Locals {
      db: Sqlite.Database
    }
  }
}
app.locals.db = db

app.use(express.json())

app.get("/users", async (_req, res) => {
  const users = db.prepare("SELECT * FROM users").all()
  res.json(users)
})

app.post("/users", async (req, res) => {
  const { name } = req.body
  const id = db.prepare("INSERT INTO users (name) VALUES (?)").run(name).lastInsertRowid
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id)
  res.json(user)
})

app.get("/users/:id", async (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id)
  if (!user) {
    res.status(404).end()
    return
  }
  res.json(user)
})

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000")
})
