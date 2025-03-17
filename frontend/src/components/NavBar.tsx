"use client";

import React, { useState } from "react";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";
import { cn } from "@/utils/cn";
import Link from "next/link";

function NavBar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}
    >
      <div>
        <Menu setActive={setActive}>
          <Link href="/">
            <MenuItem
              setActive={setActive}
              active={active}
              item="Home"
            ></MenuItem>
          </Link>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Get Started Now"
          ></MenuItem>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Contact us"
          ></MenuItem>
          <MenuItem
            setActive={setActive}
            active={active}
            item="Login/Sign up"
          ></MenuItem>
        </Menu>
      </div>
    </div>
  );
}

export default NavBar;
