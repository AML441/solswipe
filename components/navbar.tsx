"use client";

export default function Navbar() {
  return (
    <div className="group w-full h-auto text-black border p-2 bg-white border-gray-200 shadow-lg flex items-right justify-end gap-20">
        <p className="text-2xl">Saved Organizations</p>
        <p className="text-2xl">Connect New Wallet</p>
        <p className="text-2xl">Logout</p>
    </div>
  );
}
