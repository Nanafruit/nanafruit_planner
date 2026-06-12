import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../components/navbar";
import { auth } from "@/auth";
import { apiFetch } from "@/app/lib/api-client";

interface PurchaseOrder {
  id: string;
  file_name: string;
  sharepoint_url: string;
  uploaded_by_name: string | null;
  uploaded_by_email: string;
  status: string;
  po_number: string | null;
  vendor_name: string | null;
  created_at: string;
}

async function getPurchaseOrders(): Promise<PurchaseOrder[] | null> {
  try {
    return (await apiFetch("/po")) as PurchaseOrder[];
  } catch {
    // backend ยังไม่พร้อม / ดึงข้อมูลไม่ได้ — ไม่ต้องล้มทั้งหน้า
    return null;
  }
}

export default async function ProductionBomPage() {
  const session = await auth();
  const canFillBom =
    session?.role === "admin" || session?.role === "production";

  if (!canFillBom) {
    redirect("/dashboard");
  }

  const orders = await getPurchaseOrders();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-zinc-900">Production</h1>
          <p className="mt-1 text-sm text-zinc-500">
            เลือกใบ PO ที่ต้องการกรอกรายละเอียด BOM
          </p>

          {orders && orders.length > 0 ? (
            <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <a
                      href={order.sharepoint_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium text-zinc-800 hover:underline"
                    >
                      {order.file_name}
                    </a>
                    <span className="text-xs text-zinc-500">
                      {order.uploaded_by_name ?? order.uploaded_by_email} —{" "}
                      {new Date(order.created_at).toLocaleString("th-TH")}
                    </span>
                    {(order.po_number || order.vendor_name) && (
                      <span className="block text-xs text-zinc-500">
                        {order.po_number ?? "-"} · {order.vendor_name ?? "-"}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/bom/${order.id}`}
                      className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      กรอก BOM
                    </Link>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">ยังไม่มีใบ PO ในระบบ</p>
          )}
        </div>
      </main>
    </div>
  );
}
