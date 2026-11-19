'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronLeft,
  Info,
  Heart,
  Baby,
} from 'lucide-react';
import { MilestoneCheckRecord, ChildProfile } from '@/lib/types';
import { syncSingleRecord } from '@/lib/syncService';
import confetti from 'canvas-confetti';

interface DevelopmentalMilestonesProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

interface StandardMilestone {
  key: string;
  ageMonth: number;
  category: 'motor' | 'cognitive' | 'language' | 'social';
  title: string;
  description: string;
  redFlag?: boolean;
}

const MILESTONE_DATABASE: StandardMilestone[] = [
  // 2 MONTHS
  { key: 'm2_social_smile', ageMonth: 2, category: 'social', title: 'Social Smiles', description: 'Calms down when spoken to or picked up; smiles at familiar faces.' },
  { key: 'm2_head_control', ageMonth: 2, category: 'motor', title: 'Holds Head Up in Tummy Time', description: 'Lifts head up when on tummy; moves both arms and both legs smoothly.' },
  { key: 'm2_cooing', ageMonth: 2, category: 'language', title: 'Coos & Vocalizes', description: 'Makes vowel sounds other than crying ("ooo", "aah").' },
  { key: 'm2_visual_track', ageMonth: 2, category: 'cognitive', title: 'Tracks Moving Objects', description: 'Follows you or high-contrast toys with their eyes across midline.' },

  // 4 MONTHS
  { key: 'm4_chuckle', ageMonth: 4, category: 'social', title: 'Chuckles & Laughs', description: 'Chuckles (not yet a full belly laugh) when you make funny faces or play.' },
  { key: 'm4_push_elbows', ageMonth: 4, category: 'motor', title: 'Pushes Up on Elbows', description: 'Holds head steady without support when held upright; pushes onto elbows during tummy time.' },
  { key: 'm4_turn_voice', ageMonth: 4, category: 'language', title: 'Turns Toward Your Voice', description: 'Turns head toward the direction of voices and sounds.' },
  { key: 'm4_hands_mouth', ageMonth: 4, category: 'cognitive', title: 'Brings Hands to Mouth', description: 'Opens hands and reaches to grasp dangling toys or clothes.' },

  // 6 MONTHS
  { key: 'm6_roll_over', ageMonth: 6, category: 'motor', title: 'Rolls from Tummy to Back', description: 'Can roll over from tummy to back; pushes up with straight arms.' },
  { key: 'm6_babble', ageMonth: 6, category: 'language', title: 'Babbles Consonants ("ba-ba", "ma")', description: 'Blows raspberries; strings vowels and consonants together.' },
  { key: 'm6_sits_support', ageMonth: 6, category: 'motor', title: 'Sits with Brief Support', description: 'Can sit leaning forward on hands ("tripod sit") or with cushion support.' },
  { key: 'm6_pass_toy', ageMonth: 6, category: 'cognitive', title: 'Passes Objects Between Hands', description: 'Reaches with both hands and transfers a toy from left to right hand.' },

  // 9 MONTHS
  { key: 'm9_sit_unsupported', ageMonth: 9, category: 'motor', title: 'Sits Without Any Support', description: 'Sits steadily on the floor and plays with toys without tipping over.' },
  { key: 'm9_object_perm', ageMonth: 9, category: 'cognitive', title: 'Object Permanence (Peek-a-Boo)', description: 'Looks for things they see you hide under a cloth or cup.' },
  { key: 'm9_stranger_anx', ageMonth: 9, category: 'social', title: 'Distinguishes Familiar from Strangers', description: 'Shows clinginess around new people; reaches arms out to parents.' },
  { key: 'm9_sounds_rep', ageMonth: 9, category: 'language', title: 'Copies Sounds & Gestures', description: 'Makes repetitive sounds like "mamamama" or "babababa".' },

  // 12 MONTHS (1 YEAR)
  { key: 'm12_pull_stand', ageMonth: 12, category: 'motor', title: 'Pulls Up to Stand', description: 'Pulls themselves up to a standing position using furniture.' },
  { key: 'm12_wave_bye', ageMonth: 12, category: 'social', title: 'Waves "Bye-Bye"', description: 'Waves hand goodbye or claps hands when excited.' },
  { key: 'm12_first_words', ageMonth: 12, category: 'language', title: 'Says 1-2 Specific Words', description: 'Calls specific parent "mama" or "dada" with intention.' },
  { key: 'm12_pincer_grasp', ageMonth: 12, category: 'motor', title: 'Neat Pincer Grasp', description: 'Picks up small pieces of food between thumb and index finger.' },

  // 18 MONTHS
  { key: 'm18_walks_alone', ageMonth: 18, category: 'motor', title: 'Walks Independently', description: 'Walks without holding on to anyone or anything.' },
  { key: 'm18_single_words', ageMonth: 18, category: 'language', title: 'Uses 3–5 Single Words', description: 'Points to things when named; uses words like "milk", "ball", "more".' },
  { key: 'm18_scribbles', ageMonth: 18, category: 'cognitive', title: 'Scribbles with Crayon', description: 'Imitates scribbling lines or turning pages of a book.' },

  // 24 MONTHS (2 YEARS)
  { key: 'm24_two_word_phrases', ageMonth: 24, category: 'language', title: '2-Word Phrases ("Want milk")', description: 'Puts at least two words together like "more water" or "daddy go".' },
  { key: 'm24_kicks_ball', ageMonth: 24, category: 'motor', title: 'Kicks a Ball & Runs', description: 'Runs without falling easily; kicks a large ball forward.' },
  { key: 'm24_points_body', ageMonth: 24, category: 'cognitive', title: 'Points to 2+ Body Parts', description: 'Points to nose, eyes, or tummy when asked "Where is your nose?".' },
];

