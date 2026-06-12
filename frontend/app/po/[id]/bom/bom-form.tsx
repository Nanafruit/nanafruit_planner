"use client";

import { useState, useTransition } from "react";
import { saveBomDraft, submitBom, type BomLinePayload } from "./actions";
import type { BomForPoView } from "./page";

type MaterialDraft = { material_name: string; quantity: string; unit: string };
type PackagingDraft = { packaging_type: string; quantity: string };

type LineState = {
  lineItemId: string;
  lineNo: number;
  productCode: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  status: "draft" | "submitted" | "none";
  materials: MaterialDraft[];
  packaging: PackagingDraft[];
};

const emptyMaterial: MaterialDraft = { material_name: "", quantity: "", unit: "" };
const emptyPackaging: PackagingDraft = { packaging_type: "", quantity: "" };

function initLines(data: BomForPoView): LineState[] {
  return data.lines.map(({ line_item, bom }) => ({
    lineItemId: line_item.id,
    lineNo: line_item.line_no,
    productCode: line_item.product_code,
    description: line_item.description,
    quantity: line_item.quantity,
    unit: line_item.unit,
    status: bom?.status ?? "none",
    materials:
      bom && bom.materials.length > 0
        ? bom.materials.map((m) => ({
            material_name: m.material_name,
            quantity: String(m.quantity),
            unit: m.unit ?? "",
          }))
        : [{ ...emptyMaterial }],
    packaging:
      bom && bom.packaging.length > 0
        ? bom.packaging.map((p) => ({
            packaging_type: p.packaging_type,
            quantity: String(p.quantity),
          }))
        : [{ ...emptyPackaging }],
  }));
}

