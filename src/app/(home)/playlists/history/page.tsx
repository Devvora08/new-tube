import { DEFAULT_LIMIT } from "@/constants";
import { HistoryView } from "@/modules/playlists/ui/views/history-view";
import { HydrateClient, trpc } from "@/trpc/server";
export const dynamic = "force-dynamic"

import React from 'react'

async function Page() {

  void trpc.playlists.getHistory.prefetchInfinite({limit: DEFAULT_LIMIT})  

  return (
    <HydrateClient>
        <HistoryView/>
    </HydrateClient>
  )
}

export default Page
