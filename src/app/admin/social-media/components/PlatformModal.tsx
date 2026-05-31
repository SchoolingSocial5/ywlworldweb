import { useState, useRef, useEffect } from "react";
import { SocialMediaPlatform } from "@/store/useSocialMediaStore";

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: SocialMediaPlatform | null;
  onSubmit: (id: number | null, formData: FormData) => Promise<void>;
}

export default function PlatformModal({ isOpen, onClose, platform, onSubmit }: PlatformModalProps) {
  const [platformForm, setPlatformForm] = useState({ 
    name: "", url: "", handle: "", icon: null as File | null, existingIconUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (platform) {
        setPlatformForm({
          name: platform.name,
          url: platform.url || "",
          handle: platform.handle || "",
          icon: null,
          existingIconUrl: platform.icon || ""
        });
      } else {
        setPlatformForm({ name: "", url: "", handle: "", icon: null, existingIconUrl: "" });
      }
    }
  }, [isOpen, platform]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', platformForm.name);
    if (platformForm.url) formData.append('url', platformForm.url);
    if (platformForm.handle) formData.append('handle', platformForm.handle);
    if (platformForm.icon) formData.append('icon', platformForm.icon);

    try {
      await onSubmit(platform ? platform.id : null, formData);
      onClose();
    } catch (err: any) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-gray-50 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
          <div>
            <h3 className="text-2xl font-black tracking-tight">{platform ? 'Edit Channel' : 'Add Channel'}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{platform ? 'Update your social media profile' : 'Connect a new social media profile'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Brand Name</label>
              <input required type="text" value={platformForm.name} onChange={e => setPlatformForm({...platformForm, name: e.target.value})} placeholder="Instagram, Twitter, etc." className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Account URL</label>
              <input type="url" value={platformForm.url} onChange={e => setPlatformForm({...platformForm, url: e.target.value})} placeholder="https://..." className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Channel Icon</label>
              <div 
                onClick={() => iconInputRef.current?.click()}
                className="w-full h-14 bg-white border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group overflow-hidden"
              >
                  {platformForm.icon ? (
                    <span className="text-xs font-bold text-black">{platformForm.icon.name}</span>
                  ) : platformForm.existingIconUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={platformForm.existingIconUrl} className="w-8 h-8 rounded-md object-cover" alt="" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black">Change Icon</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 group-hover:text-black"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-black">Upload Icon</span>
                    </div>
                  )}
                  <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={e => setPlatformForm({...platformForm, icon: e.target.files?.[0] || null})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-12">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 border border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all">Discard</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-8 py-5 bg-black text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : "Save Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
