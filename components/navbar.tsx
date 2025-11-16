"use client";

import Link from "next/link";
import { useState } from "react";
import { FaBars } from "react-icons/fa"; // Import hamburger icon from react-icons

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Fixed Navbar with background color */}
      <div className="fixed top-0 left-0 h-full w-16 bg-slate-900 text-white shadow-lg z-50 flex items-start px-4">
        {/* Hamburger Icon */}
        <button
          className="text-white text-3xl cursor-pointer mt-4"
          onClick={() => setIsOpen(true)} // Open sidebar
        >
          <FaBars />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[15em] bg-slate-900 opacity-90 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header with Close Button */}
        <div className="p-4 flex justify-between items-center border-white border-b">
          <h2 className="text-xl text-white font-bold">Menu</h2>
          <button
            className="p-1 text-white hover:text-gray-100 cursor-pointer"
            onClick={() => setIsOpen(false)} // Close sidebar
          >
            ✕
          </button>
        </div>

        {/* Sidebar Links */}
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
                href="/saved"
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