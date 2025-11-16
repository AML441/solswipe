"use client";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { arrayRemove, arrayUnion, doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Organization } from "@/types/organization";
import Modal from "./modal";
import { simulateTransaction } from "@/lib/solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { tagTypes } from "@/types/organization";
import { Badge } from "@/components/badge"; // Import Badge component

interface CardProps {
  key: string;
  orgData: Organization & { id: string }; // Include id for Firestore
  liked: boolean;
  onLike: (newLiked: boolean) => void;
  showHeart: boolean;
}

// Define a mapping from tags to color names
const tagColorMap: { [key in tagTypes]: string } = {
  [tagTypes.Education]: "blue",
  [tagTypes.Health]: "red",
  [tagTypes.Environment]: "green",
  [tagTypes.AnimalWelfare]: "yellow",
  [tagTypes.HumanRights]: "purple",
  [tagTypes.Tech]: "pink",
  [tagTypes.Media]: "indigo",
  [tagTypes.Finance]: "orange",
  [tagTypes.Food]: "white",
  [tagTypes.Other]: "gray",  // Default for Other
};

export default function Card({ orgData, liked, onLike, showHeart }: CardProps) {
  const { id, name, description, tags, contact, address } = orgData;
  const [uid, setUid] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Add loading state
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) setUid(user.uid);

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
    onLike(newLiked);

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

  const handlePayment = async () => {
    // Validation
    if (!connected || !publicKey) {
      setPaymentStatus("Please connect your wallet before making a payment.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setPaymentStatus("Please enter a valid amount.");
      return;
    }

    if (!address) {
      setPaymentStatus("Recipient address is missing.");
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus("Simulating transaction...");

      // Pass connection from wallet provider
      const result = await simulateTransaction(
        connection, // Use wallet's connection
        publicKey.toBase58(), 
        address, 
        parseFloat(amount)
      );

      if (result.success) {
        setPaymentStatus(`${result.details}`);
        
        // Optional: Log transaction details
        console.log("Simulation successful:", {
          from: publicKey.toBase58(),
          to: address,
          amount: parseFloat(amount),
          logs: result.logs,
          unitsConsumed: result.unitsConsumed,
        });

        // Reset form after 2 seconds
        setTimeout(() => {
          setAmount("");
          setIsOpen(false);
          setPaymentStatus(null);
        }, 2000);
      } else {
        setPaymentStatus(`Simulation failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="group w-auto h-auto text-black aspect-[9/7] flex flex-col justify-start p-[2.5em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
      <div className="flex flex-row justify-between items-center">
        <p className="text-4xl">{name}</p>
        {showHeart && (  // Conditionally render the heart based on showHeart prop
          <FaHeart
            className={`h-[3em] w-[3em] cursor-pointer transition-colors duration-300 ${
              liked ? "text-red-500" : "text-gray-400"
            }`}
            onClick={handleLike}
          />
        )}
      </div>
       {/* Display tags using Badge component */}
     <div className="mt-4 mb-2 flex flex-wrap gap-2">
        {tags?.map((tag: tagTypes, index: number) => {
          // Use the tagColorMap to fetch color for the tag
          const tagColor = tagColorMap[tag]; 
          return (
            <Badge
              key={index}
              text={tag}
              color={tagColor}  // Use the resolved color from the map
            />
          );
        })}
      </div>
      <p className="text-2xl py-5">{description}</p>
      <p className="text-2xl">{contact}</p>
      <div className="flex justify-center mt-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-[.75em] bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 py-2"
        >
          Make Payment
        </button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <h2 className="text-xl font-semibold mb-4">Donate to {name}</h2>
          
          {/* Show wallet connection status */}
          {!connected ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ Please connect your wallet to simulate a donation.
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm font-mono break-all">
                ✅ Wallet: {publicKey?.toBase58()}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-2 rounded">
              {address}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              step="0.01"
              min="0"
              disabled={!connected || isProcessing}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={!connected || isProcessing}
            className="w-full bg-cyan-200 text-slate-900 py-2 rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
          >
            {isProcessing ? "Simulating..." : "Simulate Payment"}
          </button>

          {paymentStatus && (
            <div className={`mt-4 p-3 rounded ${
              paymentStatus.includes("✅") 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : paymentStatus.includes("⏳")
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <p className="text-sm">{paymentStatus}</p>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              setPaymentStatus(null);
              setAmount("");
            }}
            disabled={isProcessing}
            className="mt-4 w-full text-gray-500 hover:text-gray-700 disabled:text-gray-300"
          >
            Cancel
          </button>
        </Modal>
      </div>
    </div>
  );
}