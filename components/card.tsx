"use client";

import { useState } from "react";
import Modal from "./modal";

interface CardProps {
  org: string;
  desc: string;
  contact: string;
  address: string;
}

export default function Card({ org, desc, contact, address }: CardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <div className="group w-auto h-auto text-black aspect-[9/7] flex flex-col justify-start p-[2.5em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
      <p className="text-4xl">{org}</p>
      <p className="text-2xl py-5">{desc}</p>
      <p className="text-2xl">{contact}</p>
      <div className="flex justify-center mt-auto">


        <div className="p-6">
          {/* Button to Open Modal */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-full rounded-[.75em] bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 py-2"
          >
            Make Payment
          </button>

          {/* The Modal */}
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <h2 className="text-xl font-semibold mb-4">Enter an Amount</h2>
            <p>Recipient Address: {address}</p>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => {
                console.log("Amount entered:", amount);
                setIsOpen(false);
              }}
              className="w-full bg-cyan-200 text-slate-900 py-2 rounded-lg hover:bg-teal-600"
            >
              Submit
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </Modal>
        </div>
      </div>
    </div>
  );
}
