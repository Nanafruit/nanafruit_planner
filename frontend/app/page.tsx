import SignInButton from "./components/sign-in-button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
          Planner
        </h1>
        <SignInButton />
      </main>
    </div>
  );
}
