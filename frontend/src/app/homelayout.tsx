"use client";
import React, { ReactNode } from "react";
import { SidebarProvider } from "../components/ui/sidebar";
import SideBar from "../components/sidebar";

interface BlogsProps {
  children: ReactNode;
}

const HomeLayout: React.FC<BlogsProps> = ({ children }) => {
  return (
    <div>
        <SideBar />
        <main className="w-full">
          <div className="w-full min-h-[calc(100vh-45px)] px-4">
            {children}
          </div>
        </main>
    </div>
  );
};

export default HomeLayout;