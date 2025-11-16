"use client";

interface CardProps {
  org: string;
  desc: string;
  contact: string;
}

export default function Card({org,desc,contact}: CardProps) {
  return (
    <div className="group w-auto h-auto text-black aspect-[9/7] flex flex-col justify-start p-[2.5em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
        <p className="text-4xl">{org}</p>
        <p className="text-2xl py-5">{desc}</p>
        <p className="text-2xl">{contact}</p>
        <div className="flex justify-center mt-auto">
            <button className="w-full rounded-[.75em] bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 py-2">
                Make Payment
            </button>
        </div>
    </div>
  );
}
