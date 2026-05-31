import { useState, useRef, useEffect } from "react";
import { SocialMediaPlatform, SocialMediaActivity } from "@/store/useSocialMediaStore";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: SocialMediaPlatform[];
  activity: SocialMediaActivity | null;
  onSubmit: (id: number | null, formData: FormData) => Promise<void>;
}

export default function ActivityModal({ isOpen, onClose, platforms, activity, onSubmit }: ActivityModalProps) {
  const [activityForm, setActivityForm] = useState({ 
    platform_id: "", name: "", activity_type: "Post", description: "", 
    followers: 0, posts_count: 0, likes_count: 0, comments_count: 0, 
    date: new Date().toISOString().split('T')[0], image: null as File | null 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setActivityForm({
          platform_id: activity.platform_id.toString(),
          name: activity.name,
          activity_type: activity.activity_type,
          description: activity.description || "",
          followers: activity.followers || 0,
          posts_count: activity.posts_count || 0,
          likes_count: activity.likes_count || 0,
          comments_count: activity.comments_count || 0,
          date: activity.date ? activity.date.split('T')[0] : new Date().toISOString().split('T')[0],
          image: null
        });
      } else {
        setActivityForm({ 
          platform_id: "", name: "", activity_type: "Post", description: "", 
          followers: 0, posts_count: 0, likes_count: 0, comments_count: 0, 
          date: new Date().toISOString().split('T')[0], image: null
        });
      }
    }
  }, [isOpen, activity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('platform_id', activityForm.platform_id);
    formData.append('name', activityForm.name);
    formData.append('activity_type', activityForm.activity_type);
    if (activityForm.description) formData.append('description', activityForm.description);
    formData.append('followers', activityForm.followers.toString());
    formData.append('posts_count', activityForm.posts_count.toString());
    formData.append('likes_count', activityForm.likes_count.toString());
    formData.append('comments_count', activityForm.comments_count.toString());
    formData.append('date', activityForm.date);
    if (activityForm.image) formData.append('image', activityForm.image);

    try {
      await onSubmit(activity ? activity.id : null, formData);
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
            <h3 className="text-2xl font-black tracking-tight">{activity ? 'Edit Activity' : 'Post Analysis'}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{activity ? 'Update existing activity log' : 'Log a new social media activity'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-10 custom-scrollbar">
          <form onSubmit={handleSubmit}>
            <div className="space-y-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Channel</label>
                  <select required value={activityForm.platform_id} onChange={e => setActivityForm({...activityForm, platform_id: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all appearance-none cursor-pointer dark:text-gray-100">
                    <option value="">Select Platform</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Activity Name / Subject</label>
                  <input required type="text" value={activityForm.name} onChange={e => setActivityForm({...activityForm, name: e.target.value})} placeholder="e.g. Summer Campaign Week 1" className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Type</label>
                    <select value={activityForm.activity_type} onChange={e => setActivityForm({...activityForm, activity_type: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all cursor-pointer">
                      <option>Post</option>
                      <option>Story</option>
                      <option>Reel</option>
                      <option>Live</option>
                      <option>Ad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Date</label>
                    <input required type="date" value={activityForm.date} onChange={e => setActivityForm({...activityForm, date: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Post / Preview Image</label>
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-24 bg-white border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group overflow-hidden"
                  >
                    {activityForm.image ? (
                       <div className="relative w-full h-full">
                          <img src={URL.createObjectURL(activityForm.image)} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</span>
                          </div>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-200 group-hover:text-black"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-black">Upload Visual</span>
                      </div>
                    )}
                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={e => setActivityForm({...activityForm, image: e.target.files?.[0] || null})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Followers</label>
                    <input type="number" value={activityForm.followers} onChange={e => setActivityForm({...activityForm, followers: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Posts</label>
                    <input type="number" value={activityForm.posts_count} onChange={e => setActivityForm({...activityForm, posts_count: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Likes</label>
                    <input type="number" value={activityForm.likes_count} onChange={e => setActivityForm({...activityForm, likes_count: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Comments</label>
                    <input type="number" value={activityForm.comments_count} onChange={e => setActivityForm({...activityForm, comments_count: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Notes / Description</label>
                  <textarea rows={4} value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})} placeholder="Key takeaways from this period..." className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 focus:ring-0 focus:border-black outline-none font-bold text-sm transition-all resize-none dark:text-gray-100" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button type="button" onClick={onClose} className="flex-1 px-8 py-5 border border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 px-8 py-5 bg-black text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Update Analytics"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
