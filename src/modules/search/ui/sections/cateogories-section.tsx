"use client"

import { FilterCarousal } from "@/components/filter-carousal";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import {ErrorBoundary} from "react-error-boundary"

interface CategoriesSectionProps {
    categoryId?: string;
}

export const CategoriesSection = ({categoryId} : CategoriesSectionProps) => {
    return (
        <Suspense fallback={<FilterCarousal isLoading data={[]} onSelectAction={() => {}}/>}>
            <ErrorBoundary fallback={<p>Error...</p>}>
                <CategoriesSectionSuspense categoryId={categoryId}/>
            </ErrorBoundary>
        </Suspense>
    )
}

export const CategoriesSectionSuspense = ({categoryId} : CategoriesSectionProps) => {
    const [categories] = trpc.categories.getMany.useSuspenseQuery();
    const router = useRouter()
    const data = categories.map(({name, id}) => ({
        value: id,
        label: name
    }))

    const onSelectAction = (value:string|null) => {
        const url = new URL(window.location.href);

        if(value) {
            url.searchParams.set('categoryId', value);
        } else {
            url.searchParams.delete("categoryId")
        }

        router.push(url.toString())
    }

    return (
        <FilterCarousal onSelectAction={onSelectAction} value={categoryId} data={data}/>
    )
}