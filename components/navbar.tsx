"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
   < div>
      {/* Button to open sidebar */}
      <div className="bg-black top-0 h-screen w-[5em]">
        <button 
          className="bg-blue-600 h-screen w-[5em] text-white rounded "
          onClick={() => setIsOpen(true)}
        >
          Open Sidebar
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 ${
          isOpen ? " pointer-events-auto" : " pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[10em] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl text-black font-bold">Sidebar</h2>
          <button
            className="p-1 text-gray-600 hover:text-gray-900"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="p-4">
         <ul className="text-black">
          <li><Link href="/home">Home</Link></li>
          <li><Link href="/swiping">Explore Orgs</Link></li>
          <li><Link href="/testing">Saved Collection</Link></li>
          <li><Link href="/">Logout</Link></li>
        </ul>
        </div>
      </div>
    </div>

  );
}
