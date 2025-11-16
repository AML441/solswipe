"use client";

import { useState, useRef, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import cosineSimilarity from "compute-cosine-similarity";


import Navbar from "@/components/navbar";
import Card from "@/components/card";
import MultiSelect from "@/components/multiselect";
import { db } from "@/lib/firebase";
import { items as importedItems } from "../../types/Items";
import { Organization, tagTypes } from "@/types/organization";

// ----------------------
// Types
// ----------------------
type OrgWithIndex = Organization & { originalIndex: number };

// ----------------------
// Helpers
// ----------------------

// Fetch embeddings from API
// Calculate similarity order
function getSimilarOrgs(originalIndex: number, embeddings: number[][]) {
  const similarities: { index: number; score: number }[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    if (i === originalIndex) continue;
    similarities.push({
      index: i,
      score: cosineSimilarity(embeddings[originalIndex], embeddings[i]),
    });
  }

  similarities.sort((a, b) => b.score - a.score);
  return similarities.map((s) => s.index); // Return ORIGINAL indexes
}

// ----------------------
// Component
// ----------------------
export default function SwipingPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeStart, setSwipeStart] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [embeddings, setEmbeddings] = useState<number[][]>([]);
    const [items, setItems] = useState<OrgWithIndex[]>([]);
    const [selectedTags, setSelectedTags] = useState<tagTypes[]>([]);
    const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
    const [seenIds, setSeenIds] = useState<string[]>([]);
    const [embeddingsReady, setEmbeddingsReady] = useState(false);
  // ----------------------
  // State
  // ----------------------


  const cardRef = useRef<HTMLDivElement | null>(null);
  const swipeThreshold = 50;

  // ----------------------
  // Initialize likedMap
  // ----------------------
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    importedItems.forEach((item) => {
      initialMap[item.id] = false;
    });
    setLikedMap(initialMap);
  }, []);

  // ----------------------
  // Auth listener
  // ----------------------
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) setUid(auth.currentUser.uid);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user ? user.uid : null);
    });

    return () => unsubscribe();
  }, []);

  // ----------------------
  // Fetch seen IDs & filter items
  // ----------------------
  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedIds: string[] = data.saved || [];
          setSeenIds(savedIds);

          const filteredItems = importedItems
            .filter((org) => !savedIds.includes(org.id))
            .map((org, index) => ({ ...org, originalIndex: index }));

          setItems(filteredItems);
        } else {
          setItems(
            importedItems.map((org, index) => ({
              ...org,
              originalIndex: index,
            }))
          );
        }
      })
      .catch((err) => console.error("Error fetching seenIds:", err));
  }, [uid]);

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

  useEffect(() => {
    generateEmbeddings().then((data) => {
      setEmbeddings(data);
      console.log("Embeddings set in state:", data);
    });
  }, []);

  useEffect(() => {
    const filteredItems = importedItems
      .filter((org) => {
        const matchesTag = selectedTags.length
          ? selectedTags.every((tag) => org.tags.includes(tag))
          : true;

        const isNotSaved = !seenIds.includes(org.id);
        return matchesTag && isNotSaved;
      })
      .map((org, index) => ({ ...org, originalIndex: index }));

    setItems(filteredItems);
  }, [selectedTags, seenIds]);

  const saveOrg = async (orgId: string) => {
    if (!uid) {
      console.error("User not logged in!");
      return;
    }

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { saved: arrayUnion(orgId) }, { merge: true });
      console.log("Saved org:", orgId);
    } catch (err) {
      console.error("Failed to update saved org", err);
    }
  };


// Declare useRef at the top of the component
const embeddingsPromiseRef = useRef<Promise<number[][]> | null>(null);  // Reference to store the embeddings fetch promise

// Function to generate embeddings
const generateEmbeddings = async (): Promise<number[][]> => {
  // If embeddings are ready, just return them
  if (embeddingsReady && embeddings.length > 0) {
    return embeddings;
  }

  // If there’s already a promise, just return it to avoid duplicate fetches
  if (embeddingsPromiseRef.current) {
    return embeddingsPromiseRef.current;
  }

  // Start fetching the embeddings
  embeddingsPromiseRef.current = fetch("/api/recommendations/embeddings")
    .then((res) => res.json())
    .then((data) => {
      if (data.embeddings && data.embeddings.length > 0) {
        setEmbeddings(data.embeddings);  // Update the embeddings state
        setEmbeddingsReady(true);        // Mark embeddings as ready
        embeddingsPromiseRef.current = null;  // Clear the promise ref after completion
      } else {
        setEmbeddingsReady(false);  // In case the response is empty
      }
      return data.embeddings;  // Return the embeddings from the API
    })
    .catch((err) => {
      console.error("Failed to fetch embeddings", err);
      embeddingsPromiseRef.current = null;  // Clear the promise ref in case of error
      setEmbeddingsReady(false);  // Mark embeddings as not ready if the fetch fails
      return [];
    });

  // Return the promise to avoid re-fetching during the same lifecycle
  return embeddingsPromiseRef.current;
};




const handleReorderingAndUpdate = async (index: number) => {
  if (!items || !items[index]) return;

  const currentOrg = items[index];
  await saveOrg(currentOrg.id);
  setSeenIds((prev) => [...prev, currentOrg.id]);

  // Ensure embeddings are ready
  let embs = embeddings;
  if (!embeddingsReady || !embs || embs.length === 0) {
    embs = await generateEmbeddings(); // make sure it returns an array
  }

  if (!embs || embs.length === 0) {
    console.error("Embeddings not ready or empty, cannot reorder");
    setItems(items.filter((item, idx) => idx !== index));
    setCurrentIndex(0);
    return;
  }

  const filteredItems = items.filter((item) => item.id !== currentOrg.id);

  const similarOrder = getSimilarOrgs(currentOrg.originalIndex, embs); // safe now

  const reordered: OrgWithIndex[] = [
    ...similarOrder
      .map((origIdx) => filteredItems.find((item) => item.originalIndex === origIdx))
      .filter((item): item is OrgWithIndex => !!item),
    ...filteredItems.filter((item) => !similarOrder.includes(item.originalIndex)),
  ];

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
      await handleReorderingAndUpdate(currentIndex);
    } else if (moveDiff < -swipeThreshold) {
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
                disabled={!embeddingsReady || !(embeddings?.length > 0)}
                className={`px-4 py-2 rounded cursor-pointer ${
                  !embeddingsReady ? 'bg-gray-500 text-gray-300' : 'bg-cyan-200 text-slate-900 hover:bg-teal-600'
                }`}
              >
                Interested
            </button>


          </div>
        </div>
      </div>
    </div>
  );
}
