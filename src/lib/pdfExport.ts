import jsPDF from 'jspdf';
import { ChildProfile, GrowthRecord, VaccineRecord, DoctorQuestion, SymptomLog } from './types';

export function generateDoctorSummaryPdf({
  profile,
  growthRecords,
  vaccines,
  questions,
  symptoms,
}: {
  profile: ChildProfile;
  growthRecords: GrowthRecord[];
  vaccines: VaccineRecord[];
  questions: DoctorQuestion[];
  symptoms: SymptomLog[];
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const birthDate = new Date(profile.dob);
  const diffDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const remDays = diffDays % 7;

  // Header Banner
  doc.setFillColor(235, 77, 120); // babyrose-500
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DayOne - Pediatrician Clinic Visit Summary', 14, 12);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 18);

  // Baby Profile Card
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Patient Identification', 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Baby Name: ${profile.name} (${profile.nickname || 'Princess'})`, 14, 40);
  doc.text(`DOB: ${new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 45);
  doc.text(`Current Age: ${weeks} Weeks, ${remDays} Days (${diffDays} total days)`, 14, 50);
  doc.text(`Blood Group: ${profile.bloodGroup}`, 110, 40);
  doc.text(`Pediatrician: ${profile.pediatricianName}`, 110, 45);
  doc.text(`Emergency Hospital: ${profile.emergencyHospital}`, 110, 50);

  // Growth Trajectory Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Recent Growth Measurements', 14, 62);

  doc.setFillColor(243, 237, 224); // cream-200
  doc.rect(14, 65, 182, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 16, 70);
  doc.text('Age', 50, 70);
  doc.text('Weight (kg)', 80, 70);
  doc.text('Length (cm)', 120, 70);
  doc.text('Head Circ. (cm)', 160, 70);

  doc.setFont('helvetica', 'normal');
  let y = 77;
  const recentGrowth = [...growthRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  recentGrowth.forEach((g) => {
    doc.text(g.date, 16, y);
    doc.text(`Day ${g.ageInDays}`, 50, y);
    doc.text(`${g.weightKg.toFixed(2)} kg`, 80, y);
    doc.text(`${g.lengthCm.toFixed(1)} cm`, 120, y);
    doc.text(`${g.headCircumferenceCm.toFixed(1)} cm`, 160, y);
    y += 6;
  });

  // Vaccination Status
  y += 4;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Immunization Overview (India IAP / UIP)', 14, y);
  y += 6;

  doc.setFillColor(243, 237, 224);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Vaccine Code', 16, y + 5);
  doc.text('Schedule', 50, y + 5);
  doc.text('Category', 90, y + 5);
  doc.text('Status', 130, y + 5);
  doc.text('Date Given / Due', 160, y + 5);

  doc.setFont('helvetica', 'normal');
  y += 11;
  const keyVaccines = vaccines.slice(0, 7);
  keyVaccines.forEach((v) => {
    doc.text(v.code, 16, y);
    doc.text(v.ageDueDisplay, 50, y);
    doc.text(v.category === 'government' ? 'Govt (UIP)' : 'Private (IAP)', 90, y);
    doc.text(v.status.toUpperCase(), 130, y);
    doc.text(v.dateAdministered || v.dueDate.split('T')[0], 160, y);
    y += 5.5;
  });

  // Questions for Pediatrician
  y += 4;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Parents\' Questions for Pediatrician', 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const pendingQuestions = questions.filter(q => !q.isAnswered);
  if (pendingQuestions.length === 0) {
    doc.text('• No pending questions noted for this visit.', 16, y);
    y += 6;
  } else {
    pendingQuestions.forEach((q, idx) => {
      doc.text(`[ ] ${idx + 1}. ${q.question}`, 16, y);
      y += 6;
    });
  }

  // Recent Symptoms
  y += 2;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Recent Symptoms & Temperature Observations', 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (symptoms.length === 0) {
    doc.text('• Baby has been healthy with no fever or acute symptoms recorded.', 16, y);
    y += 6;
  } else {
    symptoms.slice(0, 3).forEach((s) => {
      doc.text(`• ${s.date}: ${s.symptom} (Temp: ${s.temperatureC ? s.temperatureC + '°C' : 'Normal'}) - ${s.notes || ''}`, 16, y);
      y += 5.5;
    });
  }

  // Doctor Notes box at bottom
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, y, 182, 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Pediatrician Advice & Follow-Up Notes:', 16, y + 5);

  // Save the PDF
  doc.save(`DayOne_Clinic_Summary_${profile.name.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`);
}
