"use client";

import { useActionState, useRef, useState } from "react";
import { uploadPo, type UploadPoState } from "./actions";

const initialState: UploadPoState = { status: "idle" };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadPo, initialState);
  const [selected, setSelected] = useState<{ name: string; size: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
        <input
          id="po-file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelected(file ? { name: file.name, size: file.size } : null);
          }}
        />
      </label>

      <button
        type="submit"
        disabled={pending || !selected}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "กำลังอัพโหลด..." : "อัพโหลด"}
      </button>

      {state.status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          อัพโหลดสำเร็จ:{" "}
          <a
            href={state.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-2"
          >
            {state.fileName}
          </a>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}
    </form>
  );
}
