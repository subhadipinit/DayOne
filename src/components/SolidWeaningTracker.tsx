'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Sparkles,
  Heart,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  X,
  Award,
  Info,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  Flame,
  ShieldAlert,
  ChefHat,
  Leaf,
  Check,
  Milk,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { SolidFoodItem, ChildProfile, WeaningRecipe } from '@/lib/types';
import { syncSingleRecord } from '@/lib/syncService';
import { generateUniqueId } from '@/lib/store';
import {
  AGE_WISE_WEANING_STAGES,
  COMPREHENSIVE_WEANING_RECIPES,
  EXPANDED_INITIAL_FOODS,
  GAGGING_VS_CHOKING_GUIDE,
} from '@/lib/weaningData';
import confetti from 'canvas-confetti';

interface SolidWeaningTrackerProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

type WeaningTab = 'diary' | 'chart' | 'recipes' | 'safety';

export const SolidWeaningTracker: React.FC<SolidWeaningTrackerProps> = ({
  profile,
  userRole = 'parent',
}) => {
  const [activeTab, setActiveTab] = useState<WeaningTab>('diary');

  // Stage selector for Age-Wise Chart
  const [selectedStageId, setSelectedStageId] = useState<string>('6-7m');
  const activeStage = AGE_WISE_WEANING_STAGES.find((s) => s.stageId === selectedStageId) || AGE_WISE_WEANING_STAGES[0];

  // Recipe Book State
  const [recipeStageFilter, setRecipeStageFilter] = useState<string>('all');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>('all');
  const [onlyIronRichRecipes, setOnlyIronRichRecipes] = useState<boolean>(false);
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [activeRecipeModal, setActiveRecipeModal] = useState<WeaningRecipe | null>(null);

  // Foods Diary State
  const [foods, setFoods] = useState<SolidFoodItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_foods_${profile.id}`);
      if (saved) {
        try {
          const parsed: SolidFoodItem[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p) => p.id));
            const existingNames = new Set(parsed.map((p) => p.name.toLowerCase()));
            const newFoods = EXPANDED_INITIAL_FOODS.filter(
              (f) => !existingIds.has(f.id) && !existingNames.has(f.name.toLowerCase())
            ).map((f) => ({ ...f, childId: profile.id }));
            return [...parsed, ...newFoods];
          }
        } catch (e) {
          // fallback
        }
      }
    }
    return EXPANDED_INITIAL_FOODS.map((f) => ({
      ...f,
      childId: profile.id,
      timesOffered: 0,
      reaction: 'neutral',
      firstOfferedDate: '',
    }));
  });

  const [diaryCategory, setDiaryCategory] = useState<string>('all');
  const [diarySearch, setDiarySearch] = useState<string>('');
  const [onlyIronFoods, setOnlyIronFoods] = useState<boolean>(false);
  const [selectedFoodForReaction, setSelectedFoodForReaction] = useState<SolidFoodItem | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);

  useEffect(() => {
    const loadSaved = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dayone_foods_${profile.id}`);
        if (saved) {
          try {
            const parsed: SolidFoodItem[] = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFoods(parsed);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    };
    loadSaved();
    window.addEventListener('dayone:data-hydrated', loadSaved);
    return () => window.removeEventListener('dayone:data-hydrated', loadSaved);
  }, [profile.id]);

  // Custom Food Form
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<SolidFoodItem['category']>('grain');

  // Stats for 100 Foods Challenge
  const introducedFoods = foods.filter((f) => (f.timesOffered || 0) > 0 || !!f.isIntroduced);
  const lovedCount = foods.filter((f) => f.reaction === 'loved' && ((f.timesOffered || 0) > 0 || f.isIntroduced)).length;
  const toleratedCount = foods.filter((f) => f.reaction === 'neutral' && ((f.timesOffered || 0) > 0 || f.isIntroduced)).length;
  const dislikedCount = foods.filter((f) => f.reaction === 'disliked').length;
  const allergicCount = foods.filter((f) => f.reaction === 'allergic').length;
  const progressPercent = Math.min(100, Math.round((introducedFoods.length / 100) * 100));

  // Determine badge level
  const getBadgeLevel = (count: number) => {
    if (count >= 100) return { label: '👑 Master Weaner (100 Foods Champion)', color: 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' };
    if (count >= 75) return { label: '🥇 Gold Taster (75+ Foods)', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300' };
    if (count >= 50) return { label: '🥈 Silver Foodie (50+ Foods)', color: 'text-slate-700 bg-slate-100 dark:bg-slate-900/60 dark:text-slate-300 border-slate-300' };
    if (count >= 25) return { label: '🥉 Bronze Explorer (25+ Foods)', color: 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-400' };
    return { label: '🌱 New Food Explorer', color: 'text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300' };
  };

  // 1-Tap State Cycling: Untried -> Tried -> Liked -> Disliked -> Allergy -> Untried
  const handleCycleFoodState = (foodId: string) => {
    const today = new Date().toISOString().split('T')[0];
    let nextReaction: SolidFoodItem['reaction'] = 'neutral';
    let nextTimesOffered = 1;
    let nextIsIntroduced = true;
    let shouldFireConfetti = false;

    const updated = foods.map((f) => {
      if (f.id === foodId) {
        const isCurrentlyIntroduced = (f.timesOffered || 0) > 0 || !!f.isIntroduced;

        if (!isCurrentlyIntroduced) {
          // Untried -> Tried (Tolerated)
          nextReaction = 'neutral';
          nextTimesOffered = 1;
          nextIsIntroduced = true;
        } else if (f.reaction === 'neutral') {
          // Tried -> Liked (Loved)
          nextReaction = 'loved';
          nextTimesOffered = Math.max(1, f.timesOffered || 1);
          nextIsIntroduced = true;
          shouldFireConfetti = true;
        } else if (f.reaction === 'loved') {
          // Liked -> Disliked
          nextReaction = 'disliked';
          nextTimesOffered = Math.max(1, f.timesOffered || 1);
          nextIsIntroduced = true;
        } else if (f.reaction === 'disliked') {
          // Disliked -> Allergy
          nextReaction = 'allergic';
          nextTimesOffered = Math.max(1, f.timesOffered || 1);
          nextIsIntroduced = true;
        } else {
          // Allergy -> Untried (reset)
          nextReaction = 'neutral';
          nextTimesOffered = 0;
          nextIsIntroduced = false;
        }

        return {
          ...f,
          reaction: nextReaction,
          isIntroduced: nextIsIntroduced,
          timesOffered: nextTimesOffered,
          firstOfferedDate: nextIsIntroduced ? (f.firstOfferedDate || today) : '',
        };
      }
      return f;
    });

    setFoods(updated);
    localStorage.setItem(`dayone_foods_${profile.id}`, JSON.stringify(updated));

    const changed = updated.find((f) => f.id === foodId);
    if (changed) {
      syncSingleRecord('weaning_foods', {
        id: changed.id,
        child_id: profile.id,
        name: changed.name,
        category: changed.category,
        is_introduced: changed.isIntroduced ?? false,
        first_offered_date: changed.firstOfferedDate || null,
        reaction: changed.reaction || null,
        allergies_observed: changed.allergiesObserved || [],
        times_offered: changed.timesOffered || 0,
        notes: changed.notes || null,
        age_stage_months: changed.ageStageMonths || null,
        is_iron_rich: changed.isIronRich ?? false,
        is_allergen: changed.isAllergen ?? false,
      });
    }

    if (shouldFireConfetti) {
      try {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#44634B', '#C8EBCC', '#D97757'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleUpdateFoodReaction = (
    foodId: string,
    reaction: SolidFoodItem['reaction'],
    allergies?: string[]
  ) => {
    const updated = foods.map((f) => {
      if (f.id === foodId) {
        const currentTimes = f.timesOffered || 0;
        const nextTimes = currentTimes === 0 ? 1 : currentTimes + 1;
        return {
          ...f,
          reaction,
          isIntroduced: true,
          timesOffered: nextTimes,
          firstOfferedDate: f.firstOfferedDate || new Date().toISOString().split('T')[0],
          allergiesObserved: allergies,
        };
      }
      return f;
    });

    setFoods(updated);
    localStorage.setItem(`dayone_foods_${profile.id}`, JSON.stringify(updated));
    setSelectedFoodForReaction(null);

    const changed = updated.find((f) => f.id === foodId);
    if (changed) {
      syncSingleRecord('weaning_foods', {
        id: changed.id,
        child_id: profile.id,
        name: changed.name,
        category: changed.category,
        is_introduced: changed.isIntroduced ?? false,
        first_offered_date: changed.firstOfferedDate || null,
        reaction: changed.reaction || null,
        allergies_observed: changed.allergiesObserved || [],
        times_offered: changed.timesOffered || 0,
        notes: changed.notes || null,
        age_stage_months: changed.ageStageMonths || null,
        is_iron_rich: changed.isIronRich ?? false,
        is_allergen: changed.isAllergen ?? false,
      });
    }

    if (reaction === 'loved') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newFood: SolidFoodItem = {
      id: generateUniqueId('custom'),
      childId: profile.id,
      name: customName.trim(),
      category: customCategory,
      firstOfferedDate: '',
      reaction: 'neutral',
      timesOffered: 0,
      isIntroduced: false,
    };

    const updated = [newFood, ...foods];
    setFoods(updated);
    localStorage.setItem(`dayone_foods_${profile.id}`, JSON.stringify(updated));
    setCustomName('');
    setShowAddCustomModal(false);

    syncSingleRecord('weaning_foods', {
      id: newFood.id,
      child_id: profile.id,
      name: newFood.name,
      category: newFood.category,
      is_introduced: false,
      first_offered_date: null,
      reaction: 'neutral',
      allergies_observed: [],
      times_offered: 0,
      notes: null,
      age_stage_months: null,
      is_iron_rich: false,
      is_allergen: false,
    });
  };

  // 1-Click Link Recipe to Food Diary
  const handleMarkRecipeCooked = (recipe: WeaningRecipe) => {
    const today = new Date().toISOString().split('T')[0];
    let matched = false;
    let syncedFoodItem: SolidFoodItem | null = null;

    const updated = foods.map((f) => {
      if (f.id === recipe.linkedFoodId || f.name.toLowerCase().includes(recipe.title.toLowerCase().slice(0, 10))) {
        matched = true;
        const currentTimes = f.timesOffered || 0;
        const item: SolidFoodItem = {
          ...f,
          isIntroduced: true,
          timesOffered: currentTimes + 1,
          firstOfferedDate: f.firstOfferedDate || today,
          reaction: f.reaction || 'loved',
        };
        syncedFoodItem = item;
        return item;
      }
      return f;
    });

    if (!matched) {
      const newFood: SolidFoodItem = {
        id: generateUniqueId('rec_food'),
        childId: profile.id,
        name: recipe.title,
        category: recipe.category === 'porridge' || recipe.category === 'khichdi' ? 'grain' : 'vegetable',
        isIntroduced: true,
        timesOffered: 1,
        firstOfferedDate: today,
        reaction: 'loved',
        isIronRich: recipe.isIronRich,
      };
      syncedFoodItem = newFood;
      updated.unshift(newFood);
    }

    setFoods(updated);
    localStorage.setItem(`dayone_foods_${profile.id}`, JSON.stringify(updated));
    setActiveRecipeModal(null);

    if (syncedFoodItem) {
      const s = syncedFoodItem as SolidFoodItem;
      syncSingleRecord('weaning_foods', {
        id: s.id,
        child_id: profile.id,
        name: s.name,
        category: s.category,
        is_introduced: true,
        first_offered_date: s.firstOfferedDate || today,
        reaction: s.reaction || 'loved',
        allergies_observed: s.allergiesObserved || [],
        times_offered: s.timesOffered || 1,
        notes: s.notes || null,
        age_stage_months: s.ageStageMonths || null,
        is_iron_rich: s.isIronRich ?? false,
        is_allergen: s.isAllergen ?? false,
      });
    }

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Filter Recipes
  const filteredRecipes = COMPREHENSIVE_WEANING_RECIPES.filter((r) => {
    const matchesStage = recipeStageFilter === 'all' || r.stageKey === recipeStageFilter;
    const matchesCategory = recipeCategoryFilter === 'all' || r.category === recipeCategoryFilter;
    const matchesIron = !onlyIronRichRecipes || r.isIronRich;
    const matchesSearch =
      r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (r.bengaliName && r.bengaliName.toLowerCase().includes(recipeSearch.toLowerCase())) ||
      (r.hindiName && r.hindiName.toLowerCase().includes(recipeSearch.toLowerCase())) ||
      r.keyNutrients.some((k) => k.toLowerCase().includes(recipeSearch.toLowerCase()));
    return matchesStage && matchesCategory && matchesIron && matchesSearch;
  });

  // Filter Diary Foods
  const filteredFoods = foods.filter((f) => {
    const matchesCat = diaryCategory === 'all' || f.category === diaryCategory;
    const matchesSearch = f.name.toLowerCase().includes(diarySearch.toLowerCase());
    const matchesIron = !onlyIronFoods || f.isIronRich;
    return matchesCat && matchesSearch && matchesIron;
  });

  const badge = getBadgeLevel(introducedFoods.length);

  return (
    <div className="space-y-6 animate-reveal">
      
      {/* Screen Title & Action Bar */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            100 Foods Challenge
          </h1>
          <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
            Baby Led Weaning • {profile.name} ({profile.dob ? `${Math.floor((Date.now() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.4375))}m` : '6m+'})
          </p>
        </div>
        {userRole === 'parent' && (
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="tap-feedback shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-[#44634B] hover:bg-[#344738] text-white shadow-xs font-semibold text-xs"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food</span>
          </button>
        )}
      </div>

      {/* Challenge Progress Hero Card */}
      <div className="relative w-full rounded-3xl bg-white dark:bg-[#1E2520] p-5 shadow-xs border border-[#E8E4DC] dark:border-[#2D382F] overflow-hidden">
        {/* Ambient organic blush pattern */}
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#44634B]/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-[#D97757]/10 blur-2xl pointer-events-none"></div>

        <div className="relative flex items-center justify-between gap-4">
          {/* Radial Gauge with Badge inside */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg aria-hidden="true" className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f4f0" strokeWidth="8" className="dark:stroke-[#263129]"></circle>
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#44634b"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                strokeWidth="8"
                className="transition-all duration-700 ease-out"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-[#191C1A] dark:text-[#FAF8F5] leading-none tabular-nums">
                {introducedFoods.length}
              </span>
              <span className="text-[10px] text-[#424842] dark:text-[#9E9892] font-semibold">/ 100</span>
            </div>
          </div>

          {/* Text details & milestone */}
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-1.5 border ${badge.color}`}>
              <Leaf className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </div>
            <p className="text-base sm:text-lg text-[#191C1A] dark:text-[#FAF8F5] font-bold leading-tight">
              {introducedFoods.length} Foods Explored
            </p>
            <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-0.5">
              {Math.max(0, 100 - introducedFoods.length)} fresh bites left to reach baby&apos;s 1st birthday milestone!
            </p>
          </div>
        </div>

        {/* Stat Pills Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E8E4DC] dark:border-[#2D382F]">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] text-center border border-[#E0E3DF] dark:border-[#2D382F]">
            <div className="flex items-center gap-1 text-[#44634B] dark:text-[#ADCFB1]">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold text-sm tabular-nums">{lovedCount}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#424842] dark:text-[#9E9892] mt-0.5">Loved</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] text-center border border-[#E0E3DF] dark:border-[#2D382F]">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Smile className="w-3.5 h-3.5" />
              <span className="font-bold text-sm tabular-nums">{toleratedCount}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#424842] dark:text-[#9E9892] mt-0.5">Tolerated</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] text-center border border-[#E0E3DF] dark:border-[#2D382F]">
            <div className="flex items-center gap-1 text-[#D97757]">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="font-bold text-sm tabular-nums">{dislikedCount + allergicCount}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#424842] dark:text-[#9E9892] mt-0.5">Retrials</span>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Sub-Tabs */}
      <div className="w-full p-1 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] flex items-center gap-1 overflow-x-auto no-scrollbar border border-[#E0E3DF] dark:border-[#2D382F]">
        {[
          { id: 'diary' as WeaningTab, label: '100 Foods Grid' },
          { id: 'chart' as WeaningTab, label: 'Age-Wise Stages' },
          { id: 'recipes' as WeaningTab, label: 'Tested Recipes' },
          { id: 'safety' as WeaningTab, label: 'Gag vs Choke' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tap-feedback flex-1 min-w-[95px] py-2 px-3 rounded-full text-xs text-center transition-all font-semibold ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#202822] text-[#191C1A] dark:text-[#FAF8F5] shadow-xs font-bold'
                : 'text-[#424842] dark:text-[#9E9892] hover:text-[#191C1A]'
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 100 FOODS CHALLENGE & REACTION DIARY */}
      {/* ========================================================================= */}
      {activeTab === 'diary' && (
        <div className="space-y-5">
          
          {/* Quick Tip for 1-Tap Cycling */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-xs text-[#424842] dark:text-[#9E9892]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#44634B] dark:text-[#ADCFB1] shrink-0" />
              <span>
                <strong>1-Tap Cycling:</strong> Tap any food badge to cycle state (Untried ➔ Tried ➔ Liked ➔ Disliked ➔ Allergy).
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#44634B] dark:text-[#ADCFB1] shrink-0">Fast BLW</span>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'All Foods', count: foods.length },
                { id: 'grain', label: '🌾 Grains & Millets', count: foods.filter(f => f.category === 'grain').length },
                { id: 'vegetable', label: '🥕 Vegetables', count: foods.filter(f => f.category === 'vegetable').length },
                { id: 'fruit', label: '🍎 Fruits', count: foods.filter(f => f.category === 'fruit').length },
                { id: 'protein', label: '🥚 Protein & Dal', count: foods.filter(f => f.category === 'protein').length },
                { id: 'dairy', label: '🧈 Dairy & Fats', count: foods.filter(f => f.category === 'dairy').length },
                { id: 'spice', label: '🌿 Mild Aromatics', count: foods.filter(f => f.category === 'spice').length },
              ].map((cat) => {
                const isSelected = diaryCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setDiaryCategory(cat.id)}
                    className={`tap-feedback px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                        : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] text-[#424842] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`ml-1 text-[10px] ${isSelected ? 'text-white/80' : 'text-[#75706B]'}`}>
                      ({cat.count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Iron Toggle Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75706B]" />
                <input
                  type="text"
                  placeholder="Search foods (e.g. Ragi, Apple, Curd)..."
                  value={diarySearch}
                  onChange={(e) => setDiarySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#44634B]"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyIronFoods(!onlyIronFoods)}
                className={`tap-feedback px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  onlyIronFoods
                    ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                    : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] text-[#424842] dark:text-[#9E9892]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Iron Rich Only</span>
              </button>
            </div>
          </div>

          {/* Foods Grid with 1-Tap State Cycling */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredFoods.map((food) => {
              const isIntroduced = (food.timesOffered || 0) > 0 || !!food.isIntroduced;
              const foodEmoji =
                food.category === 'fruit'
                  ? '🍎'
                  : food.category === 'vegetable'
                  ? '🥦'
                  : food.category === 'grain'
                  ? '🌾'
                  : food.category === 'dairy'
                  ? '🥣'
                  : food.isAllergen
                  ? '🥜'
                  : '🥑';

              return (
                <div
                  key={food.id}
                  className={`flex flex-col justify-between rounded-3xl p-3.5 border transition-all ${
                    isIntroduced
                      ? food.reaction === 'loved'
                        ? 'bg-white dark:bg-[#1E2520] border-[#44634B]/40 ring-1 ring-[#44634B]/20 shadow-xs'
                        : food.reaction === 'allergic'
                        ? 'bg-white dark:bg-[#1E2520] border-rose-400/40'
                        : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F]'
                      : 'bg-[#F7FAF5]/80 dark:bg-[#161C17]/80 border-dashed border-[#D0D6CF] dark:border-[#2D382F]'
                  }`}
                >
                  <div>
                    {/* Top Row: Emoji & 1-Tap Cycling Badge */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="w-10 h-10 rounded-2xl bg-[#F1F4F0] dark:bg-[#202822] flex items-center justify-center text-lg shrink-0">
                        {foodEmoji}
                      </div>

                      {/* Tap this pill directly to cycle states! */}
                      <button
                        type="button"
                        onClick={() => handleCycleFoodState(food.id)}
                        title="Tap to cycle state (Untried ➔ Tried ➔ Liked ➔ Disliked ➔ Allergy)"
                        className={`tap-feedback inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-transform cursor-pointer ${
                          !isIntroduced
                            ? 'bg-[#F1F4F0] dark:bg-[#202822] text-[#75706B] dark:text-[#9E9892] border-[#E0E3DF] dark:border-[#2D382F]'
                            : food.reaction === 'loved'
                            ? 'bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1] border-[#44634B]/30'
                            : food.reaction === 'neutral'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-200'
                            : food.reaction === 'disliked'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-rose-200'
                        }`}
                      >
                        {!isIntroduced && '⚪ Untried'}
                        {isIntroduced && food.reaction === 'loved' && '💚 Loved'}
                        {isIntroduced && food.reaction === 'neutral' && '🙂 Tried'}
                        {isIntroduced && food.reaction === 'disliked' && '😋 Disliked'}
                        {isIntroduced && food.reaction === 'allergic' && '⚠️ Allergy'}
                      </button>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] truncate">
                      {food.name}
                    </h4>
                    <p className="text-[11px] text-[#424842] dark:text-[#9E9892] truncate mt-0.5">
                      {food.category} {food.isIronRich ? '• Iron rich' : ''} {food.isAllergen ? '• Allergen' : ''}
                    </p>
                  </div>

                  {/* Bottom Control Bar */}
                  <div className="mt-3 pt-2 border-t border-[#E8E4DC] dark:border-[#2D382F] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleCycleFoodState(food.id)}
                      className="tap-feedback inline-flex items-center gap-1 font-semibold text-[#44634B] dark:text-[#ADCFB1] text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isIntroduced ? `Tried ${food.timesOffered || 1}x` : 'Tap to Try'}</span>
                    </button>

                    {/* Dedicated Details / Symptoms Modal Button */}
                    {userRole === 'parent' && (
                      <button
                        onClick={() => setSelectedFoodForReaction(food)}
                        className="tap-feedback p-1 rounded-lg text-stone-400 hover:text-[#44634B] transition-colors"
                        type="button"
                        title="Log specific symptoms or notes"
                        aria-label={`Detailed log for ${food.name}`}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFoods.length === 0 && (
            <div className="p-8 text-center text-xs text-[#75706B] dark:text-[#9E9892] bg-white dark:bg-[#1E2520] rounded-3xl border border-[#E8E4DC] dark:border-[#2D382F]">
              No foods match your search or filter.
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGE-WISE WEANING GUIDE & STAGES */}
      {/* ========================================================================= */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          
          {/* Stage Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {AGE_WISE_WEANING_STAGES.map((stg) => {
              const isSelected = selectedStageId === stg.stageId;
              return (
                <button
                  key={stg.stageId}
                  onClick={() => setSelectedStageId(stg.stageId)}
                  className={`tap-feedback p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#C8EBCC]/40 dark:bg-[#203D24]/40 border-[#44634B] shadow-xs ring-1 ring-[#44634B]/20'
                      : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#44634B] dark:text-[#ADCFB1]">
                    {stg.ageRange}
                  </div>
                  <div className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] mt-0.5 truncate">
                    {stg.title.split(':')[1] || stg.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Overview Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E8E4DC] dark:border-[#2D382F] pb-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1] uppercase tracking-wider">
                  {activeStage.ageRange} Guidance
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] mt-1.5">
                  {activeStage.title}
                </h3>
                <p className="text-xs text-[#75706B] dark:text-[#9E9892] mt-0.5">
                  {activeStage.subtitle}
                </p>
              </div>

              <button
                onClick={() => {
                  setRecipeStageFilter(activeStage.stageId);
                  setActiveTab('recipes');
                }}
                className="tap-feedback px-3.5 py-2 rounded-xl text-xs font-bold bg-[#44634B] hover:bg-[#344738] text-white flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto shrink-0"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>View {activeStage.ageRange} Recipes</span>
              </button>
            </div>

            {/* Stage Core Metrics (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Texture */}
              <div className="p-4 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#44634B]" />
                  <span>Texture &amp; Consistency</span>
                </div>
                <div className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  {activeStage.recommendedTexture}
                </div>
              </div>

              {/* Meal Frequency & Portion */}
              <div className="p-4 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D97757]" />
                  <span>Meal Frequency &amp; Portion</span>
                </div>
                <div className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  {activeStage.mealFrequency}
                </div>
                <div className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  Portion: {activeStage.servingSize}
                </div>
              </div>

              {/* Milk vs Solids Ratio */}
              <div className="p-4 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Milk className="w-3.5 h-3.5 text-blue-600" />
                  <span>Milk vs. Solids Balance</span>
                </div>
                <div className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  {activeStage.milkVsSolidsRatio}
                </div>
              </div>

            </div>

            {/* Foods Allowed vs Foods to Avoid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Best First Foods */}
              <div className="p-4 rounded-2xl bg-[#C8EBCC]/30 dark:bg-[#203D24]/20 border border-[#44634B]/30 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#03210E] dark:text-[#ADCFB1]">
                  <CheckCircle2 className="w-4 h-4 text-[#44634B]" />
                  <span>Recommended Foods for this Stage</span>
                </div>
                <ul className="text-xs text-[#191C1A] dark:text-[#FAF8F5] space-y-1.5">
                  {activeStage.bestFirstFoods.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#44634B] font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Foods Strictly Prohibited */}
              <div className="p-4 rounded-2xl bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/30 border border-rose-300 dark:border-rose-900/40 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Foods Strictly Prohibited at this Stage</span>
                </div>
                <ul className="text-xs text-[#191C1A] dark:text-[#FAF8F5] space-y-1.5">
                  {activeStage.foodsToAvoid.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Sample Feeding Day Routine */}
            <div className="space-y-3 pt-2 border-t border-[#E8E4DC] dark:border-[#2D382F]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sample Daily Routine ({activeStage.ageRange})</span>
                </h4>
                <span className="text-[10px] text-[#75706B]">Pediatric Routine</span>
              </div>

              <div className="space-y-2">
                {activeStage.sampleDaySchedule.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[11px] text-[#75706B] dark:text-[#9E9892] w-18">
                        {item.time}
                      </span>
                      <span className="text-[#191C1A] dark:text-[#FAF8F5] font-medium">
                        {item.activity}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'milk'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : item.type === 'solid'
                          ? 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]'
                          : item.type === 'snack'
                          ? 'bg-[#FFDDAE] text-[#281800] dark:bg-[#3D2C12] dark:text-[#F8BC58]'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Golden Pediatric Rules Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/40 dark:border-amber-700/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pediatric Golden Rules for {activeStage.ageRange}</span>
              </div>
              <ul className="text-xs text-[#4D4845] dark:text-[#DDD8D0] space-y-1 list-disc pl-5">
                {activeStage.pediatricGoldenRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STEP-BY-STEP TESTED RECIPES */}
      {/* ========================================================================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          
          {/* Controls: Stage Filter, Category, Search, Iron Toggle */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs space-y-3">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75706B]" />
                <input
                  type="text"
                  placeholder="Search recipes (e.g. Ragi, Khichdi, Apple, Iron)..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#44634B]"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyIronRichRecipes(!onlyIronRichRecipes)}
                className={`tap-feedback px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                  onlyIronRichRecipes
                    ? 'bg-[#D97757] text-white border-[#D97757] shadow-xs'
                    : 'bg-[#F7FAF5] dark:bg-[#161C17] border-[#E8E4DC] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>⭐ Iron Powerhouse Only</span>
              </button>
            </div>

            {/* Stage Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'All Stages' },
                { id: '6-7m', label: 'Stage 1 (6–7M)' },
                { id: '7-8m', label: 'Stage 2 (7–8M)' },
                { id: '8-10m', label: 'Stage 3 (8–10M)' },
                { id: '10-12m', label: 'Stage 4 (10–12M)' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setRecipeStageFilter(pill.id)}
                  className={`tap-feedback px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    recipeStageFilter === pill.id
                      ? 'bg-[#44634B] text-white shadow-xs'
                      : 'bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setActiveRecipeModal(recipe)}
                className="tap-feedback p-5 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs hover:border-[#44634B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]">
                      {recipe.stage}
                    </span>
                    {recipe.isIronRich && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFDBD0] text-[#99462A] dark:bg-[#3D1E16] dark:text-[#FFB59E] flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#D97757]" />
                        <span>Iron Rich</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5] group-hover:text-[#44634B] dark:group-hover:text-[#ADCFB1] transition-colors">
                      {recipe.title}
                    </h4>
                    {(recipe.bengaliName || recipe.hindiName) && (
                      <div className="text-[11px] font-medium text-[#44634B] dark:text-[#ADCFB1] mt-0.5">
                        {recipe.bengaliName || recipe.hindiName}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#75706B] dark:text-[#9E9892] line-clamp-2">
                    {recipe.texture}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {recipe.keyNutrients.slice(0, 3).map((nut, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#75706B] dark:text-[#9E9892]"
                      >
                        {nut}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E4DC] dark:border-[#2D382F] flex items-center justify-between text-xs text-[#75706B] dark:text-[#9E9892]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.cookTime}</span>
                    </span>
                    <span>•</span>
                    <span>{recipe.difficulty}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#75706B] group-hover:translate-x-1 group-hover:text-[#44634B] transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAFETY, GAGGING VS CHOKING */}
      {/* ========================================================================= */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          
          {/* GAGGING VS CHOKING COMPARISON */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#191C1A] dark:text-[#FAF8F5]">
                  Lifesaving Pediatric Guide: Gagging vs. Choking
                </h3>
                <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
                  Knowing the difference keeps parents calm and saves infant lives.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gagging */}
              <div className="p-5 rounded-2xl bg-[#FFDDAE]/30 dark:bg-[#3D2C12]/30 border border-[#F8BC58]/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                    {GAGGING_VS_CHOKING_GUIDE.gagging.title}
                  </h4>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                  {GAGGING_VS_CHOKING_GUIDE.gagging.definition}
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                    What You See &amp; Hear:
                  </span>
                  <ul className="text-xs space-y-1 text-amber-900/80 dark:text-amber-300/80 list-disc pl-4">
                    {GAGGING_VS_CHOKING_GUIDE.gagging.signs.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/20 text-xs font-semibold text-amber-900 dark:text-amber-200 border border-amber-200/50">
                  👉 <strong>Parent Action:</strong> {GAGGING_VS_CHOKING_GUIDE.gagging.parentAction}
                </div>
              </div>

              {/* Choking */}
              <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/40 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                  <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider">
                    {GAGGING_VS_CHOKING_GUIDE.choking.title}
                  </h4>
                </div>
                <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                  {GAGGING_VS_CHOKING_GUIDE.choking.definition}
                </p>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-rose-950 dark:text-rose-200">
                    What You See &amp; Hear:
                  </span>
                  <ul className="text-xs space-y-1 text-rose-900/80 dark:text-rose-300/80 list-disc pl-4">
                    {GAGGING_VS_CHOKING_GUIDE.choking.signs.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 text-xs font-bold text-rose-900 dark:text-rose-200 border border-rose-300/50">
                  🚨 <strong>Parent Action:</strong> {GAGGING_VS_CHOKING_GUIDE.choking.parentAction}
                </div>
              </div>

            </div>
          </div>

          {/* THE 3-DAY WAIT RULE PROTOCOL */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#191C1A] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#44634B]" />
              <span>The Pediatric 3-Day Wait Rule Protocol</span>
            </h4>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
              When introducing high-allergy foods (egg, dairy curd, wheat, tree nuts, fish), follow this timeline:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <span className="text-[10px] font-bold text-[#44634B] uppercase">Day 1: Tasting</span>
                <p className="text-xs text-[#191C1A] dark:text-[#FAF8F5] font-semibold">
                  1/4 to 1/2 teaspoon
                </p>
                <p className="text-[11px] text-[#75706B]">
                  Offer mid-morning (10 AM). Watch for hives, wheezing, vomiting, or perianal redness over 4 hours.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Day 2: Increment</span>
                <p className="text-xs text-[#191C1A] dark:text-[#FAF8F5] font-semibold">
                  1 to 2 tablespoons
                </p>
                <p className="text-[11px] text-[#75706B]">
                  If Day 1 had no reaction, offer a slightly larger serving. Do not introduce any other new food.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-1">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Day 3: Clearance</span>
                <p className="text-xs text-[#191C1A] dark:text-[#FAF8F5] font-semibold">
                  Normal meal serving
                </p>
                <p className="text-[11px] text-[#75706B]">
                  Offer with confidence. If no adverse reaction occurs, food is officially cleared &amp; safe in baby’s diet!
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* FULL RECIPE DETAILS MODAL */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            
            <div className="flex items-start justify-between gap-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1]">
                    {activeRecipeModal.stage}
                  </span>
                  {activeRecipeModal.isIronRich && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFDBD0] text-[#99462A] dark:bg-[#3D1E16] dark:text-[#FFB59E]">
                      ⭐ Iron Powerhouse
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#191C1A] dark:text-[#FAF8F5] mt-1">
                  {activeRecipeModal.title}
                </h3>
              </div>

              <button
                onClick={() => setActiveRecipeModal(null)}
                className="tap-feedback p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F]">
                <div className="text-[10px] text-[#75706B] font-semibold">Prep Time</div>
                <div className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">{activeRecipeModal.prepTime}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F]">
                <div className="text-[10px] text-[#75706B] font-semibold">Cook Time</div>
                <div className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">{activeRecipeModal.cookTime}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F]">
                <div className="text-[10px] text-[#75706B] font-semibold">Difficulty</div>
                <div className="font-bold text-[#191C1A] dark:text-[#FAF8F5]">{activeRecipeModal.difficulty}</div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#44634B]" />
                <span>Ingredients</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] space-y-2">
                {activeRecipeModal.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#191C1A] dark:text-[#FAF8F5]">
                      • {ing.item}
                    </span>
                    <span className="font-bold font-mono text-[#44634B] dark:text-[#ADCFB1]">
                      {ing.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#191C1A] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                <span>Step-by-Step Instructions</span>
              </h4>
              <div className="space-y-2">
                {activeRecipeModal.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1E2520] border border-[#E0E3DF] dark:border-[#2D382F] flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-[#191C1A] dark:text-[#FAF8F5] leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-[#E8E4DC] dark:border-[#2D382F]">
              <button
                onClick={() => setActiveRecipeModal(null)}
                className="tap-feedback flex-1 py-2.5 rounded-xl font-semibold border border-[#E8E4DC] dark:border-[#2D382F] text-[#424842] dark:text-[#9E9892] text-xs"
              >
                Close
              </button>

              {userRole === 'parent' && (
                <button
                  onClick={() => handleMarkRecipeCooked(activeRecipeModal)}
                  className="tap-feedback flex-1 py-2.5 rounded-xl font-bold bg-[#44634B] hover:bg-[#344738] text-white shadow-sm text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Cooked in Diary</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* UPDATE FOOD REACTION MODAL */}
      {selectedFoodForReaction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <div>
                <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                  {selectedFoodForReaction.name}
                </h3>
                <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  How did {profile.name} react to this food?
                </p>
              </div>
              <button
                onClick={() => setSelectedFoodForReaction(null)}
                className="tap-feedback p-1 rounded-full text-[#75706B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'loved')}
                className="tap-feedback p-3 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex flex-col items-center gap-1"
              >
                <Smile className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Loved It!</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'neutral')}
                className="tap-feedback p-3 rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 flex flex-col items-center gap-1"
              >
                <Meh className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Tolerated</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'disliked')}
                className="tap-feedback p-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex flex-col items-center gap-1"
              >
                <Frown className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Disliked</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'allergic', ['mild rash'])}
                className="tap-feedback p-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex flex-col items-center gap-1"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-xs font-bold">Allergy Reaction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM FOOD MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <h3 className="font-bold text-sm text-[#191C1A] dark:text-[#FAF8F5]">
                Add Custom Family Food
              </h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="tap-feedback p-1 rounded-full text-[#75706B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomFood} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soft Idli Mash with Dal..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E8E4DC] dark:border-[#2D382F] text-[#191C1A] dark:text-[#FAF8F5]"
                >
                  <option value="grain">Grains &amp; Millets</option>
                  <option value="vegetable">Vegetables</option>
                  <option value="fruit">Fruits</option>
                  <option value="protein">Proteins &amp; Legumes</option>
                  <option value="dairy">Dairy &amp; Fats</option>
                  <option value="spice">Mild Herbs &amp; Aromatics</option>
                </select>
              </div>

              <button
                type="submit"
                className="tap-feedback w-full py-2.5 rounded-xl font-bold text-xs bg-[#44634B] hover:bg-[#344738] text-white shadow-sm mt-2"
              >
                Add to 100 Foods Challenge
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
