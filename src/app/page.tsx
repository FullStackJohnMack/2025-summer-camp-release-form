'use client';

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Summer Camp 2025</h1>
      <Link href="/release">
          Fill Out Release Form Here
      </Link>
    </div>
  );
}
