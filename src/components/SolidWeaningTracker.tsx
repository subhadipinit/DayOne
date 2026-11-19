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
  const [activeTab, setActiveTab] = useState<WeaningTab>('chart');

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
      
      {/* HEADER BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-teal-500/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Utensils className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              First Foods & Solid Weaning Hub (6+ Months)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Age-wise feeding stages, 16+ step-by-step pediatric recipes, and the <strong>100 Foods Before Age One</strong> challenge with safety & allergen guidance.
          </p>
        </div>

        {/* 100 Foods Badge Counter */}
        <div className="bg-white dark:bg-[#1D1C22] p-4 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {introducedFoods.length} <span className="text-xs font-semibold text-[#75706B]">/ 100</span>
            </div>
            <div className="text-[10px] text-[#75706B] dark:text-[#9E9892] uppercase font-bold tracking-wider">
              Foods Introduced
            </div>
          </div>
          <div className="w-28 space-y-1">
            <div className="bg-[#EAE6DF] dark:bg-[#2D2B33] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 text-center truncate">
              {progressPercent}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#EAE6DF] dark:border-[#2D2B33] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'chart' as WeaningTab, label: '🥣 Age-Wise Food Chart', desc: 'Stage 1 to 5 (6–12+ M)' },
          { id: 'recipes' as WeaningTab, label: '📖 Pediatric Recipes', desc: '16+ Tested Recipes' },
          { id: 'diary' as WeaningTab, label: '🥑 100 Foods Diary', desc: `${introducedFoods.length}/100 Explored` },
          { id: 'safety' as WeaningTab, label: '🛡️ Safety & Allergens', desc: 'Gagging vs Choking' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-start gap-0.5 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1D1C22] border border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] font-normal opacity-85 ${activeTab === tab.id ? 'text-emerald-100' : 'text-[#75706B]'}`}>
              {tab.desc}
            </span>
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

          {/* Foods Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFoods.map((food) => {
              const isIntroduced = (food.timesOffered || 0) > 0 || !!food.isIntroduced;

              return (
                <div
                  key={food.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isIntroduced
                      ? food.reaction === 'loved'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 shadow-xs'
                        : food.reaction === 'allergic'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40'
                        : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33]'
                      : 'bg-[#FAF8F5] dark:bg-[#17161B] border-dashed border-[#EAE6DF] dark:border-[#2D2B33] opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#75706B] dark:text-[#9E9892]">
                          {food.category}
                        </span>
                        {food.isIronRich && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            Iron
                          </span>
                        )}
                        {food.isAllergen && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Allergen
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#201E1D] dark:text-[#FAF8F5] mt-0.5">
                        {food.name}
                      </h4>
                    </div>

                    {isIntroduced ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                          food.reaction === 'loved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : food.reaction === 'disliked'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : food.reaction === 'allergic'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {food.reaction === 'loved' && '❤️ Loved'}
                        {food.reaction === 'neutral' && '🙂 Tolerated'}
                        {food.reaction === 'disliked' && '😕 Disliked'}
                        {food.reaction === 'allergic' && '⚠️ Reaction'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#75706B] dark:text-[#9E9892]">
                        Not yet offered
                      </span>
                    )}
                  </div>

                  {isIntroduced && (
                    <div className="text-[10px] text-[#75706B] dark:text-[#9E9892] flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                      <span>Offered {food.timesOffered || 1} {(food.timesOffered || 1) === 1 ? 'time' : 'times'}</span>
                      <span>{food.firstOfferedDate ? `First: ${food.firstOfferedDate}` : 'Recorded'}</span>
                    </div>
                  )}

                  {/* Quick Action Button */}
                  {userRole === 'parent' && (
                    <button
                      onClick={() => setSelectedFoodForReaction(food)}
                      className={`w-full py-1.5 rounded-xl font-semibold text-xs border transition-colors ${
                        isIntroduced
                          ? 'border-[#EAE6DF] dark:border-[#2D2B33] text-[#201E1D] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                      }`}
                    >
                      {isIntroduced ? 'Update Reaction' : 'Mark as Offered'}
                    </button>
                  )}
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
