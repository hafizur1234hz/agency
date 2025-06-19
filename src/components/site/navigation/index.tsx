import { User } from "@clerk/nextjs/server";
import Image from "next/image";
import React from "react";
import Logo from "@/assets/logo.svg";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/global/mode-toggle";

type Props = {
  user?: null | User;
};

const Navigation = ({ user }: Props) => {
  return (
    <div className=" p-4 flex items-center justify-between relative">
      <aside className=" flex items-center gap-2">
        <Image
          className=" w-full"
          src={Logo}
          alt="logo"
          width={40}
          height={40}
        />
      </aside>

      <nav
        className=" hidden md:block absolute left-[50%] 
      top-[50%] transform translate-x-[-50%] translate-y-[-50%]"
      >
        <ul className="flex items-center justify-center font-medium gap-8">
          <Link href={"#"}>Pricing</Link>
          <Link href={"#"}>About</Link>
          <Link href={"#"}>Docs</Link>
          <Link href={"#"}>Features</Link>
        </ul>
      </nav>

      <aside className=" flex gap-2 items-center">
        <Button asChild size="lg">
          <Link href={"/agency"} className="font-medium text-base py-2 px-4">
            Login
          </Link>
        </Button>
        <UserButton />
        <ModeToggle />
      </aside>
    </div>
  );
};

export default Navigation;
