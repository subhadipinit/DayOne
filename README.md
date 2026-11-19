# 🌸 DayOne — Baby Growth & Milestone Tracker

A modern, loving, and clinical-grade web application built for parents to track baby growth, Indian pediatric immunizations (IAP/UIP), WHO standard growth percentiles, breastfeeding & daily care, medical prescriptions, and milestone memories.

> Dedicated with heartfelt congratulations to your baby daughter born on **October 31, 2026**! 🌟

---

## 🚀 Key Features

### 1. ⏳ Precision Live Age Counter & Celebrations
* **Real-time Live Age Ticker**: Shows exact years, months, weeks, days, and live ticking clock.
* **Month-iversary & Birthday Alerts**: Automatically triggers confetti celebrations and loving wishes on the 30th/31st of every month and annual birthdays.
* **1-Click Shareable Story Card**: Export a milestone graphic ready for WhatsApp Status or Instagram Stories with current weight, age, photo, and customized wish.

### 2. 💉 India Pediatric Vaccine Tracker (IAP & UIP)
* Pre-loaded with the **Indian Academy of Pediatrics (IAP)** and **Government Universal Immunization Programme (UIP)** schedules.
* Auto-calculates all due dates starting from **October 31, 2026**.
* **Government (UIP - Free)** vs **Private (Clinic - Out of Pocket)** filters.
* **Painless (DTaP Hexavalent)** vs **Standard (DTwP Whole-cell)** indicator & toggle.
* Suggested Indian vaccine brands (*Hexaxim*, *Prevenar 13*, *Typbar-TCV*, *Rotasiil*, *FluQuadri*, *Havrix*, *Variped*).
* Cost tracking in **₹ (INR)** and clinic receipt photo upload.

### 3. 📈 WHO Standard Growth Curves (Girls 0–24 Months)
* Official World Health Organization percentile curves: **3rd, 15th, 50th (Median), 85th, 97th percentiles**.
* Interactive chart for:
  * **Weight-for-age** ($kg$)
  * **Length-for-age** ($cm$)
  * **Head Circumference-for-age** ($cm$)
* Automatic categorization (e.g. *Normal healthy range*, *Mildly low*, *Above average*).

### 4. 🍼 Daily Care Logger & Night Mode
* **Breastfeeding Stopwatch Timer**: Interactive Left Breast / Right Breast toggle, live timer, and session log.
* **Diaper Log**: 1-click tracking for Wet, Dirty, or Both.
* **Sleep & Naps**: Quick nap duration logging.
* **OLED Midnight Dark Mode**: High-contrast, warm dark theme designed not to strain infant or parent eyes during 2:00 AM feedings.

### 5. 🩺 Pediatric Clinic Visit Assistant & Prescription Vault
* **1-Click Pediatrician Visit PDF Summary**: Downloads a comprehensive 1-page health report (weight percentiles, vaccine history, parent questions, and symptoms) to hand to your doctor.
* **Questions for Doctor Notepad**: Write down questions anytime so you never forget during clinic visits.
* **Prescription Vault**: Upload doctor prescription photos and discharge summaries with automatic client-side canvas compression.

### 6. 📸 Milestone Memory Book
* Chronological timeline organized by age (*"Day 1"*, *"Week 2"*, *"Month 1"*, *"First Smile"*).
* Upload photos and short videos from your phone.
* Favorite star tagging.

### 7. 🛡️ Family Roles, Multi-Child & Offline-First
* **Parent (Admin)** vs **Family / Grandparents (View-only)** mode.
* **Multi-Child Architecture**: Add sibling profiles anytime.
* **Offline-First PWA**: Works offline in clinic basements using local storage; ready for real-time cloud sync with Supabase.

---

## 🛠️ Tech Stack
* **Framework**: Next.js 14+ (App Router, React 18, TypeScript)
* **Styling**: Tailwind CSS (Custom soft rose & warm cream palette, OLED dark mode)
* **Visuals & Charts**: Recharts, Canvas-Confetti, Lucide React
* **Document & Image Export**: jsPDF, html2canvas
* **Storage & Cloud**: Browser LocalStorage/IndexedDB + Supabase PostgreSQL & Storage ready

---

## 🏃 Running the Application Locally

```bash
# 1. Install dependencies (already completed)
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Connecting Supabase Cloud (Optional)
To enable multi-device real-time sync between both parents' phones:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open **Settings** inside DayOne and click **"Copy SQL Script"**, then paste and execute it in Supabase.
4. Copy your **Project URL** and **Anon Key** into DayOne Settings.
