import NextAuth from "next-auth";
import { authOptions } from "@/lib/services/nextAuth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };