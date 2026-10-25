import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

export default function SizeGuideModal() {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useShop();
  const [unit, setUnit] = useState("cm");

  if (!isSizeGuideOpen) return null;

  const measurements = unit === "cm" ? [
    { size: "XS", chest: "92 - 96", waist: "76 - 80", shoulder: "44", sleeve: "63", length: "74" },
    { size: "S", chest: "96 - 100", waist: "80 - 84", shoulder: "45.5", sleeve: "64", length: "75" },
    { size: "M", chest: "100 - 104", waist: "84 - 88", shoulder: "47", sleeve: "65", length: "76" },
    { size: "L", chest: "104 - 108", waist: "88 - 92", shoulder: "48.5", sleeve: "66", length: "77" },
    { size: "XL", chest: "108 - 114", waist: "92 - 98", shoulder: "50", sleeve: "67", length: "78" },
    { size: "XXL", chest: "114 - 120", waist: "98 - 104", shoulder: "52", sleeve: "68", length: "79" },
  ] : [
    { size: "XS", chest: "36.2 - 37.8", waist: "29.9 - 31.5", shoulder: "17.3", sleeve: "24.8", length: "29.1" },
    { size: "S", chest: "37.8 - 39.4", waist: "31.5 - 33.1", shoulder: "17.9", sleeve: "25.2", length: "29.5" },
    { size: "M", chest: "39.4 - 40.9", waist: "33.1 - 34.6", shoulder: "18.5", sleeve: "25.6", length: "29.9" },
    { size: "L", chest: "40.9 - 42.5", waist: "34.6 - 36.2", shoulder: "19.1", sleeve: "26.0", length: "30.3" },
    { size: "XL", chest: "42.5 - 44.9", waist: "36.2 - 38.6", shoulder: "19.7", sleeve: "26.4", length: "30.7" },
    { size: "XXL", chest: "44.9 - 47.2", waist: "38.6 - 40.9", shoulder: "20.5", sleeve: "26.8", length: "31.1" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface max-w-2xl w-full border border-surface-variant p-6 md:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => setIsSizeGuideOpen(false)}
          className="absolute top-4 right-4 text-primary hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-secondary">
            Architectural Fit Guide
          </span>
        </div>

        <h2 className="font-serif text-2xl md:text-3xl font-medium text-primary mb-2">
          Precision Sizing Matrix
        </h2>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          CloudCloset garments are tailored with deliberate ease and structured drape. If you prefer a closer, traditional silhouette, consider sizing down.
        </p>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">All Measurements</span>
          <div className="flex items-center border border-surface-variant bg-surface-container-low p-0.5">
            <button
              onClick={() => setUnit("cm")}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                unit === "cm" ? "bg-primary text-white" : "text-primary hover:text-secondary"
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              onClick={() => setUnit("in")}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                unit === "in" ? "bg-primary text-white" : "text-primary hover:text-secondary"
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-surface-variant">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-surface-container-high text-primary uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5">Size</th>
                <th className="p-2.5">Chest</th>
                <th className="p-2.5">Waist</th>
                <th className="p-2.5">Shoulder</th>
                <th className="p-2.5">Sleeve</th>
                <th className="p-2.5">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
              {measurements.map((row, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-2.5 font-bold text-primary">{row.size}</td>
                  <td className="p-2.5 text-on-surface-variant">{row.chest}</td>
                  <td className="p-2.5 text-on-surface-variant">{row.waist}</td>
                  <td className="p-2.5 text-on-surface-variant">{row.shoulder}</td>
                  <td className="p-2.5 text-on-surface-variant">{row.sleeve}</td>
                  <td className="p-2.5 text-on-surface-variant">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fit Guarantee Note */}
        <div className="mt-6 p-3 bg-surface-container-low border-l-2 border-secondary flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
            verified
          </span>
          <p className="text-[11px] text-on-surface leading-relaxed">
            <strong>Complimentary Alterations & Size Exchanges:</strong> If your selected garment does not drape to your exact satisfaction, CloudCloset provides 15-day complimentary reverse pickup and replacement across India.
          </p>
        </div>
      </div>
    </div>
  );
}
