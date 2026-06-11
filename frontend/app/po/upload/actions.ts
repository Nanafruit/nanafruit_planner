"use server";

import { refresh } from "next/cache";
import { apiUpload } from "@/app/lib/api-client";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — ให้ตรงกับ limit ฝั่ง backend

export type UploadPoState =
  | { status: "idle" }
  | { status: "success"; fileName: string; url: string }
  | { status: "error"; message: string };

interface PurchaseOrderResponse {
  file_name: string;
  sharepoint_url: string;
}

export async function uploadPo(
  _prevState: UploadPoState,
  formData: FormData,
): Promise<UploadPoState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "กรุณาเลือกไฟล์ PDF ก่อนอัพโหลด" };
  }
  if (file.type !== "application/pdf") {
    return { status: "error", message: "รองรับเฉพาะไฟล์ PDF เท่านั้น" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { status: "error", message: "ขนาดไฟล์ต้องไม่เกิน 20MB" };
  }

  try {
    // apiUpload ตรวจ session ภายในอยู่แล้ว (โยน error ถ้ายังไม่ login)
    const record = (await apiUpload(
      "/po/upload",
      formData,
    )) as PurchaseOrderResponse;

    refresh(); // ให้รายการอัพโหลดล่าสุดบนหน้าอัพเดตทันที
    return {
      status: "success",
      fileName: record.file_name,
      url: record.sharepoint_url,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "อัพโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}
