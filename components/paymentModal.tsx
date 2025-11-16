'use client';

import { useState } from "react";
import Modal from "./modal";

interface PaymentModalProps {
    addr: string;
}

export default function AmountModalExample({addr}: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");

  return (
    <div className="p-6">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Enter Amount
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Enter an Amount</h2>
        <p>Recipient Address: {addr}</p>

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
  );
}
