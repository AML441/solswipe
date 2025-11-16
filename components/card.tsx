"use client";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Organization } from "@/types/organization";

interface CardProps {
  orgData: Organization & { id: string }; // Include id for Firestore
}

export default function Card({orgData}: CardProps) {
    const { id, name, description, contact } = orgData;
    const [liked, setLiked] = useState(false);
    const [uid, setUid] = useState<string | null>(null);

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
                className={`h-[3em] w-[3em] cursor-pointer transition-colors duration-300 ${
                    liked ? "text-red-500" : "text-gray-400"
                }`}
                onClick={handleLike}
                />
        </div>
        <p className="text-2xl py-5">{description}</p>
        <p className="text-2xl">{contact}</p>
        <div className="flex justify-center mt-auto">
            <button className="w-full rounded-[.75em] bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 py-2">
                Make Payment
            </button>
        </div>
    </div>
  );
}
