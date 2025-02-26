import type { QueryFunctionContext } from "@tanstack/react-query"
import { ConfigProvider, Effect, Layer, ManagedRuntime } from "effect"
import * as React from "react"

const memoMap = Effect.runSync(Layer.makeMemoMap)

const ViteConfigProvider = Layer.setConfigProvider(
  ConfigProvider.fromJson(import.meta.env)
)

export const makeReactRuntime = <
  R,
  E,
  Args extends Record<string, unknown> = {}
>(
  layer: (options: Args) => Layer.Layer<R, E>
) => {
  const Context = React.createContext<ManagedRuntime.ManagedRuntime<R, E>>(
    null as any
  )
  const Provider = (args: Args & { readonly children?: React.ReactNode }) => {
    const deps: Array<unknown> = []
    for (const key of Object.keys(args).sort()) {
      if (key === "children") continue
      deps.push(args[key])
    }
    const runtime = React.useMemo(
      () =>
        ManagedRuntime.make(
          Layer.provideMerge(layer(args), ViteConfigProvider),
          memoMap
        ),
      deps
    )
    React.useEffect(
      () => () => {
        runtime.dispose()
      },
      [runtime]
    )
    return <Context.Provider value={runtime}>{args.children}</Context.Provider>
  }

  const use = () => React.useContext(Context)

  const useQueryOptions = <
    const Key extends ReadonlyArray<unknown>,
    A,
    EX,
    RX extends R
  >(
    key: Key,
    f:
      | ((options: QueryFunctionContext<Key>) => Effect.Effect<A, EX, RX>)
      | Effect.Effect<A, EX, RX>
  ) => {
    const runtime = use()
    return {
      queryKey: key,
      queryFn: (options: QueryFunctionContext<Key>) =>
        runtime.runPromise(Effect.isEffect(f) ? f : f(options), {
          signal: options.signal
        })
    }
  }

  return { Context, Provider, use, useQueryOptions } as const
}
