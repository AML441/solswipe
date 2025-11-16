"use client";

import { useState, useRef, useEffect } from "react";
import Card from "@/components/card";
import Navbar from "@/components/navbar";
import { Organization } from "@/types/organization";
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { items as importedItems } from "../../types/Items";
import cosineSimilarity from "compute-cosine-similarity";
import MultiSelect from "@/components/multiselect";
import { tagTypes } from "@/types/organization";

type OrgWithIndex = Organization & { originalIndex: number };


async function generateEmbeddings() {
  const res = await fetch("/api/recommendations/embeddings");
  const data = await res.json();
  console.log("Embeddings fetched:", data.embeddings); // Log when embeddings are fetched
  return data.embeddings;
}

// Calculate similarity indices
function getSimilarOrgs(originalIndex: number, embeddings: number[][]) {
  const similarities = [];

  for (let i = 0; i < embeddings.length; i++) {
    if (i === originalIndex) continue;
    similarities.push({ index: i, score: cosineSimilarity(embeddings[originalIndex], embeddings[i]) });
  }

  similarities.sort((a, b) => b.score - a.score);

  return similarities.map(s => s.index);  // Returns ORIGINAL indexes
}


export default function SwipingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeStart, setSwipeStart] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [items, setItems] = useState<OrgWithIndex[]>();
  const [selectedTags, setSelectedTags] = useState<tagTypes[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [seenIds, setSeenIds] = useState<string[]>([]);
  importedItems.map((org, index) => ({
    ...org,
    originalIndex: index,
  }))


  const cardRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 50;

  // Initialize likedMap when items load
  useEffect(() => {
  const initialMap: Record<string, boolean> = {};
  importedItems.forEach((item) => {
    initialMap[item.id] = false;
  });
  setLikedMap(initialMap);
}, []);


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
            (org) => !savedIds.includes(org.id)).map((org,index) => ({
              ...org,
              originalIndex: index,
            })
          );
          setItems(filteredItems);
        } else {
          setItems(importedItems.map((org,index) => ({
            ...org,
            originalIndex: index,
          })));
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

  useEffect(() => {
  const filteredItems = importedItems
    .filter((org) => {
      const matchesTag = selectedTags.length
        ? selectedTags.every((tag) => org.tags.includes(tag))
        : true;

      const isNotSaved = !seenIds.includes(org.id);

      return matchesTag && isNotSaved;
    })
    .map((org, index) => ({
      ...org,
      originalIndex: index,
    }));

  setItems(filteredItems);
}, [selectedTags, seenIds]);


  // Ensure currentIndex is within bounds of items array
  //const safeCurrentIndex = Math.min(Math.max(currentIndex, 0), items.length - 1);

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

  const handleReorderingAndUpdate = async (index: number) => {
  if (!items || items.length === 0 || !items[index]) return;

  if (!embeddings || embeddings.length === 0) {
    console.log("Embeddings not ready, fetching...");
    const fetchedEmbeddings = await generateEmbeddings();
    setEmbeddings(fetchedEmbeddings);
  }

  const currentOrg = items[index];
  saveOrg(currentOrg.id);

  // Mark as seen
  setSeenIds((prev) => [...prev, currentOrg.id]);

  // Filter out the current org
  const filteredItems = items.filter((item) => item.id !== currentOrg.id);

  // Reorder using embeddings
  const similarOrder = getSimilarOrgs(currentOrg.originalIndex, embeddings);

  const reordered: OrgWithIndex[] = [
    ...similarOrder
      .map((origIdx) => filteredItems.find((item) => item.originalIndex === origIdx))
      .filter((item): item is OrgWithIndex => !!item),
    ...filteredItems.filter((item) => !similarOrder.includes(item.originalIndex)),
  ];

  // Directly set the new items and reset index safely
  setItems(reordered);
  setCurrentIndex(0);
};


  const handleInterested = async () => {
    await handleReorderingAndUpdate(currentIndex);
  };

  const handleNotInterested = () => {
  if (!items || items.length === 0) return;
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
  if (!isSwiping || !cardRef.current || !items || items.length === 0) return;

  const moveDiff = getClientX(e) - swipeStart;

  if (moveDiff > swipeThreshold) {
    // Swipe right -> interested
    const currentOrg = items[currentIndex];
    saveOrg(currentOrg.id);
    await handleReorderingAndUpdate(currentIndex);
  } else if (moveDiff < -swipeThreshold) {
    // Swipe left -> not interested
    setCurrentIndex((prev) => (items && items.length > 0 ? (prev + 1) % items.length : 0));
  }

  cardRef.current.style.transition = "transform 0.3s ease";
  cardRef.current.style.transform = "translateX(0)";
  setIsSwiping(false);
};


    return (
    <div className="min-h-screen bg-linear-to-b from-indigo-900 to-slate-900 flex flex-row">
      <Navbar />
      <div className="flex-1 flex flex-col items-center p-6">
        
        <div className="relative w-full max-w-3xl mt-1 mb-8">
          <MultiSelect
            label="Select Your Interests"
            options={Object.values(tagTypes)}
            selected={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
          {items && items.length > 0 && items[currentIndex] ? (
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
                }}
                showHeart={false}
              />
            </div>
          ) : (
            <div className="text-white text-xl">No Orgs to Display</div>
          )}

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleNotInterested}
              className="px-4 py-2 bg-gray-300 text-slate-900 rounded hover:bg-gray-400 cursor-pointer"
            >
              Not Interested
            </button>
            <button
              onClick={handleInterested}
              className="px-4 py-2 bg-cyan-200 text-slate-900 rounded hover:bg-teal-600 cursor-pointer"
            >
              Interested
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}