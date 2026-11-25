"use client";
import { useState, useEffect, useRef } from "react";
import { useSettingStore, Setting } from "@/store/useSettingStore";
import { useSettings } from "@/context/SettingsContext";
import { getImageUrl } from "@/utils/image";
import Toast from "@/components/admin/Toast";

interface Props {
  initialData: Partial<Setting>;
}

export default function BrandAssetsForm({ initialData }: Props) {
  const { updateSettings } = useSettingStore();
  const { refreshSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Setting>>(initialData);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [removedFields, setRemovedFields] = useState<{ [key: string]: boolean }>({});
  const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const lightInputRef = useRef<HTMLInputElement>(null);
  const darkInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(initialData);
    setImgErrors({});
    setRemovedFields({});
  }, [initialData]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleFileChange = (field: string, file: File) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
    setRemovedFields((prev) => ({ ...prev, [field]: false }));
    setImgErrors((prev) => ({ ...prev, [field]: false }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (field: string) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setRemovedFields((prev) => ({ ...prev, [field]: true }));
    setFormData((prev) => ({ ...prev, [field]: "" }));

    if (field === "logo" && lightInputRef.current) lightInputRef.current.value = "";
    if (field === "dark_logo" && darkInputRef.current) darkInputRef.current.value = "";
    if (field === "favicon" && faviconInputRef.current) faviconInputRef.current.value = "";
  };

  const hasChanges = Object.keys(files).length > 0 || Object.values(removedFields).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);

    const data = new FormData();

    // Append newly selected files
    for (const key of Object.keys(files)) {
      if (files[key]) {
        data.append(key, files[key]);
      }
    }

    // Append explicitly removed fields
    for (const key of Object.keys(removedFields)) {
      if (removedFields[key] && !files[key]) {
        data.append(key, "");
      }
    }

    try {
      const result = await updateSettings(data);
      await refreshSettings();

      setFormData(result);
      setFiles({});
      setPreviews({});
      setRemovedFields({});
      setImgErrors({});

      if (lightInputRef.current) lightInputRef.current.value = "";
      if (darkInputRef.current) darkInputRef.current.value = "";
      if (faviconInputRef.current) faviconInputRef.current.value = "";

      showToast("Brand assets saved successfully!", "success");
    } catch (err: any) {
      console.error("Error saving brand assets:", err);
      showToast(err?.message || "Failed to save brand assets. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2";

  const renderAssetSlot = (
    label: string,
    field: "logo" | "dark_logo" | "favicon",
    inputRef: React.RefObject<HTMLInputElement | null>,
    isFavicon = false
  ) => {
    const previewSrc = previews[field];
    const remoteSrc = !removedFields[field] && formData[field] ? getImageUrl(formData[field]) : null;
    const hasImage = Boolean(previewSrc || (remoteSrc && !imgErrors[field]));
    const currentSrc = previewSrc || remoteSrc;

    return (
      <div className="flex flex-col">
        <label className={labelClass}>{label}</label>
        <div className="relative group rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-700 hover:border-black dark:hover:border-white transition-colors w-full h-32 bg-gray-50 dark:bg-neutral-800 flex items-center justify-center p-3 overflow-hidden">
          {hasImage && currentSrc ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={currentSrc}
                alt={label}
                className={`max-w-full max-h-full object-contain ${field === "dark_logo" ? "p-1 bg-neutral-900 rounded-md" : ""}`}
                onError={() => {
                  setImgErrors((prev) => ({ ...prev, [field]: true }));
                }}
              />
            </div>
          ) : (
            <div className="text-center pointer-events-none">
              <svg className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500">
                {imgErrors[field] ? "Failed to load - Click to replace" : "Upload " + label}
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={isFavicon ? "image/*,.ico" : "image/*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChange(field, file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            title={`Change ${label}`}
          />
        </div>

        {hasImage && (
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
              {files[field] ? files[field].name : "Saved"}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(field)}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer uppercase tracking-wider"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 py-6 md:py-8 shadow-sm space-y-6 px-0 md:px-0 transition-colors">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-neutral-800 pb-4 px-[10px] md:px-8">
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 dark:text-gray-100">Brand Assets</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Upload logos and favicon for light and dark modes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-[10px] md:px-8">
          {renderAssetSlot("Light Logo", "logo", lightInputRef)}
          {renderAssetSlot("Dark Logo", "dark_logo", darkInputRef)}
          {renderAssetSlot("Favicon", "favicon", faviconInputRef, true)}
        </div>

        <div className="pt-4 px-[10px] md:px-8 border-t border-gray-50 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="w-full md:w-auto text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl hover:opacity-85 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Brand"}
          </button>
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Unsaved changes
            </span>
          )}
        </div>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}
