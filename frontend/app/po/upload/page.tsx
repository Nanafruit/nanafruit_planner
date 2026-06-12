import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { auth } from "@/auth";
import UploadForm from "./upload-form";

export default async function PoUploadPage() {
  const session = await auth();

  if (session?.role === "production") {
    redirect("/bom");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">
                อัพโหลดใบ PO
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                ไฟล์จะถูกเก็บใน SharePoint และบันทึกข้อมูลลงระบบเพื่อนำไปสร้าง BOM
                ต่อไป
              </p>
            </div>
            <Link
              href="/po"
              className="shrink-0 text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            >
              ดูรายการ PO ที่อัพโหลดแล้ว
            </Link>
          </div>
          <div className="mt-6">
            <UploadForm />
          </div>
        </div>
      </main>
    </div>
  );
}
