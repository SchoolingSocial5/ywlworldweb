"use client";
import { useEffect, useState, useRef } from "react";
import { useSocialMediaStore, SocialMediaPlatform, SocialMediaActivity } from "@/store/useSocialMediaStore";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Toast from "@/components/admin/Toast";
import PlatformModal from "./components/PlatformModal";
import ActivityModal from "./components/ActivityModal";

export default function SocialMediaPage() {
  const { platforms, activities, loading, fetchData, createPlatform, updatePlatform, deletePlatform, createActivity, deleteActivity } = useSocialMediaStore();
  const [activeTab, setActiveTab] = useState<number | 'all'>('all');
  
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingPlatformId, setEditingPlatformId] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info"; visible: boolean }>({ message: "", type: "success", visible: false });

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlatformSubmit = async (id: number | null, formData: FormData) => {
    try {
      if (id) {
        await updatePlatform(id, formData);
        showToast("Channel updated successfully", "success");
      } else {
        await createPlatform(formData);
        showToast("Channel added successfully", "success");
      }
      setIsPlatformModalOpen(false);
      setEditingPlatformId(null);
    } catch (err: any) {
      showToast(err.message || "Failed to save channel", "error");
    }
  };

  const handleActivitySubmit = async (id: number | null, formData: FormData) => {
    try {
      await createActivity(formData);
      showToast("Activity logged successfully", "success");
      setIsActivityModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save activity", "error");
    }
  };

  const filteredActivities = activeTab === 'all' 
    ? activities 
    : activities.filter(a => a.platform_id === activeTab);

  return (
    <div className="p-[10px] md:p-8 pb-32 md:pb-32 w-full">
      <AdminPageHeader 
        title="Social Media Hub" 
        description="Monitor engagement, manage accounts, and track multi-channel growth."
        stats={{ label: "Active Platforms", value: platforms.length }}
      >
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setEditingPlatformId(null);
              setIsPlatformModalOpen(true);
            }}
            className="group relative bg-white text-black border border-gray-200 px-4 py-2 md:px-6 md:py-3 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer overflow-hidden"
          >
            <span className="relative z-10">Add Account</span>
            <div className="absolute inset-0 bg-gray-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
          <button 
            onClick={() => setIsActivityModalOpen(true)}
            className="bg-black text-white px-4 py-2 md:px-6 md:py-3 rounded-2xl text-sm font-bold shadow-xl shadow-black/10 hover:bg-gray-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            Update Stats
          </button>
        </div>
      </AdminPageHeader>

      {/* Horizontal Tabs */}
      <div className="mb-10 relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${activeTab === 'all' ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
          >
            All Channels
          </button>
          
          {platforms.map(platform => (
            <div key={platform.id} className="relative group flex-shrink-0">
              <button 
                onClick={() => setActiveTab(platform.id)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-3 pr-10 ${activeTab === platform.id ? 'bg-white text-black border-black shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
              >
                {platform.icon ? (
                  <img src={platform.icon} className="w-5 h-5 rounded-md object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center text-[10px]">
                    {platform.name.charAt(0)}
                  </div>
                )}
                {platform.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlatformId(platform.id);
                  setIsPlatformModalOpen(true);
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === platform.id ? 'text-black hover:bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                title="Edit Channel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
      </div>

      {/* Content Area */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-400">
            {activeTab === 'all' ? 'Consolidated Performance' : `${platforms.find(p => p.id === activeTab)?.name} Reports`}
          </h3>
          <div className="text-[10px] font-bold text-gray-400">
            TOTAL RECORDS: {filteredActivities.length}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-neutral-800/50 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  <th className="px-8 py-6">Reference / Image</th>
                  <th className="px-8 py-6">Engagement Report</th>
                  <th className="px-8 py-6">Activity Type</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                {filteredActivities.map(activity => (
                  <tr key={activity.id} className="group hover:bg-gray-50/30 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                          {activity.image_url ? (
                            <img src={activity.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-300">
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{activity.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {activity.platform?.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-gray-100">{activity.followers.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Followers</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-gray-100">{activity.likes_count.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Likes</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-gray-100">{activity.comments_count.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Comments</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        {activity.activity_type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => deleteActivity(activity.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredActivities.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No activities found</h4>
                        <p className="text-xs text-gray-400">Start by adding an account or logging your first performance update.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PlatformModal 
        isOpen={isPlatformModalOpen}
        onClose={() => setIsPlatformModalOpen(false)}
        platform={platforms.find(p => p.id === editingPlatformId) || null}
        onSubmit={handlePlatformSubmit}
      />

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        platforms={platforms}
        activity={null}
        onSubmit={handleActivitySubmit}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
