import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <span className="text-base font-semibold tracking-tight text-zinc-900">
          Planner
        </span>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-zinc-800">
              {user?.name}
            </span>
            {user?.email && (
              <span className="text-xs text-zinc-500">{user.email}</span>
            )}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
