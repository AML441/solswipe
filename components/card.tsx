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
import { Badge } from "@/components/badge";

interface CardProps {
  key: string;
  orgData: Organization & { id: string };
  liked: boolean;
  onLike: (newLiked: boolean) => void;
  showHeart: boolean;
}

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
  [tagTypes.Other]: "gray",
};

export default function Card({ orgData, liked, onLike, showHeart }: CardProps) {
  const { id, name, description, tags, contact, address } = orgData;
  const [uid, setUid] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null); // Track success/error
  const [isProcessing, setIsProcessing] = useState(false);
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
      setPaymentSuccess(false);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setPaymentStatus("Please enter a valid amount.");
      setPaymentSuccess(false);
      return;
    }

    if (!address) {
      setPaymentStatus("Recipient address is missing.");
      setPaymentSuccess(false);
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStatus("Simulating transaction...");
      setPaymentSuccess(null); // Reset status

      const result = await simulateTransaction(
        connection,
        publicKey.toBase58(), 
        address, 
        parseFloat(amount)
      );

      if (result.success) {
        setPaymentStatus(result.details || "Transaction simulated successfully!");
        setPaymentSuccess(true);
        
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
          setPaymentSuccess(null);
        }, 2000);
      } else {
        setPaymentStatus(`Simulation failed: ${result.error}`);
        setPaymentSuccess(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("An unexpected error occurred.");
      setPaymentSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="group w-auto h-[450px] text-black flex flex-col justify-start p-[2em] bg-white border-1 relative border-gray-200 shadow-lg rounded-[.75em]">
      <div className="flex flex-row justify-between items-start">
        <p className="text-4xl w-4/5">{name}</p>
        {showHeart && (
          <div className="size-10 flex items-start justify-center">
          <FaHeart
            className={`size-full cursor-pointer transition-colors duration-300 ${
              liked ? "text-red-500" : "text-gray-400"
            }`}
            onClick={handleLike}
          />
          </div>
        )}
      </div>
      
      <div className="mt-4 mb-2 flex flex-wrap gap-2">
        {tags?.map((tag: tagTypes, index: number) => {
          const tagColor = tagColorMap[tag]; 
          return (
            <Badge
              key={index}
              text={tag}
              color={tagColor}
            />
          );
        })}
      </div>
      
      <p className="text-xl py-5">{description}</p>
      <p className="text-xl">{contact}</p>
      
      <div className="flex justify-center mt-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-[.75em] bg-cyan-200 text-slate-900 font-semibold hover:bg-teal-600 py-2 cursor-pointer"
        >
          Make Payment
        </button>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <h2 className="text-xl font-semibold mb-4">Donate to {name}</h2>
          
          {!connected ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                Please connect your wallet to simulate a donation.
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm font-mono break-all">
                Wallet: {publicKey?.toBase58()}
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
            className="w-full bg-cyan-200 text-slate-900 py-2 rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold cursor-pointer"
          >
            {isProcessing ? "Simulating..." : "Simulate Payment"}
          </button>

          {paymentStatus && (
            <div className={`mt-4 p-3 rounded ${
              paymentSuccess === true
                ? "bg-green-50 text-green-800 border border-green-200" 
                : paymentSuccess === false
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-cyan-50 text-cyan-800 border border-cyan-200"
            }`}>
              <p className="text-sm">{paymentStatus}</p>
            </div>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              setPaymentStatus(null);
              setPaymentSuccess(null);
              setAmount("");
            }}
            disabled={isProcessing}
            className="mt-4 w-full text-gray-500 hover:text-gray-700 disabled:text-gray-300 cursor-pointer"
          >
            Cancel
          </button>
        </Modal>
      </div>
    </div>
  );
}