'use client';

import Card from "@/components/card";
import { Organization } from "@/types/organization";
import Navbar from "@/components/navbar";
import LayoutWithSidebar from "@/components/navbar";
import { tagTypes } from "@/types/organization";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export const items: Organization[] = [
    { id: "1", name: "BrightFuture Scholars", description: "Provides scholarships, mentorship, and tutoring programs to low-income high school students pursuing STEM fields.", tags: [tagTypes.Education], contact: "contact@brightfuturescholars.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "2", name: "Clean Earth Initiative", description: "Focuses on environmental conservation through community clean-ups, recycling education, and sustainability advocacy.", tags: [tagTypes.Environment], contact: "info@cleanearthinitiative.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "3", name: "Hearts & Homes Animal Rescue", description: "Rescues abandoned or injured animals, offers medical care, and facilitates adoption into loving families.", tags: [tagTypes.AnimalWelfare, tagTypes.Health], contact: "support@heartandhomes.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "4", name: "YouthTech Access Network", description: "Bridges the digital divide by providing laptops, internet access, and coding classes to underserved youth.", tags: [tagTypes.Education, tagTypes.Tech], contact: "hello@youthtechaccess.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "5", name: "Global Food Bank Network", description: "Collects surplus food from restaurants and grocery stores to distribute to those in need, reducing food waste.", tags: [tagTypes.Food], contact: "contact@gfbn.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "6", name: "Global Water Action", description: "Works internationally to create clean water systems, build wells, and promote safe sanitation practices.", tags: [tagTypes.HumanRights, tagTypes.Food, tagTypes.Health], contact: "outreach@globalwateraction.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "7", name: "ElderCare Connection", description: "Supports senior citizens with companionship programs, mobility assistance, and free home wellness visits.", tags: [tagTypes.Health], contact: "care@eldercareconnection.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "8", name: "Green Gardens Urban Farming", description: "Creates community gardens in urban neighborhoods to increase access to fresh food and teach sustainable agriculture.", tags: [tagTypes.Environment, tagTypes.Food], contact: "grow@greengardensuf.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "9", name: "SafePath Domestic Support", description: "Provides safe housing, crisis counseling, and legal resources for individuals escaping domestic violence.", tags: [tagTypes.Health, tagTypes.HumanRights], contact: "help@safepathsupport.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "10", name: "World Literacy Bridge", description: "Promotes global literacy through book drives, mobile libraries, and volunteer teaching programs.", tags: [tagTypes.Education], contact: "contact@worldliteracybridge.org", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
    { id: "11", name: "Mindful Minds Foundation", description: "Promotes mental health awareness by offering free workshops, peer support groups, and school outreach programs.", tags: [tagTypes.Health, tagTypes.Media], contact: "info@mmf.com", address: "3Ypzjvg3V3THNeHhdeKPLQfpfyUKGYYyB8GVddWLCzF9" },
];

export default function testing() {
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
                setSavedOrgIds(snap.data().saved ?? []); // <-- FIX!
            }
        };

        fetchSaved();
    }, [uid]);

    const savedOrgs = items.filter(org =>
        savedOrgIds.includes(org.id)
    );

    return (
        <div className="min-h-screen bg-linear-to-b from-indigo-900 to-slate-900 flex flex-row">
            <div>
                <Navbar />
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-white text-center mt-8 p-6">Your Saved Organizations</h1>
                {savedOrgs.length === 0 && (
                    <Link href="/swiping">
                    <button className="w-auto bg-cyan-200 text-slate-900 py-2 rounded-lg hover:bg-teal-600">You have no saved organizations. Click here to explore!</button>
                    </Link>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {savedOrgs.map((item) => (
                        <Card key={item.id} orgData={{ ...item, id: item.id.toString() }} liked={true} onLike={() => console.log("liked", true)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

