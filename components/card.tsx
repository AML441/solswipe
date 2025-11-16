"use client";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Organization } from "@/types/organization";
import Modal from "./modal";

interface CardProps {
  orgData: Organization & { id: string }; // Include id for Firestore
}

export default function Card({ orgData }: CardProps) {
  const { id, name, description, contact } = orgData;
  const [liked, setLiked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) setUid(user.uid);

    // Optional: listen for changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
      else setUid(null);
    });

    return () => unsubscribe();
  }, []);


  const handleLike = async () => {
    if (!uid) {
      console.error("User not logged in!");
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked);

    try {
      const userRef = doc(db, "users", uid);

      if (newLiked) {
        await setDoc(
          userRef,
          { saved: arrayUnion(id) },
          { merge: true }
        );
      } else {
        await setDoc(
          userRef,
          { saved: arrayRemove(id) },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Failed to update saved org", err);
    }
  };

  return (
    <div className="group w-auto h-auto text-black aspect-[9/7] flex flex-col justify-start p-[2.5em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
      <div className="flex flex-row justify-between items-center">
        <p className="text-4xl">{name}</p>
        <FaHeart
          className={`h-[3em] w-[3em] cursor-pointer transition-colors duration-300 ${liked ? "text-red-500" : "text-gray-400"
            }`}
          onClick={handleLike}
        />
      </div>
      <p className="text-2xl py-5">{description}</p>
      <p className="text-2xl">{contact}</p>
      <div className="flex justify-center mt-auto">
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
          <p>Recipient Address: {orgData.address}</p>

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
  );
}