const AGE_BRACKETS = [2, 4, 6, 9, 12, 18, 24];

export const DevelopmentalMilestones: React.FC<DevelopmentalMilestonesProps> = ({
  profile,
  userRole = 'parent',
}) => {
  // Compute baby's approximate current age in months
  const birthDate = new Date(profile.dob);
  const diffDays = Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
  const currentMonths = Math.floor(diffDays / 30.4375);

  // Default active tab to closest milestone bracket
  const defaultBracket = AGE_BRACKETS.find((b) => b >= currentMonths) || 2;
  const [selectedAge, setSelectedAge] = useState<number>(defaultBracket);

  // Stored achievements
  const [achievedMilestones, setAchievedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_milestones_${profile.id}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const handleToggleMilestone = (key: string) => {
    if (userRole !== 'parent') return;
    const isNowAchieved = !achievedMilestones[key];
    const updated = {
      ...achievedMilestones,
      [key]: isNowAchieved,
    };
    setAchievedMilestones(updated);
    localStorage.setItem(`dayone_milestones_${profile.id}`, JSON.stringify(updated));

    const itemMeta = MILESTONE_DATABASE.find((m) => m.key === key);
    syncSingleRecord('milestone_progress', {
      id: `ms_${profile.id}_${key}`,
      child_id: profile.id,
      milestone_key: key,
      age_month: itemMeta ? itemMeta.ageMonth : selectedAge,
      category: itemMeta ? itemMeta.category : 'motor',
      title: itemMeta ? itemMeta.title : key,
      description: itemMeta ? itemMeta.description : null,
      is_achieved: isNowAchieved,
      achieved_date: isNowAchieved ? new Date().toISOString().split('T')[0] : null,
      is_red_flag: itemMeta ? Boolean(itemMeta.redFlag) : false,
      notes: null,
    });

    if (isNowAchieved) {
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

  const currentBracketMilestones = MILESTONE_DATABASE.filter((m) => m.ageMonth === selectedAge);
  const achievedInBracket = currentBracketMilestones.filter((m) => achievedMilestones[m.key]).length;
  const bracketPercent = Math.round((achievedInBracket / currentBracketMilestones.length) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-rose-500/10 border border-[#EAE6DF] dark:border-[#2D2B33] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              CDC & IAP Developmental Milestones Checklist
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#75706B] dark:text-[#9E9892] max-w-xl">
            Official milestones checklist (2 to 24 Months) endorsed by the CDC and Indian Academy of Pediatrics. Tracks gross motor, social-emotional, language, and cognitive leaps.
          </p>
        </div>

        {/* Selected Bracket Progress Gauge */}
        <div className="bg-white dark:bg-[#1D1C22] p-4 rounded-2xl border border-[#EAE6DF] dark:border-[#2D2B33] shadow-xs flex items-center gap-4 shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-[#EAE6DF] dark:text-[#2D2B33]"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - bracketPercent / 100)}
                strokeLinecap="round"
                className="text-indigo-600 transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {bracketPercent}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-[#75706B] dark:text-[#9E9892] uppercase tracking-wider">
              {selectedAge} Months Stage
            </div>
            <div className="text-sm font-bold text-[#201E1D] dark:text-[#FAF8F5]">
              {achievedInBracket} / {currentBracketMilestones.length} Achieved
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              {bracketPercent === 100 ? '🎉 All Milestones Met!' : `${currentBracketMilestones.length - achievedInBracket} leaps in progress`}
            </div>
          </div>
        </div>
      </div>

      {/* Age Bracket Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {AGE_BRACKETS.map((age) => {
          const isSelected = selectedAge === age;
          const bracketItems = MILESTONE_DATABASE.filter((m) => m.ageMonth === age);
          const done = bracketItems.filter((m) => achievedMilestones[m.key]).length;

          return (
            <button
              key={age}
              onClick={() => setSelectedAge(age)}
              className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] text-[#75706B] dark:text-[#9E9892] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>{age} Months</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
              }`}>
                {done}/{bracketItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Milestones Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentBracketMilestones.map((m) => {
          const isAchieved = !!achievedMilestones[m.key];

          const categoryColors = {
            motor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40',
            social: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40',
            language: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40',
            cognitive: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/40',
          }[m.category];

          return (
            <div
              key={m.key}
              onClick={() => handleToggleMilestone(m.key)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                isAchieved
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 shadow-xs'
                  : 'bg-white dark:bg-[#1D1C22] border-[#EAE6DF] dark:border-[#2D2B33] hover:border-[#D0C9BE]'
              }`}
            >
              {/* Checkbox Icon */}
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                isAchieved
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'border-2 border-[#D0C9BE] dark:border-[#3D3A44] text-transparent hover:border-[#E2765A]'
              }`}>
                <CheckCircle2 className="w-4 h-4 fill-current" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${categoryColors}`}>
                    {m.category}
                  </span>
                  <h4 className={`text-xs font-bold ${
                    isAchieved
                      ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-85'
                      : 'text-[#201E1D] dark:text-[#FAF8F5]'
                  }`}>
                    {m.title}
                  </h4>
                </div>
                <p className="text-xs text-[#75706B] dark:text-[#9E9892] leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pediatric When to Act Early Note */}
      <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-200 space-y-1.5 text-xs">
        <div className="font-bold flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Remember: Every Baby Develops on Their Own Unique Timeline</span>
        </div>
        <p className="opacity-90 leading-relaxed">
          Milestones represent what 75%+ of children do by this age. If your baby hasn't achieved a specific milestone yet, mention it to Dr. {profile.pediatricianName || 'your pediatrician'} at your next routine vaccination visit. Early support makes all the difference!
        </p>
      </div>

    </div>
  );
};
