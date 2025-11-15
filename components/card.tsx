"use client";

interface CardProps {
  org: string;
  desc: string;
}

export default function Card({org,desc}: CardProps) {
  return (
    <div className="group w-[70em] h-[45em] text-black aspect-[15/21] flex flex-col justify-start p-[2.5em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em] cursor-pointer">
        <p className="text-4xl">[Org Name]</p>
        <p className="text-2xl py-5">[Description]</p>
        <p className="text-2xl"> [Contact Information]</p>
        <div className="flex justify-center">
            <button className="border-2 w-[5em]">
                Payment
            </button>
        </div>
    </div>
  );
}
