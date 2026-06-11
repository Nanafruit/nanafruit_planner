"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  extractPo,
  submitPo,
  type ExtractPoState,
  type PoExtraction,
  type UploadPoState,
} from "./actions";

const initialExtractState: ExtractPoState = { status: "idle" };
const initialSubmitState: UploadPoState = { status: "idle" };

type HeaderDraft = {
  po_number: string;
  po_date: string;
  due_date: string;
  expiry_date: string;
  vendor_name: string;
  customer_name: string;
  notes: string;
};

type LineItemDraft = {
  product_code: string;
  description: string;
  quantity: string;
  unit: string;
};

const emptyHeader: HeaderDraft = {
  po_number: "",
  po_date: "",
  due_date: "",
  expiry_date: "",
  vendor_name: "",
  customer_name: "",
  notes: "",
};

const emptyLineItem: LineItemDraft = {
  product_code: "",
  description: "",
  quantity: "",
  unit: "",
};

function toInputValue(value: string | number | null): string {
  if (value === null) return "";
  return String(value);
}

function fromExtraction(data: PoExtraction): {
  header: HeaderDraft;
  lineItems: LineItemDraft[];
} {
  return {
    header: {
      po_number: toInputValue(data.po_number),
      po_date: toInputValue(data.po_date),
      due_date: toInputValue(data.due_date),
      expiry_date: toInputValue(data.expiry_date),
      vendor_name: toInputValue(data.vendor_name),
      customer_name: toInputValue(data.customer_name),
      notes: toInputValue(data.notes),
    },
    lineItems:
      data.line_items.length > 0
        ? data.line_items.map((item) => ({
            product_code: toInputValue(item.product_code),
            description: item.description,
            quantity: toInputValue(item.quantity),
            unit: toInputValue(item.unit),
          }))
        : [{ ...emptyLineItem }],
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm() {
  const [extractState, extractAction, extractPending] = useActionState(
    extractPo,
    initialExtractState,
  );
  const [submitState, submitAction, submitPending] = useActionState(
    submitPo,
    initialSubmitState,
  );

  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "review">("select");
  const [header, setHeader] = useState<HeaderDraft>(emptyHeader);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { ...emptyLineItem },
  ]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ปรับ header/lineItems/step ทันทีที่ผล OCR เปลี่ยน (render-time state adjustment แทน useEffect)
  const [handledExtractState, setHandledExtractState] = useState(extractState);
  if (extractState !== handledExtractState) {
    setHandledExtractState(extractState);
    if (extractState.status === "extracted") {
      const { header: nextHeader, lineItems: nextLineItems } = fromExtraction(
        extractState.data,
      );
      setHeader(nextHeader);
      setLineItems(nextLineItems);
      setStep("review");
    }
  }

  // เคลียร์ฟอร์มทันทีที่บันทึกสำเร็จ
  const [handledSubmitState, setHandledSubmitState] = useState(submitState);
  if (submitState !== handledSubmitState) {
    setHandledSubmitState(submitState);
    if (submitState.status === "success") {
      setSelected(null);
      setStep("select");
      setHeader(emptyHeader);
      setLineItems([{ ...emptyLineItem }]);
    }
  }

  // รีเซ็ต input ไฟล์ในฟอร์ม (DOM) เมื่อบันทึกสำเร็จ
  useEffect(() => {
    if (submitState.status === "success") {
      formRef.current?.reset();
    }
  }, [submitState]);

  // สร้าง object URL สำหรับ preview ไฟล์ PDF ที่เลือก และ revoke เมื่อเปลี่ยน/ยกเลิก
  useEffect(() => {
    if (!selected) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);

  function updateLineItem(
    index: number,
    field: keyof LineItemDraft,
    value: string,
  ) {
    setLineItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  function handleChangeFile() {
    setStep("select");
  }

  const lineItemsJson = JSON.stringify(
    lineItems
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        product_code: item.product_code.trim() || null,
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unit: item.unit.trim() || null,
      })),
  );

  return (
    <div
      className={
        selected ? "grid gap-6 lg:grid-cols-2 lg:items-start" : undefined
      }
    >
      <form ref={formRef} className="space-y-4">
        <div style={{ display: step === "select" ? "block" : "none" }}>
          <label
            htmlFor="po-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100"
          >
            {selected ? (
              <>
                <span className="text-sm font-medium text-zinc-800">
                  {selected.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatSize(selected.size)} — คลิกเพื่อเปลี่ยนไฟล์
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-zinc-700">
                  คลิกเพื่อเลือกไฟล์ใบ PO
                </span>
                <span className="text-xs text-zinc-500">
                  รองรับเฉพาะ PDF ขนาดไม่เกิน 20MB
                </span>
              </>
            )}
          </label>

          <button
            type="submit"
            formAction={extractAction}
            disabled={extractPending || !selected}
            className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {extractPending ? "กำลังอ่านข้อมูลจากไฟล์..." : "อ่านข้อมูลจากไฟล์"}
          </button>

          {extractState.status === "error" && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {extractState.message}
            </div>
          )}
        </div>

        {/* input ไฟล์อยู่ใน form ตลอด เพื่อให้ submit ขั้นสุดท้ายส่งไฟล์ไปด้วย */}
        <input
          ref={fileInputRef}
          id="po-file"
          name="file"
          type="file"
          accept="application/pdf"
          className={step === "select" ? "sr-only" : "hidden"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelected(file ?? null);
          }}
        />

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm">
              <span className="truncate text-zinc-700">{selected?.name}</span>
              <button
                type="button"
                onClick={handleChangeFile}
                className="shrink-0 text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                เปลี่ยนไฟล์
              </button>
            </div>

            <p className="text-sm text-zinc-600">
              ตรวจสอบข้อมูลที่อ่านได้จากใบ PO และแก้ไขให้ถูกต้องก่อนบันทึก
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="เลขที่ PO"
                name="po_number"
                value={header.po_number}
                onChange={setHeader}
              />
              <Field
                label="วันที่ PO"
                name="po_date"
                type="date"
                value={header.po_date}
                onChange={setHeader}
              />
              <Field
                label="ผู้ขาย (Vendor)"
                name="vendor_name"
                value={header.vendor_name}
                onChange={setHeader}
              />
              <Field
                label="ผู้ซื้อ (Customer)"
                name="customer_name"
                value={header.customer_name}
                onChange={setHeader}
              />
              <Field
                label="วันกำหนดส่ง"
                name="due_date"
                type="date"
                value={header.due_date}
                onChange={setHeader}
              />
              <Field
                label="วันหมดอายุ"
                name="expiry_date"
                type="date"
                value={header.expiry_date}
                onChange={setHeader}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600">
                หมายเหตุ
              </label>
              <textarea
                name="notes"
                value={header.notes}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, notes: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  รายการสินค้า
                </span>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                >
                  + เพิ่มรายการ
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <input
                      placeholder="รหัสสินค้า"
                      value={item.product_code}
                      onChange={(e) =>
                        updateLineItem(index, "product_code", e.target.value)
                      }
                      className="col-span-2 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                    <input
                      placeholder="รายละเอียด"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, "description", e.target.value)
                      }
                      className="col-span-6 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                    <input
                      placeholder="จำนวน"
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, "quantity", e.target.value)
                      }
                      className="col-span-2 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                    <input
                      placeholder="หน่วย"
                      value={item.unit}
                      onChange={(e) =>
                        updateLineItem(index, "unit", e.target.value)
                      }
                      className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="col-span-1 text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <input type="hidden" name="line_items" value={lineItemsJson} />

            <button
              type="submit"
              formAction={submitAction}
              disabled={submitPending}
              onClick={() => {
                // หลัง extractAction สำเร็จ React จะ reset uncontrolled input
                // ในฟอร์ม ทำให้ <input type="file"> ว่างไป ต้องคืนค่าไฟล์
                // จาก state ก่อน submit รอบนี้
                if (selected && fileInputRef.current) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(selected);
                  fileInputRef.current.files = dataTransfer.files;
                }
              }}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {submitPending ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}
            </button>
          </div>
        )}

        {submitState.status === "success" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            บันทึกสำเร็จ:{" "}
            <a
              href={submitState.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {submitState.fileName}
            </a>
          </div>
        )}

        {submitState.status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {submitState.message}
          </div>
        )}
      </form>

      {selected && previewUrl && (
        <div className="lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4 px-1 pb-2">
            <span className="truncate text-xs font-medium text-zinc-500">
              ตัวอย่างไฟล์: {selected.name}
            </span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            >
              เปิดในแท็บใหม่
            </a>
          </div>
          <iframe
            src={previewUrl}
            title="ตัวอย่างไฟล์ PO"
            className="h-[80vh] w-full rounded-xl border border-zinc-200 bg-zinc-50"
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: keyof HeaderDraft;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<HeaderDraft>>;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange((h) => ({ ...h, [name]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
    </div>
  );
}
