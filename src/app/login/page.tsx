"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <main className="max-w-md mx-auto mt-20">
      <h1 className="text-3xl font-bold mb-6">
        School Drill Login
      </h1>

      <input
        className="border p-2 w-full mb-3"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleLogin}
      >
        Login
      </button>

      {error && (
        <p className="text-red-500 mt-3">
          {error}
        </p>
      )}
    </main>
  );
}