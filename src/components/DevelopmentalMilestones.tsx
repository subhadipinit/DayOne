'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Award,
  Info,
  Heart,
  Baby,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { MilestoneCheckRecord, ChildProfile } from '@/lib/types';
import { syncSingleRecord } from '@/lib/syncService';
import confetti from 'canvas-confetti';

interface DevelopmentalMilestonesProps {
  profile: ChildProfile;
  userRole?: 'parent' | 'family';
}

export interface StandardMilestone {
  key: string;
  ageMonth: number;
  category: 'motor' | 'cognitive' | 'language' | 'social';
  title: string;
  description: string;
  playTip?: string;
}

export const MILESTONE_DATABASE: StandardMilestone[] = [
  // 2 MONTHS
  {
    key: 'm2_social_smile',
    ageMonth: 2,
    category: 'social',
    title: 'Social Smiles',
    description: 'Calms down when spoken to or picked up; smiles at familiar caregiver faces.',
    playTip: 'Smile close to baby’s face (8–12 inches) and mirror their expressions back to them.',
  },
  {
    key: 'm2_head_control',
    ageMonth: 2,
    category: 'motor',
    title: 'Holds Head Up in Tummy Time',
    description: 'Lifts head up when placed on tummy; moves both arms and legs smoothly.',
    playTip: 'Offer 2–3 minutes of tummy time on your chest after every diaper change.',
  },
  {
    key: 'm2_cooing',
    ageMonth: 2,
    category: 'language',
    title: 'Coos & Vocalizes',
    description: 'Makes vowel sounds other than crying ("ooo", "aah").',
    playTip: 'Have back-and-forth "conversations" by pausing and letting baby respond with coos.',
  },
  {
    key: 'm2_visual_track',
    ageMonth: 2,
    category: 'cognitive',
    title: 'Tracks Moving Objects',
    description: 'Follows you or high-contrast toys with their eyes across midline.',
    playTip: 'Slowly move a high-contrast black-and-white card from left to right.',
  },

  // 4 MONTHS
  {
    key: 'm4_chuckle',
    ageMonth: 4,
    category: 'social',
    title: 'Chuckles & Laughs',
    description: 'Chuckles (not yet full belly laugh) when you make playful faces or play.',
    playTip: 'Play gentle peek-a-boo or blow soft raspberries on baby’s tummy.',
  },
  {
    key: 'm4_push_elbows',
    ageMonth: 4,
    category: 'motor',
    title: 'Pushes Up on Elbows',
    description: 'Holds head steady without support when held upright; pushes onto elbows during tummy time.',
    playTip: 'Place colorful sensory toys just beyond baby’s reach during tummy time.',
  },
  {
    key: 'm4_turn_voice',
    ageMonth: 4,
    category: 'language',
    title: 'Turns Toward Your Voice',
    description: 'Turns head toward the direction of voices and sounds.',
    playTip: 'Call baby’s name from different corners of the room in a gentle sing-song tone.',
  },
  {
    key: 'm4_hands_mouth',
    ageMonth: 4,
    category: 'cognitive',
    title: 'Brings Hands to Mouth',
    description: 'Opens hands and reaches to grasp dangling toys or clothes.',
    playTip: 'Offer safe, lightweight silicone grasping toys or textured rings.',
  },

  // 6 MONTHS
  {
    key: 'm6_roll_over',
    ageMonth: 6,
    category: 'motor',
    title: 'Rolls from Tummy to Back',
    description: 'Can roll over from tummy to back; pushes up with straight arms.',
    playTip: 'Place a favorite musical toy to the side to encourage rolling momentum.',
  },
  {
    key: 'm6_babble',
    ageMonth: 6,
    category: 'language',
    title: 'Babbles Consonants ("ba-ba", "ma")',
    description: 'Blows raspberries; strings vowels and consonants together.',
    playTip: 'Sing repetitive nursery rhymes with clear consonant sounds ("ba-ba", "ma-ma").',
  },
  {
    key: 'm6_sits_support',
    ageMonth: 6,
    category: 'motor',
    title: 'Sits with Brief Support',
    description: 'Can sit leaning forward on hands ("tripod sit") or with cushion support.',
    playTip: 'Support baby’s hips while sitting on the floor with soft cushions behind them.',
  },
  {
    key: 'm6_pass_toy',
    ageMonth: 6,
    category: 'cognitive',
    title: 'Passes Objects Between Hands',
    description: 'Reaches with both hands and transfers a toy from left to right hand.',
    playTip: 'Offer a small ring and hold out a second toy to encourage hand-to-hand transfer.',
  },

  // 9 MONTHS
  {
    key: 'm9_sit_unsupported',
    ageMonth: 9,
    category: 'motor',
    title: 'Sits Without Any Support',
    description: 'Sits steadily on the floor and plays with toys without tipping over.',
    playTip: 'Scatter toys around baby so they rotate and balance without tipping.',
  },
  {
    key: 'm9_object_perm',
    ageMonth: 9,
    category: 'cognitive',
    title: 'Object Permanence (Peek-a-Boo)',
    description: 'Looks for things they see you hide under a cloth or cup.',
    playTip: 'Hide a toy halfway under a soft washcloth and ask "Where did it go?".',
  },
  {
    key: 'm9_stranger_anx',
    ageMonth: 9,
    category: 'social',
    title: 'Distinguishes Familiar from Strangers',
    description: 'Shows clinginess around new people; reaches arms out to parents.',
    playTip: 'Hold baby securely when introducing new people; allow time to warm up safely.',
  },
  {
    key: 'm9_sounds_rep',
    ageMonth: 9,
    category: 'language',
    title: 'Copies Sounds & Gestures',
    description: 'Makes repetitive sounds like "mamamama" or "babababa".',
    playTip: 'Clap hands and wave; pause to let baby imitate your gesture.',
  },

  // 12 MONTHS (1 YEAR)
  {
    key: 'm12_pull_stand',
    ageMonth: 12,
    category: 'motor',
    title: 'Pulls Up to Stand',
    description: 'Pulls themselves up to a standing position using furniture.',
    playTip: 'Place sturdy low furniture (sofa, ottoman) with enticing toys on top.',
  },
  {
    key: 'm12_wave_bye',
    ageMonth: 12,
    category: 'social',
    title: 'Waves "Bye-Bye"',
    description: 'Waves hand goodbye or claps hands when excited.',
    playTip: 'Wave consistently at departures and encourage family members to do the same.',
  },
  {
    key: 'm12_first_words',
    ageMonth: 12,
    category: 'language',
    title: 'Says 1-2 Specific Words',
    description: 'Calls specific parent "mama" or "dada" with intention.',
    playTip: 'Label objects clearly throughout the day ("cup", "ball", "water").',
  },
  {
    key: 'm12_pincer_grasp',
    ageMonth: 12,
    category: 'motor',
    title: 'Neat Pincer Grasp',
    description: 'Picks up small pieces of food between thumb and index finger.',
    playTip: 'Offer soft steamed carrot bits or small baby puffs on the high-chair tray.',
  },

  // 18 MONTHS
  {
    key: 'm18_walks_alone',
    ageMonth: 18,
    category: 'motor',
    title: 'Walks Independently',
    description: 'Walks without holding on to anyone or anything.',
    playTip: 'Create clear, obstacle-free floor space for open walking exploration.',
  },
  {
    key: 'm18_single_words',
    ageMonth: 18,
    category: 'language',
    title: 'Uses 3–5 Single Words',
    description: 'Points to things when named; uses words like "milk", "ball", "more".',
    playTip: 'Read picture books daily, pointing and naming everyday items.',
  },
  {
    key: 'm18_scribbles',
    ageMonth: 18,
    category: 'cognitive',
    title: 'Scribbles with Crayon',
    description: 'Imitates scribbling lines or turning pages of a book.',
    playTip: 'Give chunky triangular non-toxic crayons and large paper taped to the floor.',
  },

  // 24 MONTHS (2 YEARS)
  {
    key: 'm24_two_word_phrases',
    ageMonth: 24,
    category: 'language',
    title: '2-Word Phrases ("Want milk")',
    description: 'Puts at least two words together like "more water" or "daddy go".',
    playTip: 'Expand on baby’s words (if they say "car", you say "big blue car go!").',
  },
  {
    key: 'm24_kicks_ball',
    ageMonth: 24,
    category: 'motor',
    title: 'Kicks a Ball & Runs',
    description: 'Runs without falling easily; kicks a large ball forward.',
    playTip: 'Roll a soft soccer ball back and forth outdoors on grass.',
  },
  {
    key: 'm24_points_body',
    ageMonth: 24,
    category: 'cognitive',
    title: 'Points to 2+ Body Parts',
    description: 'Points to nose, eyes, or tummy when asked "Where is your nose?".',
    playTip: 'Play "Where is your nose?" in front of a safe full-length mirror.',
  },
];

