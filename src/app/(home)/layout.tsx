import { HomeLayout } from '@/modules/home/ui/layouts/home-layout'
import React from 'react'

export const dynamic = "force-dynamic"

interface LayoutProps {
    children: React.ReactNode
}

function Layout({children}: LayoutProps) {
  return (
    <HomeLayout>
        {children}
    </HomeLayout>
  )
}

export default Layout
