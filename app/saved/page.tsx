'use client';

import Card from "@/components/card";
import { Organization } from "@/types/organization";
import Navbar from "@/components/navbar";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { items } from "../../types/Items";

export default function Saved() {
  const [uid, setUid] = useState<string | null>(null);
  const [savedOrgIds, setSavedOrgIds] = useState<string[]>([]);

  // Track logged-in user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // Fetch saved orgs AFTER uid is known
  useEffect(() => {
    if (!uid) return;

    const fetchSaved = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setSavedOrgIds(snap.data().saved ?? []);
      }
    };

    fetchSaved();
  }, [uid]);

  // Filter saved organizations
  const savedOrgs = items.filter(org =>
    savedOrgIds.includes(org.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-slate-900 flex flex-row">
      <div>
        <Navbar />
      </div>
        <div className="flex-1 pl-16">
        <h1 className="text-3xl flex justify-center font-bold text-white mt-8 p-6">Your Saved Organizations</h1>
        {savedOrgs.length === 0 && (
          <div className="flex flex-col justify-center items-center mt-20 text-xl gap-8 text-white"> {/* Center the button */}
            <p>You have no saved organizations.</p>
            <Link href="/swiping">
              <button className="text-white py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-800">
                Explore organizations!
              </button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {savedOrgs.map((item) => (
            <Card
              key={item.id}
              orgData={{ ...item, id: item.id.toString() }}
              liked={savedOrgIds.includes(item.id)} // Pass current liked state
              onLike={(newLiked) => {
                // Handle updating the saved organizations when a like is toggled
                if (newLiked) {
                  setSavedOrgIds((prev) => [...prev, item.id]);
                } else {
                  setSavedOrgIds((prev) =>
                    prev.filter((id) => id !== item.id)
                  );
                }
              }}
              showHeart={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