const AGE_BRACKETS = [2, 4, 6, 9, 12, 18, 24];

const RED_FLAGS_BY_AGE: Record<number, string[]> = {
  2: [
    'Does not respond to loud sounds',
    'Does not watch things as they move',
    'Does not smile at people',
    'Does not bring hands to mouth',
  ],
  4: [
    'Does not hold head steady',
    'Does not coo or make sounds',
    'Does not push down with legs when feet placed on a hard surface',
    'Has trouble moving one or both eyes in all directions',
  ],
  6: [
    'Does not try to get things that are in reach',
    'Shows no affection to caregivers',
    'Does not make vowel sounds ("ah", "eh", "oh")',
    'Does not roll over in either direction',
    'Seems very stiff, with tight muscles, or very floppy',
  ],
  9: [
    'Does not bear weight on legs with support',
    'Does not sit with help',
    'Does not babble ("mama", "baba")',
    'Does not play any games involving back-and-forth play',
  ],
  12: [
    'Does not crawl',
    'Cannot stand when supported',
    'Does not search for things that they see you hide',
    'Does not say single words like "mama" or "dada"',
    'Does not learn gestures like waving or shaking head',
  ],
  18: [
    'Cannot walk independently',
    'Does not know what familiar things are for (e.g. cup, phone)',
    'Does not copy others',
    'Does not have at least 6 words',
  ],
  24: [
    'Does not use 2-word phrases',
    'Does not know what to do with common things, like a brush, phone, fork',
    'Does not copy actions and words',
    'Does not follow simple instructions',
  ],
};

