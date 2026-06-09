import { auth } from "@/auth";
import SignInButton from "../components/sign-in-button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-zinc-600">สวัสดี, {session?.user?.name}</p>
      <SignInButton />
    </div>
  );
}
