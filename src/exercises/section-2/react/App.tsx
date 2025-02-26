import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { SearchScreen } from "./SearchScreen.js"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchScreen />
    </QueryClientProvider>
  )
}
