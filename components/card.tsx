"use client";

interface CardProps {
  org: string;
  desc: string;
}

export default function Card({org,desc}: CardProps) {
  return (
    <div className="group w-full h-auto text-black aspect-[20/18] flex flex-col justify-start p-[1.25em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
        <p>{org}</p>
        <p>{desc}</p>
    </div>
  );
}
