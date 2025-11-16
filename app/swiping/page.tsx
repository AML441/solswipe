"use client";

import { useState, useRef, useEffect } from "react";
import Card from "@/components/card";
import Navbar from "@/components/navbar";
import { Organization } from "@/types/organization";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { items as importedItems } from "../../types/Items"; // single source of truth
import cosineSimilarity from "compute-cosine-similarity";

// Dummy embedding function, replace with real API call if needed
async function generateEmbeddings() {
  const res = await fetch("/api/recommendations/embeddings");
  const data = await res.json();
  console.log("Embeddings fetched:", data.embeddings); // Log when embeddings are fetched
  return data.embeddings;
}

// Calculate similarity indices
function getSimilarOrgs(likedIndex: number, embeddings?: number[][]): number[] {
  if (!embeddings || embeddings.length === 0) {
    console.warn("Embeddings not ready, returning empty similarity list");
    return [];
  }

  const similarities: { index: number; score: number }[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    if (i === likedIndex) continue;
    const score = cosineSimilarity(embeddings[likedIndex], embeddings[i]);
    similarities.push({ index: i, score });
  }

  similarities.sort((a, b) => b.score - a.score);
  return similarities.map((s) => s.index);
}

export default function SwipingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeStart, setSwipeStart] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [items, setItems] = useState<Organization[]>(importedItems);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [seenIds, setSeenIds] = useState<string[]>([]);


  const cardRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 50;

  // Initialize likedMap when items load
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    items.forEach((item) => {
      initialMap[item.id] = false; // Default to not liked
    });
    setLikedMap(initialMap);
  }, [items]);

  // When rendering Card components
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) setUid(auth.currentUser.uid);

    const unsubscribe = auth.onAuthStateChanged(user => {
      setUid(user ? user.uid : null);
    });

    return () => unsubscribe();
  }, []);

 useEffect(() => {
  if (!uid) return;

  const userRef = doc(db, "users", uid);
  getDoc(userRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedIds = data.saved || [];
        setSeenIds(savedIds);

        // Filter using savedIds
        const filteredItems = importedItems.filter(
          (org) => !savedIds.includes(org.id)
        );
        setItems(filteredItems);
      } else {
        setItems(importedItems);
      }
    })
    .catch((err) => {
      console.error("Error fetching seenIds:", err);
    });
}, [uid, importedItems.length]);



  // Generate embeddings once on mount
  useEffect(() => {
    generateEmbeddings().then((data) => {
      setEmbeddings(data);
      console.log("Embeddings set in state:", data); // Log when embeddings are set
    });
  }, [items]);

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

  const handleReorderingAndUpdate = (currentIndex: number) => {
    // If embeddings aren't loaded yet, fetch them
    if (!embeddings || embeddings.length === 0) {
      console.log("Embeddings not ready, fetching...");
      return generateEmbeddings().then((fetchedEmbeddings) => {
        setEmbeddings(fetchedEmbeddings);
        console.log("Embeddings dynamically fetched and set:", fetchedEmbeddings);
        return fetchedEmbeddings;
      }).catch((err) => {
        console.error("Failed to fetch embeddings:", err);
      });
    }

    // Ensure embeddings are available
    if (!embeddings || embeddings.length === 0) {
      console.warn("Embeddings still not ready after fetch!");
      return;
    }

    // Save the current organization
    const currentOrgId = items[currentIndex].id;
    saveOrg(currentOrgId);

    // Update seenIds (mark the item as saved)
    setSeenIds((prev) => [...prev, currentOrgId]);

    // Filter out the current organization from the items to avoid reordering it
    const filteredItems = items.filter((item) => item.id !== currentOrgId);

    // Get similar organizations based on the updated embeddings
    const similarIndexes = getSimilarOrgs(currentIndex, embeddings);

    // Reorder the list, excluding the current org (saved item)
    const reordered = [
      ...similarIndexes
        .map(i => filteredItems[i])  // Get similar items from filtered list
        .filter(item => item !== undefined), // Filter out undefined
      ...filteredItems.filter((_, i) => !similarIndexes.includes(i)), // Filter out seen items
    ];

    console.log("Reordered items based on similarity:", reordered);

    // Remove any undefined items after reordering
    const cleanedReordered = reordered.filter(item => item !== undefined);

    // Update the items list and reset the current index
    setItems(cleanedReordered);

    // Move to first item or reordered list
    setCurrentIndex(0);
  };

  const handleInterested = async () => {
    await handleReorderingAndUpdate(currentIndex); // Call the reusable function
  };

  const handleNotInterested = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
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

  const handleSwipeEnd = async (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || !cardRef.current) return;

    const moveDiff = getClientX(e) - swipeStart;

    if (moveDiff > swipeThreshold) {
      // Swipe right -> previous
      saveOrg(items[currentIndex].id);
      await handleReorderingAndUpdate(currentIndex);
      setCurrentIndex(0);
      // setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
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
    const handleKeydown = async (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowRight") {
        saveOrg(items[currentIndex].id);
        // setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        await handleReorderingAndUpdate(currentIndex);
        setCurrentIndex(0);
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
          <Card
            key={items[currentIndex].id}
            orgData={items[currentIndex]}
            liked={likedMap[items[currentIndex].id] || false}
            onLike={(newLiked) => {
              setLikedMap((prev) => ({
                ...prev,
                [items[currentIndex].id]: newLiked,
              }));

              // update Firestore
              const auth = getAuth();
              const uid = auth.currentUser?.uid;
              if (!uid) return;

              const userRef = doc(db, "users", uid);
              if (newLiked) {
                setDoc(userRef, { saved: arrayUnion(items[currentIndex].id) }, { merge: true });
              } else {
                setDoc(userRef, { saved: arrayRemove(items[currentIndex].id) }, { merge: true });
              }
            }}
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleNotInterested}
            className="px-4 py-2 bg-gray-300 text-slate-900 rounded hover:bg-gray-400"
          >
            Not Interested
          </button>
          <button
            onClick={handleInterested}
            className="px-4 py-2 bg-cyan-200 text-slate-900 rounded hover:bg-teal-600"
          >
            Interested
          </button>
        </div>
      </div>
    </div>
  );
}