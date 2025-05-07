"use client"

import { DEFAULT_LIMIT } from "@/constants"
import { trpc } from "@/trpc/client"
import { VideoRowCard, VideoRowCardSkeleton } from "../components/video-row-card"
import { VideoGridCard, VideoGridCardSkeleton } from "../components/video-grid-card"
import { InfiniteScroll } from "@/components/infinite-scroll"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

interface SuggestSectionsProps {
    videoId: string;
    isManual?: boolean;
}

export const SuggestSections = ({ videoId, isManual }: SuggestSectionsProps) => {
    return (
        <Suspense fallback={<SuggestSectionSkeleton/>}>
            <ErrorBoundary fallback={<p>Erro...</p>}>
                <SuggestSectionsSuspense videoId={videoId} isManual={isManual} />
            </ErrorBoundary>
        </Suspense>
    )
}

const SuggestSectionSkeleton = () => {
    return (
        <>
            <div className="hidden md:block space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <VideoRowCardSkeleton key={index} size={'compact'} />
                ))}
            </div>

            <div className="block md:hidden space-y-10">
                {Array.from({ length: 8 }).map((_, index) => (
                    <VideoGridCardSkeleton key={index} />
                ))}
            </div>
        </>
    )
}

const SuggestSectionsSuspense = ({ videoId, isManual }: SuggestSectionsProps) => {

    const [suggestions, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({ videoId, limit: DEFAULT_LIMIT }, { getNextPageParam: (lastPage) => lastPage.nextCursor });

    return (
        <>
            <div className="hidden md:block space-y-3">
                {suggestions.pages.flatMap((page) => page.items.map((video) => (
                    <VideoRowCard
                        key={video.id}
                        data={video}
                        size={"compact"}
                    />
                )))}
            </div>

            <div className="block md:hidden space-y-10">
                {suggestions.pages.flatMap((page) => page.items.map((video) => (
                    <VideoGridCard
                        key={video.id}
                        data={video}
                    />
                )))}
            </div>
            <InfiniteScroll isManual={isManual} hasNextPage={query.hasNextPage} isFetchingNextPage={query.isFetchingNextPage} fetchNextPage={query.fetchNextPage} />
        </>
    )
}