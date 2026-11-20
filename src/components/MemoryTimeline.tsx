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
  Share2,
  X,
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
  const [activeFilter, setActiveFilter] = useState<string>('all');
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
  const now = new Date();
  const diffDaysTotal = Math.max(0, Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));

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
    .filter((m) => {
      if (activeFilter === 'favorites') return m.isFavorite;
      if (activeFilter === 'physical') return m.milestoneTag.toLowerCase().includes('crawl') || m.milestoneTag.toLowerCase().includes('walk') || m.milestoneTag.toLowerCase().includes('physical');
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredMemory = memories.find((m) => m.isFavorite) || memories[0];

  return (
    <div className="flex flex-col w-full pb-8 space-y-6">
      {/* Header & Page Framing */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-on-primary-fixed font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-[15px]">favorite</span>
            Baby Keepsake &amp; Scrapbook
          </span>
          <span className="font-label-sm text-label-sm text-primary font-bold">
            {memories.length} Memories Saved
          </span>
        </div>
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight font-bold">
            Memory Scrapbook
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Precious Firsts &amp; Milestones for {profile.name} ({diffDaysTotal} days old)
          </p>
        </div>

        {/* Quick Action Hub */}
        {userRole === 'parent' && (
          <div className="pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-full flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(68,99,75,0.22)] text-on-primary font-label-lg text-label-lg font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Add Memory or Milestone</span>
            </button>
          </div>
        )}
      </section>

      {/* Timeline Filter Pills (Scrollable Bar) */}
      <section className="overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`h-9 px-4 rounded-full font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 font-semibold ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>All Memories</span>
            <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 text-[10px] flex items-center justify-center font-bold">
              {memories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`h-9 px-3.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 font-semibold ${
              activeFilter === 'favorites'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">star</span>
            <span>Favorites ({memories.filter((m) => m.isFavorite).length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('physical')}
            className={`h-9 px-3.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 font-semibold ${
              activeFilter === 'physical'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">directions_run</span>
            <span>Physical Firsts</span>
          </button>
        </div>
      </section>

      {/* Hero Highlight Memory Card (Polaroid & Bento Inspiration) */}
      {featuredMemory && (
        <section>
          <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-[0_6px_24px_rgba(45,49,46,0.06)] border border-outline-variant/30 flex flex-col gap-3">
            {/* Card Badge Header */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                Featured Memory
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">event</span>
                {featuredMemory.ageDisplay} • {featuredMemory.date}
              </span>
            </div>

            {/* Memory Title */}
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-snug">
                {featuredMemory.title}
              </h2>
            </div>

            {/* Polaroid-Style Frame */}
            <div className="bg-surface-container-lowest p-2 pb-4 rounded-2xl shadow-[0_4px_16px_rgba(45,49,46,0.08)] flex flex-col items-center border border-outline-variant/20">
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container">
                {featuredMemory.mediaType === 'video' ? (
                  <video src={featuredMemory.mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredMemory.mediaUrl}
                    alt={featuredMemory.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="w-full pt-3 px-2 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                <span className="tracking-wide text-primary font-semibold">
                  {featuredMemory.milestoneTag}
                </span>
                <span>{featuredMemory.date}</span>
              </div>
            </div>

            {/* Narrative Text */}
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {featuredMemory.caption}
            </p>

            {/* Interactivity & Reactions */}
            <div className="pt-2 flex items-center justify-between border-t border-surface-container">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-7 w-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-sm text-label-sm font-bold shadow-xs">
                    M
                  </div>
                  <div className="inline-block h-7 w-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-label-sm font-bold shadow-xs">
                    D
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  Hearted by Family
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleFavorite(featuredMemory.id)}
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-tertiary hover:bg-surface-container-high transition-colors"
                  type="button"
                  title="Toggle Favorite"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: featuredMemory.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Timeline Stream */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
            <span className="font-headline-md text-headline-md text-on-surface font-bold">Timeline Feed</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-semibold">
            {filteredMemories.length} Entries
          </span>
        </div>

        <div className="space-y-4">
          {filteredMemories.map((mem) => (
            <article
              key={mem.id}
              className="bg-surface-container-lowest rounded-3xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center font-bold text-xs">
                    🌟
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">
                      {mem.milestoneTag}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                      • {mem.ageDisplay}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  {mem.date}
                </span>
              </div>

              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {mem.title}
              </h3>

              {/* Photo Frame */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-surface-container">
                {mem.mediaType === 'video' ? (
                  <video src={mem.mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mem.mediaUrl} alt={mem.title} className="w-full h-full object-cover" />
                )}
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {mem.caption}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-surface-container">
                <button
                  onClick={() => onToggleFavorite(mem.id)}
                  className={`inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold ${
                    mem.isFavorite ? 'text-tertiary' : 'text-outline hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: mem.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                  <span>{mem.isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>

                {userRole === 'parent' && (
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/30 transition-colors"
                    type="button"
                    title="Delete Memory"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">photo_camera</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Capture Milestone Memory
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. First Time Crawling, First Spoonful..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Category Tag</label>
                  <select
                    value={milestoneTag}
                    onChange={(e) => setMilestoneTag(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30"
                  >
                    <option value="Milestone Moment">Milestone Moment</option>
                    <option value="Physical First">Physical First</option>
                    <option value="Nutrition First">Nutrition First</option>
                    <option value="First Word / Sound">First Word / Sound</option>
                    <option value="Trips & Celebrations">Trips &amp; Celebrations</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-outline block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Photo / Video Upload</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container"
                  required
                />
                {isUploading && <p className="text-xs text-primary mt-1">Compressing image...</p>}
                {mediaUrl && (
                  <div className="mt-2 w-full h-28 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline block mb-1">Memory Story &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Tell the story of this sweet moment..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm border border-outline-variant/30 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-12 rounded-full bg-surface-container text-on-surface font-label-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!mediaUrl || isUploading}
                  className="flex-1 h-12 rounded-full bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container disabled:opacity-50"
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
