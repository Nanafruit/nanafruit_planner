import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Planner
          </h1>
          <p className="text-sm text-zinc-500">
            เข้าสู่ระบบเพื่อเริ่มใช้งาน
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Sign in with Microsoft
          </button>
        </form>
      </main>
    </div>
  );
}
