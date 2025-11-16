"use client";

import { useState, useRef, useEffect } from "react";
import Card from "@/components/card";
import Navbar from "@/components/navbar";
import { Organization } from "@/types/organization";
import { tagTypes } from "@/types/organization";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { GoogleGenAI } from "@google/genai";
import cosineSimilarity from "compute-cosine-similarity";
import { items as importedItems, items } from "../testing/page"; // single source of truth
import { NextResponse } from "next/server";



// Generate tag texts
const tagTexts = importedItems.map((org: Organization) => org.tags.join(" "));

// Dummy embedding function, replace with real API call if needed
async function generateEmbeddings() {
  const res = await fetch("/api/recommendations/embeddings");
  const data = await res.json();
  return data.embeddings;
}


// Calculate similarity indices
function getSimilarOrgs(likedIndex: number, embeddings: number[][]): number[] {
  const similarities: { index: number; score: number }[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    if (i === likedIndex) continue;
    const score = cosineSimilarity(embeddings[likedIndex], embeddings[i]);
    similarities.push({ index: i, score });
  }

  similarities.sort((a, b) => b.score - a.score);
  return similarities.map(s => s.index);
}

export default function SwipingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeStart, setSwipeStart] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [items, setItems] = useState<Organization[]>(importedItems);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 50;

  // Generate embeddings once on mount
  useEffect(() => {
    generateEmbeddings().then(setEmbeddings);
  }, [items]);

  // Firebase Auth listener
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) setUid(auth.currentUser.uid);

    const unsubscribe = auth.onAuthStateChanged(user => {
      setUid(user ? user.uid : null);
    });

    return () => unsubscribe();
  }, []);

  // Save org to Firestore
  const saveOrg = async (orgId: string) => {
    if (!uid) {
      console.error("User not logged in!");
      return;
    }

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        { saved: arrayUnion(orgId) },
        { merge: true }
      );
      console.log("Saved org:", orgId);
    } catch (err) {
      console.error("Failed to update saved org", err);
    }
  };

  const handleInterested = async () => {
  // If embeddings aren't loaded yet, fetch them
  if (!embeddings || embeddings.length === 0) {
    console.log("Embeddings not ready, fetching...");
    try {
      const fetchedEmbeddings = await generateEmbeddings();
      setEmbeddings(fetchedEmbeddings);
      console.log("Embeddings fetched:", fetchedEmbeddings);
    } catch (err) {
      console.error("Failed to fetch embeddings:", err);
      return; // exit if fetch fails
    }
  }

  // By now embeddings should exist
  if (!embeddings || embeddings.length === 0) {
    console.warn("Embeddings still not ready after fetch!");
    return;
  }

  const similarIndexes = getSimilarOrgs(currentIndex, embeddings);
  const reordered = [
    ...similarIndexes.map(i => items[i]),
    ...items.filter((_, i) => !similarIndexes.includes(i)),
  ];
  setItems(reordered);

  // Save the current organization
  saveOrg(items[currentIndex].id);

  // Move to previous item
  setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
};


  // Swipe helpers
  const getClientX = (e: React.TouchEvent | React.MouseEvent) =>
    "touches" in e ? e.touches[0].clientX : e.clientX;

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    setSwipeStart(getClientX(e));
    setIsSwiping(true);
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || !cardRef.current) return;
    const moveDiff = getClientX(e) - swipeStart;
    cardRef.current.style.transform = `translateX(${moveDiff}px)`;
  };

  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || !cardRef.current) return;

    const moveDiff = getClientX(e) - swipeStart;

    if (moveDiff > swipeThreshold) {
      // Swipe right -> previous
      saveOrg(items[currentIndex].id);
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (moveDiff < -swipeThreshold) {
      // Swipe left -> next
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }

    cardRef.current.style.transition = "transform 0.3s ease";
    cardRef.current.style.transform = "translateX(0)";
    setIsSwiping(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowRight") {
        saveOrg(items[currentIndex].id);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentIndex, uid, items]);

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-900 to-slate-900 flex flex-row">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div
          ref={cardRef}
          className="w-full max-w-md"
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
          onMouseDown={handleSwipeStart}
          onMouseMove={handleSwipeMove}
          onMouseUp={handleSwipeEnd}
          onMouseLeave={handleSwipeEnd}
        >
          <Card orgData={items[currentIndex]} />
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="px-4 py-2 bg-gray-300 text-slate-900 rounded hover:bg-gray-400"
          >
            Not Interested
          </button>
  <button
  onClick={async () => {
    let currentEmbeddings = embeddings;

    // Fetch if not ready
    if (!currentEmbeddings || currentEmbeddings.length === 0) {
      try {
        currentEmbeddings = await generateEmbeddings();
        setEmbeddings(currentEmbeddings);
      } catch (err) {
        console.error("Failed to fetch embeddings:", err);
        return;
      }
    }

    // Now we can safely calculate similarity
    const similarIndexes = getSimilarOrgs(currentIndex, currentEmbeddings);

    console.log("Similar indexes:", similarIndexes);
    console.log("Current org:", items[currentIndex].id);

    const reordered = [
      ...similarIndexes.map(i => items[i]),
      ...items.filter((_, i) => !similarIndexes.includes(i)),
    ];
    setItems(reordered);

    saveOrg(items[currentIndex].id);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }}
  className="px-4 py-2 bg-cyan-200 text-slate-900 rounded hover:bg-teal-600"
>
  Interested
</button>


        </div>
      </div>
    </div>
  );
}
