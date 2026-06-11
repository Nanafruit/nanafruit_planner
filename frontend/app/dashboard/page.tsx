import Navbar from "../components/navbar";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* เนื้อหา dashboard จะเพิ่มภายหลัง */}
      </main>
    </div>
  );
}