export const DevelopmentalMilestones: React.FC<DevelopmentalMilestonesProps> = ({
  profile,
  userRole = 'parent',
}) => {
  const birthDate = new Date(profile.dob);
  const diffDays = Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
  const currentMonths = Math.floor(diffDays / 30.4375);

  const defaultBracket = AGE_BRACKETS.find((b) => b >= currentMonths) || 6;
  const [selectedAge, setSelectedAge] = useState<number>(defaultBracket);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPlayTipKey, setExpandedPlayTipKey] = useState<string | null>(null);

  const [achievedMilestones, setAchievedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dayone_milestones_${profile.id}`);
      return saved ? JSON.parse(saved) : {
        m2_social_smile: true,
        m2_head_control: true,
        m2_cooing: true,
        m4_chuckle: true,
        m4_push_elbows: true,
        m6_roll_over: true,
      };
    }
    return {};
  });

  useEffect(() => {
    const loadSaved = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dayone_milestones_${profile.id}`);
        if (saved) {
          try {
            setAchievedMilestones(JSON.parse(saved));
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

  const ageMilestones = MILESTONE_DATABASE.filter((m) => m.ageMonth === selectedAge);
  const filteredMilestones = ageMilestones.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  const totalAgeCount = ageMilestones.length || 1;
  const achievedAgeCount = ageMilestones.filter((m) => achievedMilestones[m.key]).length;
  const stagePercent = Math.round((achievedAgeCount / totalAgeCount) * 100);
  const isStageFullyMastered = achievedAgeCount === totalAgeCount && totalAgeCount > 0;

  const handleToggleMilestone = (key: string) => {
    const nextState = !achievedMilestones[key];
    const newAchieved = { ...achievedMilestones, [key]: nextState };
    setAchievedMilestones(newAchieved);
    localStorage.setItem(`dayone_milestones_${profile.id}`, JSON.stringify(newAchieved));

    const meta = MILESTONE_DATABASE.find((m) => m.key === key);
    syncSingleRecord('milestone_progress', {
      id: `${profile.id}_${key}`,
      child_id: profile.id,
      milestone_key: key,
      age_month: meta?.ageMonth || selectedAge,
      category: meta?.category || 'motor',
      title: meta?.title || key,
      description: meta?.description || null,
      is_achieved: nextState,
      achieved_date: nextState ? new Date().toISOString().split('T')[0] : null,
      is_red_flag: false,
      notes: null,
    });

    if (nextState) {
      const willBeAllDone = ageMilestones.every((m) => (m.key === key ? true : newAchieved[m.key]));
      try {
        confetti({
          particleCount: willBeAllDone ? 80 : 45,
          spread: willBeAllDone ? 80 : 60,
          origin: { y: 0.6 },
          colors: ['#44634B', '#C8EBCC', '#D97757', '#EBB04D'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const redFlags = RED_FLAGS_BY_AGE[selectedAge] || [];

  return (
    <div className="space-y-5 animate-reveal">
      
      {/* 1. Header & Stage Mastery Gauge */}
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1A] dark:text-[#FAF8F5]">
            CDC Developmental Milestones
          </h2>
          <p className="text-xs text-[#424842] dark:text-[#9E9892]">
            Evidence-based 2M – 2Y cognitive, motor, social, and language milestones
          </p>
        </div>

        {/* Stage Progress Card */}
        <div className="p-4 sm:p-5 rounded-[28px] bg-white dark:bg-[#1E2520] border border-[#E8E4DC] dark:border-[#2D382F] shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#44634B] dark:text-[#ADCFB1]">
                Stage {selectedAge} Months Mastery
              </span>
              {isStageFullyMastered && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8EBCC] dark:bg-[#203D24] text-[#03210E] dark:text-[#ADCFB1]">
                  🎉 All Mastered!
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#191C1A] dark:text-[#FAF8F5] tabular-nums">
                {achievedAgeCount} / {totalAgeCount}
              </span>
              <span className="text-xs font-semibold text-[#424842] dark:text-[#9E9892]">
                Milestones Mastered ({stagePercent}%)
              </span>
            </div>
            <p className="text-[11px] text-[#424842] dark:text-[#9E9892]">
              {isStageFullyMastered
                ? 'Outstanding! All developmental markers for this age group achieved.'
                : stagePercent >= 75
                ? 'Excellent progress! Well ahead of standard milestone markers.'
                : 'Developing on pace. Keep encouraging play and tummy time exploration.'}
            </p>
          </div>

          {/* Smooth Radial Ring Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
              <circle
                className="stroke-[#E6E9E4] dark:stroke-[#2D382F]"
                cx="24"
                cy="24"
                fill="none"
                r="19"
                strokeWidth="4.5"
              />
              <circle
                className="stroke-[#44634B] dark:stroke-[#ADCFB1] transition-all duration-700 ease-out"
                cx="24"
                cy="24"
                fill="none"
                r="19"
                strokeDasharray="119.38"
                strokeDashoffset={119.38 - (119.38 * stagePercent) / 100}
                strokeLinecap="round"
                strokeWidth="4.5"
              />
            </svg>
            <span className="absolute text-xs font-black text-[#44634B] dark:text-[#ADCFB1] tabular-nums">
              {stagePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Age Bracket Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {AGE_BRACKETS.map((age) => {
          const isSelected = selectedAge === age;
          const count = MILESTONE_DATABASE.filter((m) => m.ageMonth === age && achievedMilestones[m.key]).length;
          const total = MILESTONE_DATABASE.filter((m) => m.ageMonth === age).length;
          const isComplete = count === total && total > 0;

          return (
            <button
              key={age}
              type="button"
              onClick={() => setSelectedAge(age)}
              className={`tap-feedback shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#44634B] text-white border-[#344738] shadow-xs'
                  : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F] text-[#424842] dark:text-[#9E9892] hover:bg-[#F1F4F0]'
              }`}
            >
              <span>{age} Months</span>
              {isComplete && <span className="ml-1 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'all', label: 'All Skills' },
          { id: 'motor', label: 'Movement 🏃' },
          { id: 'language', label: 'Language 🗣️' },
          { id: 'cognitive', label: 'Cognitive 💡' },
          { id: 'social', label: 'Social ❤️' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`tap-feedback shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-[#C8EBCC] text-[#03210E] dark:bg-[#203D24] dark:text-[#ADCFB1] border-[#44634B]/30 font-bold'
                : 'bg-[#F1F4F0] dark:bg-[#1C241E] text-[#424842] dark:text-[#9E9892] border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. Milestone Checklist Cards */}
      <div className="space-y-3">
        {filteredMilestones.map((m) => {
          const isDone = achievedMilestones[m.key];
          const isPlayTipExpanded = expandedPlayTipKey === m.key;

          return (
            <div
              key={m.key}
              className={`rounded-2xl border transition-all ${
                isDone
                  ? 'bg-white dark:bg-[#1E2520] border-[#44634B]/40 dark:border-[#ADCFB1]/30 shadow-xs'
                  : 'bg-white dark:bg-[#1E2520] border-[#E8E4DC] dark:border-[#2D382F]'
              }`}
            >
              <div
                onClick={() => handleToggleMilestone(m.key)}
                className="tap-feedback p-3.5 sm:p-4 cursor-pointer flex items-start gap-3.5"
              >
                {/* Tactile Checkbox */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? 'bg-[#44634B] text-white shadow-2xs'
                      : 'border-2 border-[#C2C8C0] dark:border-[#424842] bg-white dark:bg-[#1E2520]'
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-xs sm:text-sm font-bold ${
                      isDone ? 'text-[#191C1A] dark:text-[#FAF8F5]' : 'text-[#191C1A] dark:text-[#FAF8F5]'
                    }`}>
                      {m.title}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F4F0] dark:bg-[#161C17] text-[#424842] dark:text-[#9E9892] uppercase">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#424842] dark:text-[#9E9892] mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              {/* Play Tip Accordion Toggle */}
              {m.playTip && (
                <div className="px-3.5 pb-3 sm:px-4 sm:pb-3.5 pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPlayTipKey(isPlayTipExpanded ? null : m.key);
                    }}
                    className="tap-feedback inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#44634B] dark:text-[#ADCFB1] hover:underline"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{isPlayTipExpanded ? 'Hide Activity Tip' : 'How to Encourage (Play Tip)'}</span>
                    {isPlayTipExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isPlayTipExpanded && (
                    <div className="mt-2 p-3 rounded-xl bg-[#F7FAF5] dark:bg-[#161C17] border border-[#E0E3DF] dark:border-[#2D382F] text-xs text-[#191C1A] dark:text-[#FAF8F5] leading-relaxed animate-reveal">
                      <strong>Activity:</strong> {m.playTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. CDC "When to Act Early" Red Flags Alert Box */}
      {redFlags.length > 0 && (
        <div className="p-4 sm:p-5 rounded-[28px] bg-[#FFDBD0]/40 dark:bg-[#3D1E16]/40 border border-[#FE9572]/40 dark:border-[#543830] space-y-2.5">
          <div className="flex items-center gap-2 text-[#99462A] dark:text-[#FFB59E]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              CDC Guidance: When to Mention to Your Pediatrician
            </h4>
          </div>
          <p className="text-xs text-[#762C12] dark:text-[#FFB59E] leading-relaxed">
            Every child develops at their own rhythm. However, discuss with your doctor if by {selectedAge} months your baby:
          </p>
          <ul className="text-xs space-y-1 text-[#762C12] dark:text-[#FFB59E] list-disc pl-5">
            {redFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};
