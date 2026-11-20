import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.STITCH_API_KEY || '';
const PROJECT_ID = process.env.STITCH_PROJECT_ID || '6488970471501195163';
const DESIGN_SYSTEM = process.env.STITCH_DESIGN_SYSTEM || 'assets/6fe006764acc46f49ec7b9f45fd284be';
const MCP_URL = process.env.STITCH_MCP_URL || 'https://stitch.googleapis.com/mcp';

const MOCKUP_DIR = path.resolve('mockups');

fs.mkdirSync(MOCKUP_DIR, { recursive: true });

async function callMcpTool(name, args, timeoutMs = 240000) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: { 'X-Goog-Api-Key': API_KEY },
  });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

const SCREENS_TO_GENERATE = [
  {
    prefix: '07_tummy_time_coach',
    title: 'Tummy Time Coach & Sensory Play',
    prompt: `Design a mobile-first 'Tummy Time Coach & High-Contrast Sensory Play' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Header:
- Title: 'Tummy Time Coach'
- Subtitle: 'Neck & Core Strength for Leo (7m 14d)'
- '+ Manual Entry' pill button.

Hero Stopwatch & Daily Goal Bento:
- Large circular progress ring timer:
  - Inside: Live Stopwatch '05:42' active timer
  - Status: 'Session in progress ⏱️'
  - Daily Goal Progress: '25 / 30 mins goal completed' (83% of daily target)
  - Controls: 'Pause' (primary sage pill), 'Reset', and 'Save Session'

High-Contrast Sensory Cards Carousel (Designed to engage babies during tummy time):
- Section Header: 'Baby Visual Engagement Cards' with 'Launch Fullscreen Mode 📱' button
- Visual cards preview (black, white & bold red graphics):
  - Card 1: 'Concentric Bullseye' (Focuses infant macular tracking)
  - Card 2: 'Bold Checkerboard' (High visual interest)
  - Card 3: 'Friendly Smiling Sun'
  - Card 4: 'Spiral Nebula'

Developmental Tummy Positions Guide:
- Section Header: 'Physiotherapist-Approved Positions'
- 2-column cards:
  - 1. 'Chest-to-Chest': Great for bonding, elevates upper chest
  - 2. 'Lap Time': Across caregiver thighs with gentle hip support
  - 3. 'Rolled Towel Bolster': Under armpits for lift assistance
  - 4. 'Exercise Ball Gentle Rock': Builds dynamic balance

Recent Session Log:
- Today 10:15 AM: 12 mins • Mood: Happy & Energetic 🌟
- Today 02:40 PM: 8 mins • Mood: Calmed after peek-a-boo 😊
- Yesterday: 32 mins total (Goal achieved 🏆)

Persistent Bottom Navigation:
- Today, Growth, Tummy (Active green pill), Vaccines, More.`
  },
  {
    prefix: '08_medicine_dose_calculator',
    title: 'Pediatric Fever & Medicine Dose Calculator',
    prompt: `Design a mobile-first 'Pediatric Fever & Medicine Dose Calculator' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Header:
- Title: 'Fever & Dose Calculator'
- Subtitle: 'Weight-Based Dosing for Leo (8.45 kg • 7m 14d)'
- Warning pill badge: 'Verify with pediatrician'

Current Weight & Medicine Formulation Selector:
- Child weight chip: '8.45 kg (Current recorded weight)' with 'Override' button
- Medicine Segmented Tabs:
  - 'Infant Paracetamol / Calpol (120mg / 5ml)' (Active tab)
  - 'Pediatric Ibuprofen / Motrin (100mg / 5ml)'
  - 'Vitamin D3 Drops (400 IU)'

Calculated Dosage Hero Card (Clear, safe, high-contrast):
- Recommended Dose: '5.3 mL' (127 mg)
- Administration Frequency: 'Every 4–6 hours as needed (Max 4 times in 24 hours)'
- Safety Timer Card:
  - 'Last Dose Given: 3 hours ago (11:30 AM)'
  - 'Next Safe Dose in: 01h 00m' with circular countdown
- Direct CTA button: 'Log Dose Given Now' in sage green pill

Fever & Temperature Log Section:
- Current Temperature gauge: '38.2°C (100.8°F) - Mild Fever' (warm amber status)
- Quick temperature log buttons: 'Armpit (Axillary)', 'Ear (Tympanic)', 'Forehead'
- Pediatric Warning Checklist:
  - 'Seek immediate care if: Temperature exceeds 39.0°C (102.2°F), baby is unusually lethargic, or rash appears.'

Recent Dosing History:
- 11:30 AM: 5.3 mL Calpol • Temp: 38.4°C • Administered by Mom
- 05:45 AM: 5.3 mL Calpol • Temp: 38.6°C

Persistent Bottom Navigation:
- Today, Growth, Dose (Active green pill), Vaccines, More.`
  },
  {
    prefix: '09_doctor_prescriptions_vault',
    title: 'Doctor Visit Prep & Prescription Vault',
    prompt: `Design a mobile-first 'Doctor Visit Prep & Prescription Vault' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Header:
- Title: 'Doctor Visit & Rx Vault'
- Subtitle: 'Pediatric Records & Visit Questions for Leo'
- '+ New Visit Note' primary button.

Upcoming Visit Reminder Card:
- '9-Month Wellness Checkup with Dr. Morrison'
- Date & Time: Tuesday, Dec 02 at 10:00 AM • Westside Pediatric Clinic
- 'Generate Visit Brief (PDF)' CTA button (summarizes last 3 months growth, feeds, vaccines, symptoms).

Parent Questions for Doctor Checklist (Interactive to ensure parents don't forget questions during hurried doctor visits):
- 'Questions to Ask Dr. Morrison (3 pending)':
  - 1. 'Is night-waking at 7.5 months normal sleep regression or teething?' [Pending check]
  - 2. 'Safe to introduce peanut butter and cow milk in cooked foods?' [Answered: Yes, small daily amounts]
  - 3. 'Need vitamin D drops along with solid food feeds?' [Answered: Continue 400 IU daily]
  - '+ Add question' input.

Prescription & Document Vault (Scanned Prescriptions):
- Section Header: 'Scanned Prescriptions & Lab Slips' with '+ Upload Scan'
- Card 1: '6-Month Wellness Checkup Prescription' • Oct 14, 2026 • Dr. Morrison • Verified PDF with thumbnail
- Card 2: 'Ear Infection Treatment Protocol (Amoxicillin)' • Aug 22, 2026 • Completed course badge
- Card 3: 'Allergy Test & Blood Panel Report' • Jul 10, 2026

Active Symptoms Logged for Doctor:
- Symptom Timeline: Mild diaper rash (2 days), Night fussiness (3 days).

Persistent Bottom Navigation:
- Today, Growth, Vaccines, Doctor (Active green pill), More.`
  },
  {
    prefix: '10_mom_care_tracker',
    title: 'Mom Care, Postpartum Recovery & Lactation Support',
    prompt: `Design a mobile-first 'Mom Care, Postpartum Recovery & Lactation Support' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Header:
- Title: 'Mom Care & Recovery'
- Subtitle: 'Sarah's Postpartum Wellness & Daily Self-Care'
- Gentle supportive badge: 'You are doing amazing, Sarah 🌸'

Daily Maternal Wellness Bento:
- Daily Mood & Energy Check-in:
  - 'How are you feeling today?'
  - Emotional status pills: 'Energized ☀️', 'Content 🌿 (Selected)', 'Sleepy 🥱', 'Overwhelmed 🌧️'
- Hydration Tracker:
  - '2.25 / 3.0 Liters Logged' (75% completed) with water glass counter (+250ml quick add button)
  - Subtext: 'Optimal hydration supports healthy breast milk production'
- Sleep & Rest:
  - '6h 40m broken sleep' (Longest stretch: 3h 15m)

Postpartum Recovery & Pelvic Health:
- 'Pelvic Floor & Core Recovery':
  - Daily Kegel reminder: '2 of 3 sessions completed'
  - Gentle 5-minute stretch routine with 'Start Timer' button

Lactation Nutrition & Ayurvedic Galactagogues Guide:
- Section Header: 'Traditional Milk Supply Superfoods'
- Cards:
  - 1. 'Jeera & Saunf Water (Cumin & Fennel)' • Reduces postpartum bloating & stimulates milk flow
  - 2. 'Methi (Fenugreek) Seeds & Leaves' • Research-backed prolactin booster
  - 3. 'Gondh ke Ladoo & Panjiri' • Rich in iron, healthy fats & pelvic bone strength
  - 4. 'Warm Ragi Malt & Oatmeal' • Prevents maternal fatigue

Supportive Affirmation Card:
- Warm terracotta/blush card: 'Remember: Taking care of yourself is part of taking care of baby. Rest when you can.'

Persistent Bottom Navigation:
- Today, Growth, Mom Care (Active green pill), Vaccines, More.`
  },
  {
    prefix: '11_memory_milestones_timeline',
    title: 'Milestone Memories & Scrapbook Timeline',
    prompt: `Design a mobile-first 'Milestone Memories & Scrapbook Timeline' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Header:
- Title: 'Memory Scrapbook'
- Subtitle: 'Precious Firsts & Milestones for Leo (228 days old)'
- '+ Add Memory / Photo' primary pill button in sage green.

Timeline Filter Pills:
- 'All Memories (18)'
- 'Favorites ⭐ (6)'
- 'Physical Firsts (8)'
- 'Trips & Celebrations (4)'

Hero Memory Highlight Card (Editorial polaroid / bento styling):
- Memory: 'First Time Crawling on the Living Room Rug! 🐾'
- Age badge: '7 Months, 12 Days (Nov 18, 2026)'
- High-res baby photo preview with soft rounded corners and white polaroid frame
- Caption: 'After rocking on all fours for 2 weeks, Leo suddenly propelled himself straight toward his favorite duck toy!'
- Reactions: Hearted by Mom & Dad • 'Share Milestone Card 💌' action

Chronological Memory Cards Stream:
- Memory 2: 'First Taste of Mashed Avocado 🥑' • Oct 22 (6m 21d) • 'Loved it! Smeared everywhere.' • 3 photos attached
- Memory 3: 'First Baby Tooth Buds Through! 🦷' • Oct 28 (6m 27d) • Lower central left incisor visible
- Memory 4: 'First Full Belly Laugh at Peek-a-boo 😂' • Sep 14 (5m 13d) • Audio recording attached (0:18s)
- Memory 5: '100 Days Celebration 🎉' • Jul 10 (3m 9d) • Family gathering photo card

Export Scrapbook Action:
- 'Create Printable Memory Book (PDF)' with golden star badge.

Persistent Bottom Navigation:
- Today, Growth, Vaccines, Memories (Active green pill), More.`
  },
  {
    prefix: '12_login_family_sync',
    title: 'Login, Family Cloud Sync & Local Mode',
    prompt: `Design a mobile-first 'Login & Family Cloud Sync' screen for DayOne, strictly adhering to the 'Nurturing Daylight' design system (sage green #608066, terracotta #d97757, honey amber #ebb04d, warm cream surface #FDFBF7, rounded-full pills, Plus Jakarta Sans).

Top Branding & Welcome:
- Clean DayOne App Icon / Logo (Minimal organic sunrise mark)
- Title: 'DayOne'
- Subtitle: 'The calm, private baby care & milestone companion for mindful families.'

Sign In Card (Warm pillowy card with subtle border):
- Toggle: 'Sign In' | 'Create Family Account'
- Primary button: 'Continue with Google' with Google icon and clean high-contrast styling
- Divider: 'or continue with email magic link'
- Input field: 'name@family.com' with mail icon
- CTA button: 'Send Passwordless Magic Link' in sage green pill

Offline / Local-First Reassurance Banner:
- Card with offline badge (WifiOff icon):
  - Heading: 'No Account? Use 100% Locally'
  - Description: 'Your baby records, growth charts, and care logs are stored privately on this device. You can sync to cloud whenever you are ready.'
  - Button: 'Continue in Local Mode (No Login Required) →' in warm terracotta outline

Security & Family Sharing Highlights:
- 3 minimal bullet chips:
  - 🛡️ End-to-end private data
  - 👨‍👩‍👧 Seamless sync between Mom, Dad & Nanny
  - 📲 Instant offline PWA support

Footer:
- 'DayOne Pediatric Companion • Built for restful parents'`
  }
];

