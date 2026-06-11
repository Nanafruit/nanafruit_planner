"use server";

import { refresh } from "next/cache";
import { apiUpload } from "@/app/lib/api-client";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — ให้ตรงกับ limit ฝั่ง backend

export type PoLineItem = {
  product_code: string | null;
  description: string;
  quantity: number | null;
  unit: string | null;
};

export type PoExtraction = {
  po_number: string | null;
  po_date: string | null;
  due_date: string | null;
  expiry_date: string | null;
  vendor_name: string | null;
  customer_name: string | null;
  notes: string | null;
  line_items: PoLineItem[];
};

export type ExtractPoState =
  | { status: "idle" }
  | { status: "extracted"; data: PoExtraction }
  | { status: "error"; message: string };

export type UploadPoState =
  | { status: "idle" }
  | { status: "success"; fileName: string; url: string }
  | { status: "error"; message: string };

function validateFile(formData: FormData): File | { message: string } {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { message: "กรุณาเลือกไฟล์ PDF ก่อน" };
  }
  if (file.type !== "application/pdf") {
    return { message: "รองรับเฉพาะไฟล์ PDF เท่านั้น" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { message: "ขนาดไฟล์ต้องไม่เกิน 20MB" };
  }
  return file;
}

export async function extractPo(
  _prevState: ExtractPoState,
  formData: FormData,
): Promise<ExtractPoState> {
  const file = validateFile(formData);
  if (!(file instanceof File)) {
    return { status: "error", message: file.message };
  }

  const upload = new FormData();
  upload.set("file", file);

  try {
    const data = (await apiUpload("/po/extract", upload)) as PoExtraction;
    return { status: "extracted", data };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "อ่านข้อมูลจากไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

interface PurchaseOrderResponse {
  file_name: string;
  sharepoint_url: string;
}

function textField(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  return raw.trim();
}

export async function submitPo(
  _prevState: UploadPoState,
  formData: FormData,
): Promise<UploadPoState> {
  const file = validateFile(formData);
  if (!(file instanceof File)) {
    return { status: "error", message: file.message };
  }

  let lineItems: unknown;
  try {
    lineItems = JSON.parse((formData.get("line_items") as string) || "[]");
  } catch {
    return { status: "error", message: "ข้อมูลรายการสินค้าไม่ถูกต้อง" };
  }

  const data = {
    po_number: textField(formData, "po_number"),
    po_date: textField(formData, "po_date"),
    due_date: textField(formData, "due_date"),
    expiry_date: textField(formData, "expiry_date"),
    vendor_name: textField(formData, "vendor_name"),
    customer_name: textField(formData, "customer_name"),
    notes: textField(formData, "notes"),
    line_items: lineItems,
  };

  const upload = new FormData();
  upload.set("file", file);
  upload.set("data", JSON.stringify(data));

  try {
    const record = (await apiUpload(
      "/po/upload",
      upload,
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
          : "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}
