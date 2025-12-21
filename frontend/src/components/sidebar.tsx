"use client";
import React from "react";
import { BoxSelect } from "lucide-react";
import { blogCategories, useAppData } from "../context/AppContext";
import { Input } from "@/components/ui/input";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarMenuItem } from "./ui/sidebar";

const SideBar = () => {
  const { searchQuery, setSearchQuery, setCategory } = useAppData();
  return (
    <Sidebar className="w-69">
      <SidebarHeader className="bg-white text-2xl font-bold mt-5">
        The Reading Retreat
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Your Desired blog"
          />

          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setCategory("")}>
                <BoxSelect /> <span>All</span>
              </SidebarMenuButton>
              {blogCategories?.map((e, i) => {
                return (
                  <SidebarMenuButton key={i} onClick={() => setCategory(e)}>
                    <BoxSelect /> <span>{e}</span>
                  </SidebarMenuButton>
                );
              })}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SideBar;
