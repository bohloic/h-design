// Fixed "Property 'children' is missing" error by making children optional in the props type.
// In strict TypeScript/JSX environments, nested elements are mapped to the 'children' prop, 

import { Header } from "../components/admin/Header";
import { Sidebar } from "../components/admin/Sidebar";
import React from 'react'

// but the prop check often fails if 'children' isn't explicitly defined as optional in the interface.
export const AppLayout = ({ children, title }: { children?: React.ReactNode; title: string }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 ml-64 min-h-screen">
      <Header title={title} />
      {children}
    </main>
  </div>
);