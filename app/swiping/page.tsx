"use client";

import { useState, useRef, useEffect } from "react";
import Card from "@/components/card";
import Navbar from "@/components/navbar";
import { Organization } from "@/types/organization";
import { tagTypes } from "@/types/organization";

export default function SwipingPage() {
  const items: Organization[] = [
        { id: 1, name: "BrightFuture Scholars", description: "Provides scholarships, mentorship, and tutoring programs to low-income high school students pursuing STEM fields.", tags: [tagTypes.Education], contact: "contact@brightfuturescholars.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 2, name: "Clean Earth Initiative", description: "Focuses on environmental conservation through community clean-ups, recycling education, and sustainability advocacy.", tags: [tagTypes.Environment], contact: "info@cleanearthinitiative.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 3, name: "Hearts & Homes Animal Rescue", description: "Rescues abandoned or injured animals, offers medical care, and facilitates adoption into loving families.", tags: [tagTypes.AnimalWelfare, tagTypes.Health], contact: "support@heartandhomes.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 4, name: "YouthTech Access Network", description: "Bridges the digital divide by providing laptops, internet access, and coding classes to underserved youth.", tags: [tagTypes.Education,tagTypes.Tech], contact: "hello@youthtechaccess.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 5, name: "Global Food Bank Network", description: "Collects surplus food from restaurants and grocery stores to distribute to those in need, reducing food waste.", tags: [tagTypes.Food], contact: "contact@gfbn.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 6, name: "Global Water Action", description: "Works internationally to create clean water systems, build wells, and promote safe sanitation practices.", tags: [tagTypes.HumanRights,tagTypes.Food, tagTypes.Health], contact: "outreach@globalwateraction.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 7, name: "ElderCare Connection", description: "Supports senior citizens with companionship programs, mobility assistance, and free home wellness visits.", tags: [tagTypes.Health], contact: "care@eldercareconnection.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 8, name: "Green Gardens Urban Farming", description: "Creates community gardens in urban neighborhoods to increase access to fresh food and teach sustainable agriculture.", tags: [tagTypes.Environment,tagTypes.Food], contact: "grow@greengardensuf.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 9, name: "SafePath Domestic Support", description: "Provides safe housing, crisis counseling, and legal resources for individuals escaping domestic violence.", tags: [tagTypes.Health,tagTypes.HumanRights], contact: "help@safepathsupport.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 10, name: "World Literacy Bridge", description: "Promotes global literacy through book drives, mobile libraries, and volunteer teaching programs.", tags: [tagTypes.Education], contact: "contact@worldliteracybridge.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
        { id: 11, name: "Mindful Minds Foundation", description: "Promotes mental health awareness by offering free workshops, peer support groups, and school outreach programs.", tags: [tagTypes.Health,tagTypes.Media], contact: "info@mmf.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeStart, setSwipeStart] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const swipeThreshold = 50; // Minimum swipe distance to trigger the swipe action
  const cardRef = useRef<HTMLDivElement | null>(null); // Ref for the card container

  // Handle swipe start and end for touch and mouse events
  const getClientX = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      return e.touches[0].clientX; // Access clientX from the touch object
    } else {
      return e.clientX; // Access clientX from MouseEvent
    }
  };

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    const touchStart = getClientX(e);
    setSwipeStart(touchStart);
    setIsSwiping(true);
  };

  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping) return;

    const touchEnd = getClientX(e);
    const moveDiff = touchEnd - swipeStart;

    if (moveDiff > swipeThreshold) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length); // Swipe right to go to the previous card
    } else if (moveDiff < -swipeThreshold) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length); // Swipe left to go to the next card
    }

    // Reset the card position and add transition effect
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
      cardRef.current.style.transform = "translateX(0)"; // Reset position
    }

    setIsSwiping(false);
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping) return;
    const touchMove = getClientX(e);
    const moveDiff = touchMove - swipeStart;

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${moveDiff}px)`; // Move card as user swipes
    }
  };

  // Handle keydown events for arrow key navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length); // Arrow left -> Next card
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length); // Arrow right -> Previous card
      }
    };

    // Add event listener for keydown
    window.addEventListener("keydown", handleKeydown);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-900 to-slate-900 flex flex-row">
      <div>
        <Navbar />
      </div>
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
            org={items[currentIndex].name}
            desc={items[currentIndex].description}
            contact={items[currentIndex].contact}
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)} // Ensure the behavior is uniform
            className="px-4 py-2 bg-gray-300 text-slate-900 rounded hover:bg-gray-400"
          >
            Not Interested
          </button>
          <button
            onClick={() => setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)} // Ensure the behavior is uniform
            className="px-4 py-2 bg-cyan-200 text-slate-900 rounded hover:bg-teal-600"
          >
            Interested
          </button>
        </div>
      </div>
    </div>
  );
}