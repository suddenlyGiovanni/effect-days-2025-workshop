import { useQuery } from "@tanstack/react-query"
import * as React from "react"

// TODO list:
//
// - Create a Pokemon Effect.Service that wraps the Pokemon API
//
// - Use the Pokemon service in the SearchResults component
//   - Use a ManagedRuntime to run the Effect's
//
// Optional challenges:
//
// - Use "effect/Schema" to decode the Pokemon API response
//
// - Use "@effect/platform/HttpClient" instead of fetch
//
// - Integrate with a state management library of your choice
//   - zustand, redux, jotai, etc.
//
// Advanced challenges:
//
// - Replace the useState with a `SubscriptionRef` in the Pokemon service
//   - Subscribe to the `SubscriptionRef.changes` Stream in the SearchResults component
//
// - Use the "@effect-rx/rx-react" package for state management & running
// effects
//

export function SearchScreen() {
  const [query, setQuery] = React.useState(
    new URLSearchParams(window.location.search).get("query") ?? ""
  )
  React.useEffect(() => {
    window.history.pushState({}, "", `?query=${query}`)
  }, [query])
  return (
    <section className="flex flex-col items-center justify-center">
      <div className="h-50" />
      <h1 className="font-black text-7xl">Pokesearch</h1>
      <div className="h-5" />
      <SearchInput value={query} onChange={setQuery} />
      <div className="h-5" />
      <React.Suspense fallback={<div>Loading...</div>}>
        <SearchResults query={query} />
      </React.Suspense>
    </section>
  )
}

function SearchInput({
  onChange,
  value
}: {
  readonly value: string
  readonly onChange: (value: string) => void
}) {
  return (
    <input
      className="border border-gray-300 rounded px-3 py-2 w-96"
      placeholder="Search for a Pokémon..."
      onChange={(e) => onChange(e.target.value)}
      value={value}
    />
  )
}

function SearchResults({ query }: { readonly query: string }) {
  const trimmedQuery = query.trim().toLowerCase()

  const { data, isSuccess } = useQuery({
    queryKey: ["pokemon", trimmedQuery],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${trimmedQuery}`,
        { signal }
      )
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const json = await response.json()
      return json
    }
  })

  if (trimmedQuery === "") {
    return null
  } else if (!isSuccess) {
    return <div>No results</div>
  }

  return <PokemonListItem data={data} />
}

function PokemonListItem({ data }: { readonly data: any }) {
  return (
    <div className="flex flex-row w-96 items-start">
      <img src={data.sprites.front_default} alt={data.name} />
      <div className="flex flex-col flex-1 gap-3 pt-7">
        <header className="flex flex-row items-center">
          <h2 className="font-bold flex gap-2 items-center text-2xl">
            <span>{data.name}</span>
            <small className="text-gray-500">#{data.id}</small>
          </h2>
        </header>
        <audio controls src={data.cries.latest} />
      </div>
    </div>
  )
}
