import { Layer } from "effect"

/**
 * **Todo List**:
 * In these exercises, you'll practice combining layers using:
 * - `Layer.merge`: Combines two layers, merging their outputs and requirements
 * - `Layer.provide`: Satisfies the requirements of one layer with the outputs
 *   of another
 * - `Layer.provideMerge`: Combines `Layer.provide` and `Layer.merge`
 *
 * Each exercise provides you with a target `Layer` type to achieve using the
 * layers available in this file.
 *
 * **Note**: You can feel free to use solutions from previous exercises to
 * solve subsequent ones.
 *
 * Feel free to split layer declarations into multiple variables if it helps
 * you, but it's not required.
 */

// Base layers to use in all exercises
export declare const DatabaseLayer: Layer.Layer<"Database", "DbError", "Config">
export declare const LoggingLayer: Layer.Layer<"Logging", "LogError", "Config">
export declare const ConfigLayer: Layer.Layer<"Config", "ConfigError", never>
export declare const CacheLayer: Layer.Layer<"Cache", "CacheError", "Database">
export declare const AuthLayer: Layer.Layer<"Auth", "AuthError", "Database" | "Config">
export declare const ApiLayer: Layer.Layer<"Api", "ApiError", "Auth" | "Cache">
export declare const MetricsLayer: Layer.Layer<"Metrics", "MetricsError", "Logging">
export declare const NotificationLayer: Layer.Layer<"Notification", "NotifyError", "Logging" | "Config">

// ===========================
// Exercise 1
// ===========================

// Target: Layer<"Config" | "Logging", "ConfigError" | "LogError", never>

export const exercise1 = LoggingLayer.pipe(Layer.provideMerge(ConfigLayer))

// ===========================
// Exercise 2
// ===========================

// Target: Layer<"Database", "DbError" | "ConfigError", never>

export const exercise2 = Layer.provide(DatabaseLayer, ConfigLayer) // Your solution here

// ===========================
// Exercise 3
// ===========================

// Target: Layer<"Cache", "CacheError" | "DbError" | "ConfigError", never>

export const exercise3 = CacheLayer.pipe(
  // Your solution here
  Layer.provide(DatabaseLayer),
  Layer.provide(ConfigLayer)
)

// ===========================
// Exercise 4
// ===========================

// Target: Layer<"Auth", "AuthError" | "ConfigError" | "DbError", never>

export const exercise4 = AuthLayer.pipe(Layer.provide(Layer.merge(ConfigLayer, exercise2))) // Your solution here

// ===========================
// Exercise 5
// ===========================

// Target: Layer<"Api", "ApiError" | "AuthError" | "CacheError" | "DbError" | "ConfigError", never>

export const exercise5 = ApiLayer.pipe(
  // Your solution here
  Layer.provide(Layer.merge(exercise3, exercise4))
)

// ===========================
// Exercise 6
// ===========================

// Target: Layer<"Metrics" | "Logging", "MetricsError" | "LogError" | "ConfigError", never>

export const exercise6 = Layer.provideMerge(
  // Your solution here
  MetricsLayer,
  Layer.provide(LoggingLayer, ConfigLayer)
)

// ===========================
// Exercise 7
// ===========================

// Target: Layer<"Metrics" | "Notification", "MetricsError" | "NotifyError" | "LogError" | "ConfigError", never>

export const exercise7 = Layer.merge(
  // Your solution here
  MetricsLayer,
  NotificationLayer
).pipe(Layer.provide(Layer.provideMerge(LoggingLayer, ConfigLayer)))

// ===========================
// Exercise 8
// ===========================

// In this exercise, focus on **locally** eliminating the requirements of each
// service in the `Layer` output first, and then combining those layers to
// create your final layer.

const databaseConfigLayer = Layer.provideMerge(DatabaseLayer, ConfigLayer)
const cacheWithDatabaseLayer = Layer.provideMerge(CacheLayer, databaseConfigLayer)
const authWithCacheLayer = Layer.provideMerge(AuthLayer, cacheWithDatabaseLayer)
const loggingWithConfigLayer = Layer.provideMerge(LoggingLayer, ConfigLayer)

const Api = Layer.provide(ApiLayer, authWithCacheLayer)
const Metrics = Layer.provide(MetricsLayer, loggingWithConfigLayer)
const Notification = Layer.provideMerge(NotificationLayer, loggingWithConfigLayer)

/**
 * Target: Layer<
 *   "Api" | "Metrics" | "Notification",
 *   "ApiError" | "AuthError" | "CacheError" | "DbError" | "ConfigError" | "MetricsError" | "NotifyError" | "LogError",
 *   never
 * >
 */
export const exercise8: Layer.Layer<
  "Api" | "Metrics" | "Notification",
  "ApiError" | "AuthError" | "CacheError" | "DbError" | "ConfigError" | "MetricsError" | "NotifyError" | "LogError",
  never
> = Layer.mergeAll(
  // Your solution here
  Api,
  Metrics,
  Notification
)
