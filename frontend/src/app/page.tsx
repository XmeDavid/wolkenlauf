import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-screen h-screen flex flex-column justify-center items-center">
      <a href="/login">
        Login
      </a>
      <a href="/dashboard"> Dashboard</a>
    </div>
  );
}