async function main() {
  console.log(`Starting Stitch generation for remaining ${SCREENS_TO_GENERATE.length} screens...`);

  for (let i = 0; i < SCREENS_TO_GENERATE.length; i++) {
    const item = SCREENS_TO_GENERATE[i];
    const pngPath = path.join(MOCKUP_DIR, `${item.prefix}.png`);
    const htmlPath = path.join(MOCKUP_DIR, `${item.prefix}.html`);

    if (fs.existsSync(pngPath) && fs.existsSync(htmlPath)) {
      console.log(`[${i + 1}/${SCREENS_TO_GENERATE.length}] Already exists: ${item.title}`);
      continue;
    }

    console.log(`\n[${i + 1}/${SCREENS_TO_GENERATE.length}] Generating screen: ${item.title}...`);
    try {
      const genRes = await callMcpTool('generate_screen_from_text', {
        projectId: PROJECT_ID,
        prompt: item.prompt,
        designSystem: DESIGN_SYSTEM,
        deviceType: 'MOBILE',
        modelId: 'GEMINI_3_8_FLASH',
      });

      const parsedText = JSON.parse(genRes.result.content[0].text);
      const outputScreens = parsedText.outputComponents?.[0]?.design?.screens;
      if (!outputScreens || outputScreens.length === 0) {
        throw new Error('No screens returned in outputComponents');
      }

      const screen = outputScreens[0];
      console.log(`✓ Screen created: ${screen.name} (Title: ${screen.title})`);

      console.log(`Downloading screenshot: ${screen.screenshot.downloadUrl}...`);
      await downloadFile(screen.screenshot.downloadUrl, pngPath);

      console.log(`Downloading HTML: ${screen.htmlCode.downloadUrl}...`);
      await downloadFile(screen.htmlCode.downloadUrl, htmlPath);

      console.log(`✓ Saved ${item.prefix}.png (${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Error generating ${item.title}:`, err.message);
    }
  }

  console.log('\nAll generation tasks finished!');
}

main().catch(console.error);
