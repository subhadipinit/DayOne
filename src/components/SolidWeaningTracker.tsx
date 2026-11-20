'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { SolidFoodItem, ChildProfile, WeaningRecipe } from '@/lib/types';
import { syncSingleRecord } from '@/lib/syncService';
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

type WeaningTab = 'chart' | 'recipes' | 'diary' | 'safety';

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
  const [selectedFoodForReaction, setSelectedFoodForReaction] = useState<SolidFoodItem | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);

  // Custom Food Form
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<SolidFoodItem['category']>('grain');

  // Stats for 100 Foods Challenge
  const introducedFoods = foods.filter((f) => (f.timesOffered || 0) > 0 || !!f.isIntroduced);
  const lovedCount = foods.filter((f) => f.reaction === 'loved').length;
  const toleratedCount = foods.filter((f) => f.reaction === 'neutral' && ((f.timesOffered || 0) > 0 || f.isIntroduced)).length;
  const dislikedCount = foods.filter((f) => f.reaction === 'disliked').length;
  const allergicCount = foods.filter((f) => f.reaction === 'allergic').length;
  const progressPercent = Math.min(100, Math.round((introducedFoods.length / 100) * 100));

  // Determine badge level
  const getBadgeLevel = (count: number) => {
    if (count >= 100) return { label: '👑 Master Weaner (100 Foods Champion)', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
    if (count >= 75) return { label: '🥇 Gold Taster (75+ Foods)', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300' };
    if (count >= 50) return { label: '🥈 Silver Foodie (50+ Foods)', color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/40 border-slate-300' };
    if (count >= 25) return { label: '🥉 Bronze Explorer (25+ Foods)', color: 'text-amber-700 bg-amber-50/70 dark:bg-amber-950/30 border-amber-400' };
    return { label: '🌱 New Food Explorer', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' };
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
      id: `custom_${Date.now()}`,
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
  };

  // 1-Click Link Recipe to Food Diary
  const handleMarkRecipeCooked = (recipe: WeaningRecipe) => {
    const today = new Date().toISOString().split('T')[0];
    let matched = false;

    const updated = foods.map((f) => {
      if (f.id === recipe.linkedFoodId || f.name.toLowerCase().includes(recipe.title.toLowerCase().slice(0, 10))) {
        matched = true;
        const currentTimes = f.timesOffered || 0;
        return {
          ...f,
          isIntroduced: true,
          timesOffered: currentTimes + 1,
          firstOfferedDate: f.firstOfferedDate || today,
          reaction: f.reaction || 'loved',
        };
      }
      return f;
    });

    if (!matched) {
      const newFood: SolidFoodItem = {
        id: `rec_food_${Date.now()}`,
        childId: profile.id,
        name: recipe.title,
        category: recipe.category === 'porridge' || recipe.category === 'khichdi' ? 'grain' : 'vegetable',
        isIntroduced: true,
        timesOffered: 1,
        firstOfferedDate: today,
        reaction: 'loved',
        isIronRich: recipe.isIronRich,
      };
      updated.unshift(newFood);
    }

    setFoods(updated);
    localStorage.setItem(`dayone_foods_${profile.id}`, JSON.stringify(updated));
    setActiveRecipeModal(null);

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
    return matchesCat && matchesSearch;
  });

  const badge = getBadgeLevel(introducedFoods.length);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Screen Title & Action Bar */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex flex-col min-w-0">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
            100 Foods Challenge
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Baby Led Weaning • {profile.name} ({profile.dob ? `${Math.floor((Date.now() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.4375))}m` : '6m+'})
          </p>
        </div>
        {userRole === 'parent' && (
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-primary text-on-primary shadow-xs active:scale-95 transition-all font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-lg text-label-lg">Try Food</span>
          </button>
        )}
      </div>

      {/* Challenge Progress Hero Card (Direct from Stitch Mockup) */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-5 shadow-[0_4px_20px_-2px_rgba(45,49,46,0.05)] border border-outline-variant/30 overflow-hidden">
        {/* Ambient organic blush pattern */}
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary-fixed/25 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-secondary-fixed/35 blur-2xl pointer-events-none"></div>

        <div className="relative flex items-center justify-between gap-4">
          {/* Radial Gauge with Badge inside */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg aria-hidden="true" className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f4f0" strokeWidth="8"></circle>
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
              <span className="font-headline-md text-headline-md font-bold text-on-surface leading-none">
                {introducedFoods.length}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">/ 100</span>
            </div>
          </div>

          {/* Text details & milestone */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant mb-1.5 shadow-xs">
              <span className="material-symbols-outlined text-[15px]">eco</span>
              <span className="font-label-sm text-label-sm font-semibold">{badge.label}</span>
            </div>
            <p className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
              {introducedFoods.length} Foods Explored
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {100 - introducedFoods.length} fresh bites left to reach baby&apos;s 1st birthday milestone!
            </p>
          </div>
        </div>

        {/* Stat Pills Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-surface-variant/40">
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container-low text-center">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="font-label-lg text-label-lg font-bold">6</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Allergens Ok</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container-low text-center">
            <div className="flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              <span className="font-label-lg text-label-lg font-bold">{lovedCount}</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Loved</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-container-low text-center">
            <div className="flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-[16px]">replay</span>
              <span className="font-label-lg text-label-lg font-bold">{toleratedCount + dislikedCount}</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Retrials</span>
          </div>
        </div>
      </div>

      {/* Safety Quick Tip Card (Direct from Stitch Mockup) */}
      <div className="rounded-2xl bg-tertiary-fixed/30 p-4 border border-tertiary-fixed/40 flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
            Pediatric Safety Note: Gagging vs Choking
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed text-xs">
            Gagging is a normal, noisy throat reflex as baby learns tongue control. Choking is silent. Always serve soft, finger-length spears and seat baby upright.
          </p>
        </div>
      </div>

      {/* Segmented Navigation Sub-Tabs (Direct from Stitch Mockup) */}
      <div className="w-full p-1 rounded-full bg-surface-container flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'diary' as WeaningTab, label: '100 Foods Grid' },
          { id: 'chart' as WeaningTab, label: 'Age-Wise Stages' },
          { id: 'recipes' as WeaningTab, label: 'Tested Recipes' },
          { id: 'safety' as WeaningTab, label: 'Gag vs Choke' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[95px] py-2 px-3 rounded-full font-label-md text-label-md text-center transition-all font-semibold ${
              activeTab === tab.id
                ? 'bg-surface-container-lowest text-on-surface shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGE-WISE FOOD CHART & FEEDING STAGES */}
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
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D0C9BE]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {stg.ageRange}
                  </div>
                  <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] mt-0.5 truncate">
                    {stg.title.split(':')[1] || stg.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Overview Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase tracking-wider">
                  {activeStage.ageRange} Guidance
                </span>
                <h3 className="text-lg font-bold text-[#201E1D] dark:text-[#FAF8F5] mt-1.5">
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto shrink-0"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>View {activeStage.ageRange} Recipes</span>
              </button>
            </div>

            {/* Stage Core Metrics (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Texture */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Texture & Consistency</span>
                </div>
                <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  {activeStage.recommendedTexture}
                </div>
              </div>

              {/* Meal Frequency & Portion */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Meal Frequency & Portion</span>
                </div>
                <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  {activeStage.mealFrequency}
                </div>
                <div className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  Portion: {activeStage.servingSize}
                </div>
              </div>

              {/* Milk vs Solids Ratio */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <div className="text-[10px] font-bold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider flex items-center gap-1.5">
                  <Milk className="w-3.5 h-3.5 text-blue-600" />
                  <span>Milk vs. Solids Balance</span>
                </div>
                <div className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  {activeStage.milkVsSolidsRatio}
                </div>
              </div>

            </div>

            {/* Foods Allowed vs Foods to Avoid (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Best First Foods */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Foods for this Stage</span>
                </div>
                <ul className="text-xs text-[#201E1D] dark:text-[#DDD8D0] space-y-1.5">
                  {activeStage.bestFirstFoods.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Foods Strictly Prohibited */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Foods Strictly Prohibited at this Stage</span>
                </div>
                <ul className="text-xs text-[#201E1D] dark:text-[#DDD8D0] space-y-1.5">
                  {activeStage.foodsToAvoid.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Development & Readiness Milestones */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Physical Developmental Milestones for this Stage</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStage.keyMilestones.map((ms, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-xs text-[#4D4845] dark:text-[#C7C2BA] flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ms}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Feeding Day Routine */}
            <div className="space-y-3 pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sample Daily Feeding & Nap Routine</span>
                </h4>
                <span className="text-[10px] text-[#75706B]">Pediatric Routine</span>
              </div>

              <div className="space-y-2">
                {activeStage.sampleDaySchedule.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[11px] text-[#75706B] dark:text-[#9E9892] w-18">
                        {item.time}
                      </span>
                      <span className="text-[#201E1D] dark:text-[#FAF8F5] font-medium">
                        {item.activity}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'milk'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : item.type === 'solid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.type === 'snack'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
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
      {/* TAB 2: STEP-BY-STEP PEDIATRIC RECIPES */}
      {/* ========================================================================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          
          {/* Controls: Stage Filter, Category, Search, Iron Toggle */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-3">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75706B]" />
                <input
                  type="text"
                  placeholder="Search recipes (e.g. Ragi, Khichdi, Apple, Iron)..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Iron Powerhouse Toggle */}
              <button
                onClick={() => setOnlyIronRichRecipes(!onlyIronRichRecipes)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                  onlyIronRichRecipes
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#141317] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    recipeStageFilter === pill.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]'
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
                className="p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {recipe.stage}
                    </span>
                    {recipe.isIronRich && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        <span>Iron Rich</span>
                      </span>
                    )}
                  </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {recipe.title}
                      </h4>
                      {(recipe.bengaliName || recipe.hindiName) && (
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
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
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892]"
                      >
                        {nut}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DF] dark:border-[#2D2B33] flex items-center justify-between text-xs text-[#75706B] dark:text-[#9E9892]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.cookTime}</span>
                    </span>
                    <span>•</span>
                    <span>{recipe.difficulty}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#75706B] group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
                </div>
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <div className="p-8 text-center text-xs text-[#75706B] dark:text-[#9E9892] bg-white dark:bg-[#1D1C22] rounded-3xl border border-[#EAE6DF] dark:border-[#2D2B33]">
              No recipes found matching your filters. Try clearing the search or stage filters.
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 100 FOODS CHALLENGE & REACTION DIARY */}
      {/* ========================================================================= */}
      {activeTab === 'diary' && (
        <div className="space-y-6">
          
          {/* Challenge Level Badge & Stats */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${badge.color}`}>
                {badge.label}
              </span>
              <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5] pt-1">
                The 100 Foods Before Age One Journey
              </h3>
              <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
                Introducing a diverse palette prevents toddler food neophobia and builds lifelong gut microbiome diversity.
              </p>
            </div>

            {/* Reaction Counters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">
                ❤️ Loved: {lovedCount}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900/40">
                🙂 Tolerated: {toleratedCount}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900/40">
                😕 Disliked: {dislikedCount}
              </span>
              {allergicCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/40">
                  ⚠️ Reactions: {allergicCount}
                </span>
              )}
            </div>
          </div>

          {/* Control Bar: Search & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'All Foods' },
                { id: 'grain', label: '🌾 Grains & Millets' },
                { id: 'vegetable', label: '🥕 Vegetables' },
                { id: 'fruit', label: '🍎 Fruits' },
                { id: 'protein', label: '🥚 Protein & Dal' },
                { id: 'dairy', label: '🧈 Dairy & Fats' },
                { id: 'spice', label: '🌿 Mild Aromatics' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setDiaryCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    diaryCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75706B]" />
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={diarySearch}
                  onChange={(e) => setDiarySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {userRole === 'parent' && (
                <button
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Food</span>
                </button>
              )}
            </div>
          </div>

          {/* Foods Grid (Direct from Stitch 2-Column/3-Column Bento Mockup) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredFoods.map((food) => {
              const isIntroduced = (food.timesOffered || 0) > 0 || !!food.isIntroduced;
              const foodEmoji = food.category === 'fruit' ? '🍎' : food.category === 'vegetable' ? '🥦' : food.category === 'grain' ? '🌾' : food.category === 'dairy' ? '🥣' : food.isAllergen ? '🥜' : '🥑';

              return (
                <div
                  key={food.id}
                  className={`flex flex-col justify-between rounded-3xl p-3.5 shadow-[0_4px_16px_-2px_rgba(45,49,46,0.04)] border transition-all ${
                    isIntroduced
                      ? food.reaction === 'loved'
                        ? 'bg-surface-container-lowest border-primary/30 ring-1 ring-primary/20'
                        : food.reaction === 'allergic'
                        ? 'bg-surface-container-lowest border-error/40'
                        : 'bg-surface-container-lowest border-outline-variant/30'
                      : 'bg-surface-container-low/60 border-dashed border-outline-variant/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-lg shrink-0">
                        {foodEmoji}
                      </div>

                      {isIntroduced ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            food.reaction === 'loved'
                              ? 'bg-primary-fixed text-on-primary-fixed-variant'
                              : food.reaction === 'allergic'
                              ? 'bg-error-container text-on-error-container'
                              : food.reaction === 'disliked'
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {food.reaction === 'loved' && 'Loved 💚'}
                          {food.reaction === 'neutral' && 'Liked 🙂'}
                          {food.reaction === 'disliked' && 'Grimace 😋'}
                          {food.reaction === 'allergic' && 'Reaction ⚠️'}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-outline font-medium">
                          New
                        </span>
                      )}
                    </div>

                    <h4 className="font-headline-md text-sm font-bold text-on-surface truncate">
                      {food.name}
                    </h4>
                    <p className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5">
                      {food.category} {food.isIronRich ? '• Iron rich' : ''} {food.isAllergen ? '• Allergen' : ''}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-surface-variant/30 flex items-center justify-between text-on-surface-variant font-label-sm text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-[14px]">
                        {isIntroduced ? 'check_circle' : 'schedule'}
                      </span>
                      <span>{isIntroduced ? `Tried ${food.timesOffered || 1}x` : 'Not offered'}</span>
                    </span>

                    {userRole === 'parent' && (
                      <button
                        onClick={() => setSelectedFoodForReaction(food)}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        type="button"
                        aria-label={`Log food ${food.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isIntroduced ? 'edit' : 'add_circle'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAFETY, GAGGING VS CHOKING & ALLERGY PROTOCOL */}
      {/* ========================================================================= */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          
          {/* GAGGING VS CHOKING COMPARISON (CRITICAL PEDIATRIC LIFESAVER) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
                  Lifesaving Pediatric Guide: Gagging vs. Choking
                </h3>
                <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
                  Knowing the difference keeps parents calm and saves infant lives.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gagging */}
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 space-y-3">
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
                    What You See & Hear:
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
                    What You See & Hear:
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
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>The Pediatric 3-Day Wait Rule Protocol</span>
            </h4>
            <p className="text-xs text-[#75706B] dark:text-[#9E9892]">
              When introducing high-allergy foods (egg, dairy curd, wheat, tree nuts, fish), follow this timeline:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Day 1: Tasting</span>
                <p className="text-xs text-[#201E1D] dark:text-[#FAF8F5] font-semibold">
                  1/4 to 1/2 teaspoon
                </p>
                <p className="text-[11px] text-[#75706B]">
                  Offer mid-morning (10 AM). Watch for hives, wheezing, vomiting, or perianal redness over 4 hours.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Day 2: Increment</span>
                <p className="text-xs text-[#201E1D] dark:text-[#FAF8F5] font-semibold">
                  1 to 2 tablespoons
                </p>
                <p className="text-[11px] text-[#75706B]">
                  If Day 1 had no reaction, offer a slightly larger serving. Do not introduce any other new food.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-1">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Day 3: Clearance</span>
                <p className="text-xs text-[#201E1D] dark:text-[#FAF8F5] font-semibold">
                  Normal meal serving
                </p>
                <p className="text-[11px] text-[#75706B]">
                  Offer with confidence. If no adverse reaction occurs, food is officially cleared & safe in baby’s diet!
                </p>
              </div>
            </div>
          </div>

          {/* BANNED FOODS UNDER 1 YEAR */}
          <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-300/40 dark:border-rose-800/40 space-y-3">
            <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>5 Foods Strictly Banned Before 12 Months (AAP & WHO)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#201E1D] dark:text-[#DDD8D0]">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200/50">
                <strong>1. Honey:</strong> Contains Clostridium botulinum spores that produce deadly toxins in immature infant guts.
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200/50">
                <strong>2. Added Salt:</strong> Baby’s kidneys cannot filter extra sodium; can lead to dehydration and hypernatremia.
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200/50">
                <strong>3. Added White Sugar:</strong> Causes tooth decay and conditions palate toward sweet addiction.
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200/50">
                <strong>4. Cow’s Milk Beverage:</strong> High protein and minerals overload kidneys; causes microscopic intestinal blood loss.
              </div>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200/50 sm:col-span-2">
                <strong>5. Whole Grapes, Round Nuts & Raw Hard Carrots:</strong> Perfect shape to seal infant trachea completely; always slice lengthwise.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL RECIPE DETAILS MODAL */}
      {/* ========================================================================= */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            
            <div className="flex items-start justify-between gap-3 border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {activeRecipeModal.stage}
                  </span>
                  {activeRecipeModal.isIronRich && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      ⭐ Iron Powerhouse
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#201E1D] dark:text-[#FAF8F5] mt-1">
                  {activeRecipeModal.title}
                </h3>
                {(activeRecipeModal.bengaliName || activeRecipeModal.hindiName) && (
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {activeRecipeModal.bengaliName || activeRecipeModal.hindiName}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveRecipeModal(null)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata Pill Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33]">
                <div className="text-[10px] text-[#75706B] font-semibold">Prep Time</div>
                <div className="font-bold text-[#201E1D] dark:text-[#FAF8F5]">{activeRecipeModal.prepTime}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33]">
                <div className="text-[10px] text-[#75706B] font-semibold">Cook Time</div>
                <div className="font-bold text-[#201E1D] dark:text-[#FAF8F5]">{activeRecipeModal.cookTime}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33]">
                <div className="text-[10px] text-[#75706B] font-semibold">Difficulty</div>
                <div className="font-bold text-[#201E1D] dark:text-[#FAF8F5]">{activeRecipeModal.difficulty}</div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ingredients</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] space-y-2">
                {activeRecipeModal.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#201E1D] dark:text-[#FAF8F5]">
                      • {ing.item}
                    </span>
                    <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {ing.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#201E1D] dark:text-[#FAF8F5] flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                <span>Step-by-Step Cooking Instructions</span>
              </h4>
              <div className="space-y-2">
                {activeRecipeModal.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-[#363331] dark:text-[#D5CFC7] leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pediatric Pro-Tip Card */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Pediatric Nutritionist Pro-Tip</span>
              </div>
              <p className="opacity-90 leading-relaxed">
                {activeRecipeModal.pediatricTip}
              </p>
            </div>

            {/* Storage Guidance */}
            <div className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
              🧊 <strong>Storage & Shelf Life:</strong> {activeRecipeModal.storageGuidance}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-[#EAE6DF] dark:border-[#2D2B33]">
              <button
                onClick={() => setActiveRecipeModal(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold border border-[#EAE6DF] dark:border-[#2D2B33] text-[#4D4845] dark:text-[#DDD8D0] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
              >
                Close
              </button>

              {userRole === 'parent' && (
                <button
                  onClick={() => handleMarkRecipeCooked(activeRecipeModal)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Cooked in Diary</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPDATE FOOD REACTION MODAL */}
      {/* ========================================================================= */}
      {selectedFoodForReaction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <div>
                <h3 className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                  {selectedFoodForReaction.name}
                </h3>
                <p className="text-[11px] text-[#75706B] dark:text-[#9E9892]">
                  How did {profile.name} react to this food?
                </p>
              </div>
              <button
                onClick={() => setSelectedFoodForReaction(null)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'loved')}
                className="p-3 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex flex-col items-center gap-1 hover:scale-102 transition-transform"
              >
                <Smile className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Loved It!</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'neutral')}
                className="p-3 rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 flex flex-col items-center gap-1 hover:scale-102 transition-transform"
              >
                <Meh className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Tolerated</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'disliked')}
                className="p-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex flex-col items-center gap-1 hover:scale-102 transition-transform"
              >
                <Frown className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Disliked</span>
              </button>

              <button
                onClick={() => handleUpdateFoodReaction(selectedFoodForReaction.id, 'allergic', ['mild rash'])}
                className="p-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex flex-col items-center gap-1 hover:scale-102 transition-transform"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-xs font-bold">Allergy Reaction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CUSTOM FAMILY FOOD MODAL */}
      {/* ========================================================================= */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1C1A22] border border-[#EAE6DF] dark:border-[#2D2B33] rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Drag indicator */}
            <div className="w-12 h-1 bg-[#EAE6DF] dark:bg-[#2D2B33] rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF] dark:border-[#2D2B33]">
              <h3 className="font-bold text-sm text-[#201E1D] dark:text-[#FAF8F5]">
                Add Custom Family Food
              </h3>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#75706B]"
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
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#75706B] dark:text-[#9E9892] mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#FAF8F5] dark:bg-[#141317] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5]"
                >
                  <option value="grain">Grains & Millets</option>
                  <option value="vegetable">Vegetables</option>
                  <option value="fruit">Fruits</option>
                  <option value="protein">Proteins & Legumes</option>
                  <option value="dairy">Dairy & Fats</option>
                  <option value="spice">Mild Herbs & Aromatics</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mt-2"
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
