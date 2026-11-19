'use client';

import React, { useState } from 'react';
import {
  Camera,
  Plus,
  Heart,
  Star,
  Trash2,
  Calendar,
  Sparkles,
  Upload,
  Film,
} from 'lucide-react';
import { MemoryMilestone, ChildProfile } from '@/lib/types';
import { compressImageFile } from '@/lib/imageCompressor';

interface MemoryTimelineProps {
  profile: ChildProfile;
  memories: MemoryMilestone[];
  onAddMemory: (mem: Omit<MemoryMilestone, 'id'>) => void;
  onDeleteMemory: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  userRole: 'parent' | 'family';
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({
  profile,
  memories,
  onAddMemory,
  onDeleteMemory,
  onToggleFavorite,
  userRole,
}) => {
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [milestoneTag, setMilestoneTag] = useState<string>('Milestone Moment');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [caption, setCaption] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const birthDate = new Date(profile.dob);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
        const compressed = await compressImageFile(file, 1280, 0.85);
        setMediaUrl(compressed);
      } catch (err) {
        console.error('Failed to process memory media', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mediaUrl) return;

    const entryDate = new Date(date);
    const diffDays = Math.max(0, Math.floor((entryDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
    const ageDisplay = diffDays < 7 ? `Day ${diffDays + 1}` : diffDays < 30 ? `Week ${Math.floor(diffDays / 7) + 1}` : `Month ${Math.floor(diffDays / 30.4375) + 1}`;

    onAddMemory({
      childId: profile.id,
      title,
      milestoneTag,
      date,
      ageDisplay,
      caption,
      mediaUrl,
      mediaType,
      isFavorite: false,
    });

    setTitle('');
    setCaption('');
    setMediaUrl('');
    setShowAddModal(false);
  };

  const filteredMemories = memories
    .filter((m) => (!filterFavorites ? true : m.isFavorite))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
            Milestone Memory Book & Timeline
          </h3>
          <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
            Capture every gentle smile, milestone, and sweet memory chronologically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterFavorites
                ? 'bg-[#FDF6E2] text-[#6E4D05] border-[#F6E6B8] shadow-xs'
                : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-[#D4A02A] text-[#D4A02A]' : ''}`} />
            <span>Favorites</span>
          </button>

          {userRole === 'parent' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-[#FCDCCB] dark:border-[#3D2C28] space-y-8 my-4">
        {filteredMemories.map((mem) => (
          <div key={mem.id} className="relative group">
            
            {/* Timeline Dot Icon */}
            <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-8 h-8 rounded-full bg-[#E2765A] text-white flex items-center justify-center shadow-xs ring-4 ring-[#FAF8F5] dark:ring-[#141317]">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>

            {/* Memory Card */}
            <div className="rounded-2xl p-5 bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs max-w-2xl transition-all hover:shadow-sm">
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0E6] text-[#8A3510] border border-[#FCDCCB] dark:bg-[#2D2422] dark:text-[#F8BCA0] dark:border-[#543830]">
                    {mem.ageDisplay}
                  </span>
                  <span className="text-xs font-semibold text-[#75706B] dark:text-[#9E9892]">
                    {mem.date}
                  </span>
                  <span className="text-xs text-[#75706B] dark:text-[#9E9892] hidden sm:inline">
                    • {mem.milestoneTag}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleFavorite(mem.id)}
                    className="p-1.5 text-[#75706B] hover:text-[#D4A02A] transition-colors"
                    title="Mark Favorite"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        mem.isFavorite ? 'text-[#D4A02A] fill-[#D4A02A]' : ''
                      }`}
                    />
                  </button>

                  {userRole === 'parent' && (
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="p-1.5 text-[#75706B] hover:text-[#CB6145] dark:hover:text-[#F1997A] transition-colors"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Memory Media Frame */}
              <div className="rounded-xl overflow-hidden bg-[#FAF8F5] dark:bg-[#17161B] mb-3 max-h-96 flex items-center justify-center border border-[#EAE6DF] dark:border-[#2D2B33]">
                {mem.mediaType === 'video' ? (
                  <video
                    src={mem.mediaUrl}
                    controls
                    className="w-full max-h-96 object-cover rounded-xl"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mem.mediaUrl}
                    alt={mem.title}
                    className="w-full max-h-96 object-cover rounded-xl"
                  />
                )}
              </div>

              {/* Caption & Title */}
              <div>
                <h4 className="text-base font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  {mem.title}
                </h4>
                <p className="text-xs text-[#4D4845] dark:text-[#DDD8D0] mt-1 leading-relaxed">
                  {mem.caption}
                </p>
              </div>

            </div>

          </div>
        ))}
      </div>

      {/* --- ADD MEMORY MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg my-0 sm:my-8 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xl p-5 sm:p-6">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-3 sm:hidden" />
            <h3 className="text-base font-semibold text-[#201E1D] dark:text-[#FAF8F5] mb-1">
              Add Baby Memory & Milestone
            </h3>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892] mb-4">
              Add photos or video clips with notes to cherish forever.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Memory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First time rolling over! 🌸"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Milestone Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. First Smile, 1 Month"
                    value={milestoneTag}
                    onChange={(e) => setMilestoneTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Photo or Video</label>
                <label className="flex items-center justify-center gap-2 px-3 py-4 rounded-xl border border-dashed border-[#DDD8D0] dark:border-[#3D2C28] bg-[#FAF8F5] dark:bg-[#17161B] text-[#75706B] dark:text-[#9E9892] cursor-pointer hover:bg-[#F2ECE3]">
                  <Camera className="w-5 h-5 text-[#E2765A]" />
                  <span>{isUploading ? 'Compressing Media...' : mediaUrl ? 'Media Attached (Click to change)' : 'Select Photo / Video from Device'}</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[#4D4845] dark:text-[#DDD8D0] mb-1 font-semibold">Caption / Story</label>
                <textarea
                  rows={3}
                  placeholder="What was happening? How did she react? What made this day so special?"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#17161B] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-[#F2ECE3] dark:hover:bg-[#26242C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !mediaUrl}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold bg-[#E2765A] hover:bg-[#CB6145] text-white transition-colors disabled:opacity-50"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