export default function BomForm({
  poId,
  data,
}: {
  poId: string;
  data: BomForPoView;
}) {
  const [lines, setLines] = useState<LineState[]>(() => initLines(data));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  function updateMaterial(
    lineIndex: number,
    matIndex: number,
    field: keyof MaterialDraft,
    value: string,
  ) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : {
              ...line,
              materials: line.materials.map((m, j) =>
                j === matIndex ? { ...m, [field]: value } : m,
              ),
            },
      ),
    );
  }

  function addMaterial(lineIndex: number) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : { ...line, materials: [...line.materials, { ...emptyMaterial }] },
      ),
    );
  }

  function removeMaterial(lineIndex: number, matIndex: number) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : { ...line, materials: line.materials.filter((_, j) => j !== matIndex) },
      ),
    );
  }

  function updatePackaging(
    lineIndex: number,
    pkgIndex: number,
    field: keyof PackagingDraft,
    value: string,
  ) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : {
              ...line,
              packaging: line.packaging.map((p, j) =>
                j === pkgIndex ? { ...p, [field]: value } : p,
              ),
            },
      ),
    );
  }

  function addPackaging(lineIndex: number) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : { ...line, packaging: [...line.packaging, { ...emptyPackaging }] },
      ),
    );
  }

  function removePackaging(lineIndex: number, pkgIndex: number) {
    setLines((prev) =>
      prev.map((line, i) =>
        i !== lineIndex
          ? line
          : { ...line, packaging: line.packaging.filter((_, j) => j !== pkgIndex) },
      ),
    );
  }

  function toPayload(): BomLinePayload[] {
    return lines.map((line) => ({
      po_line_item_id: line.lineItemId,
      materials: line.materials
        .filter((m) => m.material_name.trim() !== "")
        .map((m) => ({
          material_name: m.material_name.trim(),
          quantity: Number(m.quantity) || 0,
          unit: m.unit.trim() || null,
        })),
      packaging: line.packaging
        .filter((p) => p.packaging_type.trim() !== "")
        .map((p) => ({
          packaging_type: p.packaging_type.trim(),
          quantity: Number(p.quantity) || 0,
        })),
    }));
  }

  function handleSaveDraft() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveBomDraft(poId, toPayload());
      if (result.status !== "idle") {
        setMessage({
          type: result.status === "success" ? "success" : "error",
          text: result.message,
        });
      }
    });
  }

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await submitBom(poId, toPayload());
      if (result.status !== "idle") {
        setMessage({
          type: result.status === "success" ? "success" : "error",
          text: result.message,
        });
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">ข้อมูล PO</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <ReadField label="เลขที่ PO" value={data.po.po_number} />
          <ReadField label="วันที่ PO" value={data.po.po_date} />
          <ReadField label="วันกำหนดส่ง" value={data.po.due_date} />
          <ReadField label="วันหมดอายุ" value={data.po.expiry_date} />
        </div>
        {data.po.notes && (
          <div className="mt-3 text-sm">
            <span className="font-medium text-zinc-600">หมายเหตุ: </span>
            <span className="text-zinc-700">{data.po.notes}</span>
          </div>
        )}
      </section>

      {lines.map((line, lineIndex) => (
        <section
          key={line.lineItemId}
          className="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              รายการที่ {line.lineNo}
            </h2>
            <StatusBadge status={line.status} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <ReadField label="รหัสสินค้า" value={line.productCode} />
            <ReadField label="ชื่อสินค้า" value={line.description} />
            <ReadField label="จำนวน" value={String(line.quantity)} />
            <ReadField label="หน่วยนับ" value={line.unit} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600">
                รายการวัตถุดิบ
              </span>
              <button
                type="button"
                onClick={() => addMaterial(lineIndex)}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                + เพิ่มรายการ
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {line.materials.map((material, matIndex) => (
                <div key={matIndex} className="grid grid-cols-12 gap-2">
                  <input
                    placeholder="ชื่อวัตถุดิบ"
                    value={material.material_name}
                    onChange={(e) =>
                      updateMaterial(lineIndex, matIndex, "material_name", e.target.value)
                    }
                    className="col-span-6 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                  <input
                    placeholder="ปริมาณที่ใช้"
                    type="number"
                    value={material.quantity}
                    onChange={(e) =>
                      updateMaterial(lineIndex, matIndex, "quantity", e.target.value)
                    }
                    className="col-span-3 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                  <input
                    placeholder="หน่วย"
                    value={material.unit}
                    onChange={(e) =>
                      updateMaterial(lineIndex, matIndex, "unit", e.target.value)
                    }
                    className="col-span-2 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterial(lineIndex, matIndex)}
                    disabled={line.materials.length === 1}
                    className="col-span-1 text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600">Packaging</span>
              <button
                type="button"
                onClick={() => addPackaging(lineIndex)}
                className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                + เพิ่มรายการ
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {line.packaging.map((packaging, pkgIndex) => (
                <div key={pkgIndex} className="grid grid-cols-12 gap-2">
                  <input
                    placeholder="ประเภท"
                    value={packaging.packaging_type}
                    onChange={(e) =>
                      updatePackaging(lineIndex, pkgIndex, "packaging_type", e.target.value)
                    }
                    className="col-span-9 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                  <input
                    placeholder="จำนวน"
                    type="number"
                    value={packaging.quantity}
                    onChange={(e) =>
                      updatePackaging(lineIndex, pkgIndex, "quantity", e.target.value)
                    }
                    className="col-span-2 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removePackaging(lineIndex, pkgIndex)}
                    disabled={line.packaging.length === 1}
                    className="col-span-1 text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-300"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isPending}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          บันทึก Draft
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          ยืนยันส่งทั้งหมด
        </button>
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="block text-xs font-medium text-zinc-500">{label}</span>
      <span className="block text-sm text-zinc-800">{value ?? "-"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "submitted" | "none" }) {
  const label = status === "submitted" ? "ส่งแล้ว" : status === "draft" ? "Draft" : "ยังไม่กรอก";
  const className =
    status === "submitted"
      ? "bg-green-100 text-green-700"
      : status === "draft"
        ? "bg-amber-100 text-amber-700"
        : "bg-zinc-100 text-zinc-600";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
