"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    try {
      setError("");

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
  <main className="min-h-screen flex items-center justify-center p-4">
    <div className="w-full max-w-md">

      <div className="flex justify-center mb-6">
        <Image
          src="/logo2.png"
          alt="School Drill"
          width={220}
          height={220}
          priority
          className="w-40 sm:w-52 h-auto"
        />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">
        HSAP
      </h1>
<h1 className="text-3xl font-bold mb-6 text-center">
        School Drill Login
      </h1>


      <input
        className="border p-3 w-full mb-3 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-3 w-full mb-3 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-black text-white px-4 py-3 rounded w-full"
        onClick={handleLogin}
      >
        Login
      </button>

      {error && (
        <p className="text-red-500 mt-3 text-center">
          {error}
        </p>
      )}

    </div>
  </main>
);
}