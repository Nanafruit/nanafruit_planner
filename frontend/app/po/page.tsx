import { redirect } from "next/navigation";
import Link from "next/link";
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

export default async function PoListPage() {
  const session = await auth();

  if (session?.role === "production") {
    redirect("/bom");
  }

  const orders = await getPurchaseOrders();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                รายการ PO ที่อัพโหลด
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                ไฟล์ PO ที่ถูกอัพโหลดเข้าระบบและบันทึกไว้ใน SharePoint
              </p>
            </div>
            <Link
              href="/po/upload"
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              อัพโหลด PO ใหม่
            </Link>
          </div>

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
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">ยังไม่มีรายการ PO</p>
          )}
        </div>
      </main>
    </div>
  );
}
