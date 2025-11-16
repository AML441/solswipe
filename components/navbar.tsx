"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Button to open sidebar */}
      <div className="bg-transparent top-0 h-screen w-[5em] flex-col items-start">
        <button
          className="bg-transparent h-screen w-[5em] align-text-top text-white cursor-pointer" 
          onClick={() => setIsOpen(true)}
        >
          Open Menu
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[15em] bg-slate-900 opacity-90 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-white border-b">
          <h2 className="text-xl text-white font-bold">Menu</h2>
          <button
            className="p-1 text-white hover:text-gray-100 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <ul className="text-white space-y-4 text-lg">
            <li>
              <Link
                href="/home"
                className="block hover:bg-gray-700 p-2 rounded cursor-pointer"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/swiping"
                className="block hover:bg-gray-700 p-2 rounded cursor-pointer"
              >
                Explore Orgs
              </Link>
            </li>
            <li>
              <Link
                href="/testing"
                className="block hover:bg-gray-700 p-2 rounded cursor-pointer"
              >
                Saved Collection
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="block hover:bg-gray-700 p-2 rounded cursor-pointer"
              >
                Logout
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}