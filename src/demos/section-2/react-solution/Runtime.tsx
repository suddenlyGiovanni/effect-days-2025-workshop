import type { QueryFunctionContext } from "@tanstack/react-query"
import { ConfigProvider, Data, Effect, Equal, Layer, ManagedRuntime } from "effect"
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
  layer: (options: Args) => Layer.Layer<R, E>,
  options?: {
    readonly disposeTimeout?: number | undefined
  }
) => {
  const Context = React.createContext<ManagedRuntime.ManagedRuntime<R, E>>(
    null as any
  )
  const Provider = (args: Args & { readonly children?: React.ReactNode }) => {
    const deps: Array<unknown> = Data.unsafeArray([]) as any
    for (const key of Object.keys(args).sort()) {
      if (key === "children") continue
      deps.push(args[key])
    }
    const runtimeRef = React.useRef<{
      readonly args: Array<unknown>
      readonly runtime: ManagedRuntime.ManagedRuntime<R, E>
      timeout: number | undefined
    }>(undefined as any)
    if (!runtimeRef.current || !Equal.equals(runtimeRef.current.args, deps)) {
      runtimeRef.current = {
        args: deps,
        runtime: ManagedRuntime.make(
          Layer.provideMerge(layer(deps as any), ViteConfigProvider),
          memoMap
        ),
        timeout: undefined
      }
    }
    React.useEffect(() => {
      const ref = runtimeRef.current
      if (ref.timeout) {
        clearTimeout(ref.timeout)
        ref.timeout = undefined
      }
      return () => {
        ref.timeout = setTimeout(
          () => ref.runtime.dispose(),
          options?.disposeTimeout ?? 500
        ) as any
      }
    }, [runtimeRef.current])
    return (
      <Context.Provider value={runtimeRef.current.runtime}>
        {args.children}
      </Context.Provider>
    )
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
