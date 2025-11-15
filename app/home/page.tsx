// "use client";

// import { useState } from "react";
// import { useWallet } from "@solana/wallet-adapter-react";
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { useSession, signIn, getCsrfToken } from "next-auth/react";
// import bs58 from "bs58";
// import { SigninMessage } from "@/lib/SigninMessage";

// export default function HomePage() {
//   const { data: session, status } = useSession();
//   const { publicKey, signMessage, connected } = useWallet();
//   const [isSigningIn, setIsSigningIn] = useState(false);

//   // Wait until session is loaded
//   if (status === "loading") {
//     return <p>Loading session...</p>;
//   }

//   if (status === "unauthenticated") {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
//         <p className="text-lg">Please sign in to save your wallet.</p>
//         <button
//           onClick={() => signIn()}
//           className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Sign In
//         </button>
//       </div>
//     );
//   }

//   const handleSaveWallet = async () => {
//     if (!publicKey || !signMessage) {
//       alert("Connect your wallet first!");
//       return;
//     }

//     const uid = session?.user?.name; // use name as UID
//     if (!uid) {
//       alert("User not logged in! Sign in first.");
//       return;
//     }

//     try {
//       setIsSigningIn(true);

//       const walletAddress = publicKey.toBase58();
//       const csrf = await getCsrfToken();

//       // Prepare message to sign
//       const message = new SigninMessage({
//         domain: window.location.host,
//         publicKey: walletAddress,
//         statement: "Sign in with your Solana wallet",
//         nonce: csrf || "",
//       });

//       const data = new TextEncoder().encode(message.prepare());
//       const signature = await signMessage(data);
//       const signatureBase58 = bs58.encode(signature);

//       // Call backend to save wallet
//       const res = await fetch("/api/add-wallet", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ uid, walletAddress }),
//       });

//       const json = await res.json();
//       if (!json.success) {
//         alert("Failed to save wallet: " + json.error);
//         return;
//       }

//       alert("✅ Wallet connected and saved: " + walletAddress);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to connect wallet.");
//     } finally {
//       setIsSigningIn(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
//       <h1 className="text-2xl font-bold">Connect Your Wallet</h1>

//       {!window.solana && (
//         <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
//           <p className="text-yellow-800">
//             ⚠️ Phantom wallet not detected. Install from{" "}
//             <a
//               href="https://phantom.app/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="underline font-semibold"
//             >
//               phantom.app
//             </a>
//           </p>
//         </div>
//       )}

//       <WalletMultiButton />

//       {connected && publicKey && (
//         <div className="flex flex-col items-center gap-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
//           <p className="text-sm font-mono text-blue-800">
//             Connected: {publicKey.toBase58()}
//           </p>
//           <button
//             onClick={handleSaveWallet}
//             disabled={isSigningIn}
//             className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-semibold"
//           >
//             {isSigningIn ? "Signing In..." : "Save Wallet"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSession, signIn as nextAuthSignIn, getCsrfToken } from "next-auth/react";
import bs58 from "bs58";
import { SigninMessage } from "@/lib/SigninMessage";

export default function HomePage() {
  const { publicKey, signMessage, connected, wallet } = useWallet();
  const { data: session } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Check if wallet is ready
  useEffect(() => {
    if (wallet && !wallet.readyState) {
      console.log("Wallet not ready:", wallet.readyState);
    }
  }, [wallet]);

  const handleSignInWithWallet = async () => {
    if (!publicKey || !signMessage) {
      alert("Connect your wallet first!");
      return;
    }

    if (session && (session as any).publicKey === publicKey.toBase58()) {
      alert("Already signed in with this wallet!");
      return;
    }

    try {
      setIsSigningIn(true);
      const walletAddress = publicKey.toBase58();
      const csrf = await getCsrfToken();

      // Build message
      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: walletAddress,
        statement: "Sign in with your Solana wallet",
        nonce: csrf || "",
      });

      // Sign message
      const data = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(data);
      const signatureBase58 = bs58.encode(signature);

      // Sign in via NextAuth
      const result = await nextAuthSignIn("credentials", {
        message: JSON.stringify({
          domain: message.domain,
          publicKey: message.publicKey,
          statement: message.statement,
          nonce: message.nonce,
        }),
        signature: signatureBase58,
        redirect: false,
      });

      if (result?.error) {
        alert("Failed to sign in: " + result.error);
        return;
      }

      alert("✅ Signed in with wallet: " + walletAddress);
    } catch (err) {
      console.error(err);
      alert("Failed to sign in.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-linear-to-b from-indigo-900 to-slate-900">
      <h1 className="text-2xl text-white font-bold">Connect Your Wallet</h1>

      {/* Show wallet installation prompt if needed */}
      {!window.solana && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            ⚠️ Phantom wallet not detected. Please install it from{" "}
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              phantom.app
            </a>
          </p>
        </div>
      )}

      <WalletMultiButton />

      {connected && publicKey && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-mono text-blue-800">
              Connected: {publicKey.toBase58()}
            </p>
          </div>

          <button
            onClick={handleSignInWithWallet}
            disabled={isSigningIn}
            className="px-6 py-3 cyan-200 text-slate-900 rounded hover:bg-teal-600 disabled:bg-gray-400 font-semibold"
          >
            {isSigningIn ? "Signing In..." : "Sign In with This Wallet"}
          </button>
        </div>
      )}

      {session && (
        <div className="p-4 bg-cyan-50 border-2 border-cyan-500 rounded">
          <p className="text-green-800 font-semibold">
            ✅ Signed in: {(session as any).publicKey}
          </p>
        </div>
      )}
    </div>
  );
}
