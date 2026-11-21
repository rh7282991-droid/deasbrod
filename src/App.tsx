import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// HARDCODED MASTER CONFIGURATION (WORKS ACROSS ALL BROWSERS AUTOMATICALLY)
// ============================================================================
const HARDCODED_MASTER_CONFIG = {
  supabase: {
    url: 'https://rsxxubotacnavyxagilf.supabase.co',
    anonKey: 'sb_publishable_mdGwUhlpN0_G0aIlgRG8PA_NGWhUYd1',
    tableName: 'tutors',
    requestsTableName: 'guardian_requests',
    paymentsTableName: 'payments_ledger',
    settingsTableName: 'app_settings',
  },
  wasender: {
    enabled: true,
    apiUrl: 'https://wasenderapi.com/api/send-message',
    apiKey: '',
    instanceId: '',
  },
  smsGateway: {
    enabled: true,
    provider: 'custom_get',
    apiUrl: 'https://api.greenweb.com.bd/api.php',
    apiKey: '',
    senderId: '',
  },
  sheetUrl:
    'https://docs.google.com/spreadsheets/d/1t5bodkXdU1roUg6P58Z8UFos8-M8BPzsMESVkZuSSxM/edit?usp=sharing',
};

interface Tutor {
  id: number | string;
  name: string;
  gender: string;
  avatar: string;
  presentAddress: string;
  university: string;
  department: string;
  preferredAreas: string[];
  subjects: string[];
  phone: string;
  whatsapp: string;
  classes: string[];
  expectedSalary: number;
  salaryMin: number;
  salaryMax: number;
  hasSalary: boolean;
  salaryRange: string;
  tuitionType: string;
  preferredDays: string;
  educationBackground: string;
  bio: string;
  matchScore?: number;
}

interface TuitionRequest {
  id: number | string;
  code: string;
  studentName: string;
  guardianName: string;
  className: string;
  educationMedium?: string;
  location: string;
  areas: string[];
  preferredVarsity: string;
  preferredDepartment: string;
  preferredGender: string;
  tuitionType: string;
  preferredDays: string;
  schedule: string;
  salary: string;
  salaryBudgetCap: number;
  contact: string;
  notes: string;
  subjects: string[];
}

interface PaymentRecord {
  id: number | string;
  tuitionCode: string;
  tutorName: string;
  tutorPhone: string;
  tutorUniversity: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  studentClass: string;
  educationMedium: string;
  subjects: string;
  area: string;
  joiningDate: string;
  monthlyFee: number;
  commissionPercentage: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentNote: string;
  status: string;
}

interface RequirementsState {
  guardianName: string;
  batchCode: string;
  selectedClass: string;
  selectedEducationMedium: string;
  selectedSubjects: string[];
  preferredGender: string;
  selectedUniversity: string;
  selectedDepartment: string;
  selectedAreas: string[];
  salaryBudgetCap: number;
  tuitionType: string;
  preferredDays: string;
}

// ============================================================================
// SVG ICON COMPONENT
// ============================================================================
const Icon = ({
  name,
  size = 18,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const icons: Record<string, React.ReactNode> = {
    compass: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </>
    ),
    inbox: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    creditCard: (
      <>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    sliders: (
      <>
        <line x1="4" x2="4" y1="21" y2="14" />
        <line x1="4" x2="4" y1="10" y2="3" />
        <line x1="12" x2="12" y1="21" y2="12" />
        <line x1="12" x2="12" y1="8" y2="3" />
        <line x1="20" x2="20" y1="21" y2="16" />
        <line x1="20" x2="20" y1="12" y2="3" />
        <line x1="2" x2="6" y1="14" y2="14" />
        <line x1="10" x2="14" y1="8" y2="8" />
        <line x1="18" x2="22" y1="16" y2="16" />
      </>
    ),
    refresh: (
      <>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </>
    ),
    send: (
      <>
        <line x1="22" x2="11" y1="2" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    mapPin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    graduationCap: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    copy: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </>
    ),
    userPlus: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" x2="19" y1="8" y2="14" />
        <line x1="22" x2="16" y1="11" y2="11" />
      </>
    ),
    chevronLeft: <polyline points="15 18 9 12 15 6" />,
    chevronRight: <polyline points="9 18 15 12 9 6" />,
    messageCircle: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
    bell: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    plus: (
      <>
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
      </>
    ),
    menu: (
      <>
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </>
    ),
    smartphone: (
      <>
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </>
    ),
    tablet: (
      <>
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <line x1="12" x2="12.01" y1="18" y2="18" />
      </>
    ),
    laptop: (
      <>
        <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block flex-shrink-0 ${className}`}
    >
      {icons[name] || icons.compass}
    </svg>
  );
};

// ============================================================================
// PHONE FORMATTER FOR BANGLADESH (+0 AND WASENDER 880 FORMAT)
// ============================================================================
const formatBdPhoneNumbers = (rawPhone: unknown) => {
  if (rawPhone === null || rawPhone === undefined) {
    return { localWithZero: '', wasenderFormat: '', isValid: false };
  }
  const banglaMap: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  let str = String(rawPhone)
    .replace(/[০-৯]/g, (d) => banglaMap[d] || d)
    .trim();

  if (/^\d+(\.\d+)?e\+\d+$/i.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) str = Math.round(num).toString();
  }
  if (str.endsWith('.0')) str = str.slice(0, -2);

  // Extract first valid BD mobile number if cell contains multiple numbers or separators
  const bdMatch = str.replace(/[\s\-()]/g, '').match(/(?:88)?(0?1[3-9]\d{8})/);
  let digits = bdMatch ? bdMatch[1] : str.replace(/\D/g, '');
  if (!digits) {
    return { localWithZero: '', wasenderFormat: '', isValid: false };
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  } else if (digits.length === 13 && digits.startsWith('8801')) {
    digits = '0' + digits.slice(3);
  } else if (!digits.startsWith('0') && digits.startsWith('1') && digits.length >= 9) {
    digits = '0' + digits;
  }

  const localWithZero = digits;
  const wasenderFormat = digits.startsWith('0')
    ? '88' + digits
    : digits.startsWith('880')
    ? digits
    : '880' + digits;

  const isValid = /^01[3-9]\d{8}$/.test(localWithZero);
  return { localWithZero, wasenderFormat, isValid };
};

// Safe Clipboard helper for iframe environments
const copyToClipboardSafe = (text: string) => {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    return false;
  }
};

const ensureArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
      } catch {
        // ignore JSON parse fallback
      }
    }
    return trimmed
      .split(/[,;\n|/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeNumber = (val: unknown, fallback = 0): number => {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (!val) return fallback;
  const str = String(val).replace(/,/g, '');
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : fallback;
};

const convertBanglaDigitsToEnglish = (input: string): string => {
  const banglaDigits: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  return input.replace(/[০-৯]/g, (d) => banglaDigits[d] || d);
};

// Smart Salary Range Parser: handles "3-5,000", "4-7,000", "6-10,000", "5000", "৫-৭ হাজার", etc.
const parseSalaryRangeBounds = (rawRange: unknown, rawExpected = 0) => {
  const str = convertBanglaDigitsToEnglish(String(rawRange || '').trim());
  const lower = str.toLowerCase();
  if (
    !str ||
    lower === 'not provided' ||
    lower === 'nan' ||
    lower === 'negotiable' ||
    lower === 'any'
  ) {
    const exp = Number(rawExpected) || 0;
    if (exp >= 500 && exp !== 7500 && exp !== 36687) {
      return { min: exp, max: exp, hasSalary: true };
    }
    return { min: 0, max: 0, hasSalary: false };
  }

  const cleaned = str.replace(/,/g, '');
  const parts = cleaned.match(/\d+/g);
  if (!parts || parts.length === 0) {
    const exp = Number(rawExpected) || 0;
    if (exp >= 500 && exp !== 7500 && exp !== 36687) {
      return { min: exp, max: exp, hasSalary: true };
    }
    return { min: 0, max: 0, hasSalary: false };
  }

  const nums = parts.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) {
    return { min: 0, max: 0, hasSalary: false };
  }

  if (nums.length >= 2) {
    let first = nums[0];
    let second = nums[1];
    if (first < 100 && second >= 1000) {
      first = first * 1000;
    } else if (second < 100 && first >= 1000) {
      second = second * 1000;
    } else if (first < 100 && second < 100) {
      first *= 1000;
      second *= 1000;
    }
    const minVal = Math.min(first, second);
    const maxVal = Math.max(first, second);
    return {
      min: minVal,
      max: maxVal,
      hasSalary: minVal >= 500,
    };
  }

  let single = nums[0];
  if (single < 100 && /k|হাজার/i.test(cleaned)) {
    single *= 1000;
  } else if (single > 0 && single < 100) {
    single *= 1000;
  }
  return { min: single, max: single, hasSalary: single >= 500 };
};

// Smart Tutor Class Profile Parser & Matcher (operates strictly on tutor.classes without bio noise)
interface TutorClassProfile {
  grades: Set<number>;
  isOLevelALevel: boolean;
  isAdmission: boolean;
  raw: string;
}

const parseTutorClassProfile = (classesList: unknown): TutorClassProfile => {
  const rawItems = Array.isArray(classesList)
    ? classesList
    : typeof classesList === 'string'
    ? [classesList]
    : [];
  const raw = rawItems
    .join(' , ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .trim();
  const grades = new Set<number>();
  let isOLevelALevel = false;
  let isAdmission = false;

  if (
    !raw ||
    raw === 'not specified' ||
    raw === 'science' ||
    raw === 'biology' ||
    raw === 'israt jahan' ||
    raw === 'top class'
  ) {
    return { grades, isOLevelALevel, isAdmission, raw };
  }

  // O/A Level & English Medium detection
  if (
    /\b(o\s*['’\-/]?\s*level|a\s*['’\-/]?\s*level|o\/a|0\s*level|a2\s*level|edexcel|cambridge|english\s*medium|pre[\s\-]*o)/i.test(
      raw
    )
  ) {
    isOLevelALevel = true;
  }

  // Admission detection
  if (/\b(admission|ভার্সিটি|মেডিকেল\s*এডমিশন)\b/i.test(raw)) {
    isAdmission = true;
  }

  // Explicit "All", "Any", "Till HSC", "Play to degree"
  if (/^(all|any\.?)$/i.test(raw) || /\b(till[\s\-]*hsc|play\s*to\s*degree)\b/i.test(raw)) {
    for (let g = 1; g <= 12; g++) grades.add(g);
  }

  let normalized = convertBanglaDigitsToEnglish(raw)
    .replace(/([a-z])(\d)/gi, '$1 $2')
    .replace(/(\d)([a-z])/gi, '$1 $2')
    .replace(/\b(primary\s*level|primary)\b/gi, '1')
    .replace(/\b(class[\s\-]*xii|xii)\b/gi, '12')
    .replace(/\b(class[\s\-]*xi|xi)\b/gi, '11')
    .replace(/\b(twelve|twelfth)\b/gi, '12')
    .replace(/\b(eleven|eleventh)\b/gi, '11')
    .replace(/\bten\b/gi, '10')
    .replace(/\bnine\b/gi, '9')
    .replace(/\beight\b/gi, '8')
    .replace(/\bseven\b/gi, '7')
    .replace(/\bsix\b/gi, '6')
    .replace(/\bfive\b/gi, '5')
    .replace(/\bfour\b/gi, '4')
    .replace(/\bthree\b/gi, '3')
    .replace(/\btwo\b/gi, '2')
    .replace(/\bone\b/gi, '1')
    .replace(
      /\b(play\s*group|playgroup|play|pg|nursery|nersury|kg|kindergarten|pre[\s\-]*school)\b/gi,
      '1'
    )
    .replace(/\bstd[\s\-]*v\b/gi, '5')
    .replace(/\b8th\s*grade\b/gi, '8');

  // Convert "upto class X", "till class X", "under class X" -> "1-X"
  normalized = normalized.replace(
    /\b(?:upto|up\s*to|till|under)\s*(?:class[\s\-]*|std[\s\-]*|standard[\s\-]*)?(\d{1,2})\b/gi,
    '1-$1'
  );
  // Convert "upper than class 7" / "above class 7" -> "8-12"
  normalized = normalized.replace(
    /\b(?:upper\s*than|above)\s*(?:class[\s\-]*|std[\s\-]*|standard[\s\-]*)?(\d{1,2})\b/gi,
    (_, d) => `${Math.min(12, parseInt(d, 10) + 1)}-12`
  );

  // Convert mixed range endpoints like "6 to HSC", "1 to A level", "5 to O level", "Upto O level"
  normalized = normalized
    .replace(
      /\b(\d{1,2})\s*(?:[-–—]|to|theke|থেকে)\s*(?:hsc|hcs|inter|intermediate|enter|a\s*['’\-]?\s*levels?|a2\s*level|as\b)/gi,
      '$1-12'
    )
    .replace(
      /\b(\d{1,2})\s*(?:[-–—]|to|theke|থেকে)\s*(?:ssc|o\s*['’\-]?\s*levels?|pre[\s\-]*o\s*['’\-]?\s*levels?)/gi,
      '$1-10'
    )
    .replace(/\b(?:upto|till)\s*(?:pre[\s\-]*)?o\s*['’\-]?\s*levels?/gi, '1-10');

  const hasHsc1st = /\b(hsc\s*1st|inter\s*1st|1st\s*year)\b/i.test(normalized);
  const hasHsc2nd = /\b(hsc\s*2nd|inter\s*2nd|2nd\s*year|second\s*year)\b/i.test(normalized);
  if (hasHsc1st) grades.add(11);
  if (hasHsc2nd) grades.add(12);

  // General HSC / Intermediate ("enter", "intermediat", "hsc")
  if (
    !hasHsc1st &&
    !hasHsc2nd &&
    /\b(hsc|hcs|inter|intermediate|intermediat|enter)\b/i.test(raw)
  ) {
    grades.add(11);
    grades.add(12);
  }

  // General SSC
  if (/\b(ssc)\b/i.test(raw)) {
    grades.add(9);
    grades.add(10);
  }

  // Ranges like "1-5", "1—10", "3 theke 12", "5 to 10", "1 to12", "03 to 12"
  const rangeRegex =
    /\b(\d{1,2})\s*(?:[-–—/]|to|theke|থেকে)\s*(?:class[\s\-]*|cls[\s\-]*|std[\s\-]*|standard[\s\-]*)?(\d{1,2})\b/gi;
  let match: RegExpExecArray | null;
  while ((match = rangeRegex.exec(normalized)) !== null) {
    let start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (start === 0) start = 1;
    if (start >= 1 && end <= 12 && start <= end) {
      for (let g = start; g <= end; g++) grades.add(g);
    }
  }

  const withoutRanges = normalized
    .replace(rangeRegex, ' ')
    .replace(/\b0\s*levels?\b/gi, ' ')
    .replace(/\b(1st|2nd|3rd|\d+th)\s*year\b/gi, ' ');
  const singleNums = withoutRanges.match(/\b(\d{1,2})\b/g);
  if (singleNums) {
    singleNums.forEach((n) => {
      const val = parseInt(n, 10);
      if (val >= 1 && val <= 12) grades.add(val);
    });
  }

  return { grades, isOLevelALevel, isAdmission, raw };
};

const getTutorClassMatchResult = (
  tutorClasses: unknown,
  selectedClass: string
): { matches: boolean; specificityBonus: number } => {
  if (!selectedClass || selectedClass === 'All Classes') {
    return { matches: true, specificityBonus: 0 };
  }
  const profile = parseTutorClassProfile(tutorClasses);
  const sel = selectedClass.trim();
  const totalGrades = profile.grades.size || 12;

  if (sel === 'O/A Level') {
    return {
      matches: profile.isOLevelALevel,
      specificityBonus: profile.isOLevelALevel ? (profile.grades.size === 0 ? 18 : 14) : 0,
    };
  }
  if (sel === 'Admission') {
    return {
      matches: profile.isAdmission,
      specificityBonus: profile.isAdmission ? (profile.grades.size <= 2 ? 18 : 14) : 0,
    };
  }
  if (sel === 'HSC 1st Year' || sel === 'Class 11') {
    if (!profile.grades.has(11)) return { matches: false, specificityBonus: 0 };
    const isOnly11 = totalGrades === 1 && profile.grades.has(11);
    const isDedicatedHsc = totalGrades <= 2 && !profile.grades.has(9) && !profile.grades.has(10);
    return {
      matches: true,
      specificityBonus: isOnly11 ? 18 : isDedicatedHsc ? 15 : totalGrades <= 4 ? 10 : 5,
    };
  }
  if (sel === 'HSC 2nd Year' || sel === 'Class 12') {
    if (!profile.grades.has(12)) return { matches: false, specificityBonus: 0 };
    const isOnly12 = totalGrades === 1 && profile.grades.has(12);
    const isDedicatedHsc = totalGrades <= 2 && !profile.grades.has(9) && !profile.grades.has(10);
    return {
      matches: true,
      specificityBonus: isOnly12 ? 18 : isDedicatedHsc ? 15 : totalGrades <= 4 ? 10 : 5,
    };
  }
  if (sel === 'Class 11-12 (HSC)') {
    const has11Or12 = profile.grades.has(11) || profile.grades.has(12);
    if (!has11Or12) return { matches: false, specificityBonus: 0 };
    const hasBoth = profile.grades.has(11) && profile.grades.has(12);
    const isDedicated = totalGrades <= 2 && hasBoth;
    return {
      matches: true,
      specificityBonus: isDedicated ? 18 : totalGrades <= 2 ? 15 : totalGrades <= 4 ? 10 : 5,
    };
  }
  if (sel === 'Class 9-10 (SSC)') {
    const has9Or10 = profile.grades.has(9) || profile.grades.has(10);
    if (!has9Or10) return { matches: false, specificityBonus: 0 };
    const isDedicated910 = totalGrades <= 2 && (profile.grades.has(9) || profile.grades.has(10));
    return {
      matches: true,
      specificityBonus: isDedicated910 ? 18 : totalGrades <= 6 ? 12 : 5,
    };
  }
  if (sel === 'Class 1-5') {
    const count = [1, 2, 3, 4, 5].filter((g) => profile.grades.has(g)).length;
    const matches = profile.grades.size === 1 ? count === 1 : count >= 2;
    if (!matches) return { matches: false, specificityBonus: 0 };
    const isExact15 = count === 5 && totalGrades === 5;
    const isDedicated = count >= 4 && totalGrades <= 6;
    return {
      matches: true,
      specificityBonus: isExact15 ? 18 : isDedicated ? 15 : totalGrades <= 8 ? 10 : 5,
    };
  }
  if (sel === 'Class 6-8') {
    const count = [6, 7, 8].filter((g) => profile.grades.has(g)).length;
    const matches = profile.grades.size === 1 ? count === 1 : count >= 2;
    if (!matches) return { matches: false, specificityBonus: 0 };
    const isDedicated68 = !profile.grades.has(1) && !profile.grades.has(11) && totalGrades <= 5;
    return {
      matches: true,
      specificityBonus: isDedicated68 ? 18 : totalGrades <= 6 ? 14 : 8,
    };
  }
  if (sel === 'Class 5-10') {
    const hasMiddle = [5, 6, 7, 8].some((g) => profile.grades.has(g));
    const hasUpper = [9, 10].some((g) => profile.grades.has(g));
    const count = [5, 6, 7, 8, 9, 10].filter((g) => profile.grades.has(g)).length;
    const matches = hasMiddle && hasUpper && count >= 3;
    if (!matches) return { matches: false, specificityBonus: 0 };
    const isExact510 = count === 6 && totalGrades === 6;
    return {
      matches: true,
      specificityBonus: isExact510 ? 18 : totalGrades <= 7 ? 14 : 8,
    };
  }
  if (sel === 'Class 1-10') {
    const hasPrimary = [1, 2, 3, 4].some((g) => profile.grades.has(g));
    const hasHigh = [6, 7, 8, 9, 10].some((g) => profile.grades.has(g));
    const count = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((g) => profile.grades.has(g)).length;
    const matches = hasPrimary && hasHigh && count >= 5;
    if (!matches) return { matches: false, specificityBonus: 0 };
    const isExact110 = count === 10 && totalGrades === 10;
    return {
      matches: true,
      specificityBonus: isExact110 ? 18 : totalGrades <= 10 ? 14 : 8,
    };
  }

  // Individual Class 1..12 or custom class string
  const targetProfile = parseTutorClassProfile([sel]);
  const targetGrades = Array.from(targetProfile.grades);
  if (targetGrades.length === 0 || profile.grades.size === 0) {
    return { matches: false, specificityBonus: 0 };
  }
  const matches = targetGrades.some((g) => profile.grades.has(g));
  const isSingleExact =
    matches && targetGrades.length === 1 && profile.grades.size === 1;
  return {
    matches,
    specificityBonus: !matches ? 0 : isSingleExact ? 18 : totalGrades <= 4 ? 14 : 8,
  };
};

// Extract supported Tuition Types from Tutor's tuitionType field & bio
const parseTutorTuitionTypes = (rawType: unknown, rawBio: unknown): Set<string> => {
  const combined = `${String(rawType || '')} ${String(rawBio || '')}`.toLowerCase();
  const types = new Set<string>();

  if (/\b(online|অনলাইন|zoom|google meet)\b/i.test(combined)) {
    types.add('Online Tuition');
  }
  if (/\b(batch|ব্যাচ|coaching|কোচিং)\b/i.test(combined)) {
    types.add('Batch Tuition');
  }
  if (/\b(home|বাসা|হোম|offline|অফলাইন)\b/i.test(combined)) {
    types.add('Home Tuition');
  }
  // If rawType explicitly says only Online or Batch without Home, don't force Home
  const rawTypeLower = String(rawType || '').toLowerCase().trim();
  if (types.size === 0 || rawTypeLower === 'home' || rawTypeLower === 'home tuition') {
    types.add('Home Tuition');
  }
  return types;
};

// Parse Tutor Education Background / Medium ("Select Your Education Background" / "Your Academic Level": Bangla Medium, English Version, O/A Level)
const parseTutorEducationBackground = (
  rawEduBg: unknown,
  rawClasses: unknown,
  rawBio: unknown,
  rawUni?: unknown,
  rawDept?: unknown
): {
  displayLabel: string;
  hasExplicitBangla: boolean;
  hasExplicitEnglishVersion: boolean;
  hasExplicitEnglishMedium: boolean;
  hasExplicitMadrasa: boolean;
  isExclusivelyEnglishMedium: boolean;
} => {
  const eduStr = String(rawEduBg || '').trim();
  const classesStr = Array.isArray(rawClasses)
    ? rawClasses.join(' , ')
    : String(rawClasses || '');
  const bioStr = String(rawBio || '');
  const uniDeptStr = `${String(rawUni || '')} ${String(rawDept || '')}`;
  const combined = `${eduStr} ${classesStr} ${bioStr}`.toLowerCase();

  const hasExplicitBangla =
    /\b(bangla\s*medium|bangla\s*version|bengali\s*medium|bengali\s*version|বাংলা\s*মিডিয়াম|বাংলা\s*মিডিয়াম|বাংলা\s*ভার্সন|bm\b|bv\b)/i.test(
      combined
    ) || /^bangla$/i.test(eduStr);

  const hasExplicitEnglishVersion =
    /\b(english\s*version|enlish\s*version|eng\s*version|e\.?\s*v\.?\b|ইংলিশ\s*ভার্সন|ইংরেজি\s*ভার্সন|english\s+bangla\s+version|bangla\s*(?:&|and)\s*english\s*version)/i.test(
      combined
    );

  const hasExplicitEnglishMedium =
    /\b(english\s*medium|eng\s*medium|e\.?\s*m\.?\b|ইংলিশ\s*মিডিয়াম|ইংলিশ\s*মিডিয়াম|ইংরেজি\s*মিডিয়াম|o\s*['’\-/]?\s*levels?|a\s*['’\-/]?\s*levels?|o\/a|0\s*levels?|a2\s*levels?|edexcel|cambridge|pre[\s\-]*o|standard\s*[1-9]|std[\s\-]*[1-9v])/i.test(
      combined
    );

  const hasExplicitMadrasa =
    /\b(madrasa|madrasah|dakhil|alim|fazil|kamil|মাদ্রাসা|দাখিল|আলিম|ফাজিল|কামিল|আলিয়া|কওমি)/i.test(
      `${combined} ${uniDeptStr.toLowerCase()}`
    );

  // Check if tutor is exclusively O/A Level (English Medium) with no regular Bangla/NCTB classes
  const classProfile = parseTutorClassProfile(rawClasses);
  const isExclusivelyEnglishMedium =
    hasExplicitEnglishMedium &&
    !hasExplicitBangla &&
    !hasExplicitEnglishVersion &&
    classProfile.grades.size === 0;

  let displayLabel = '';
  if (
    eduStr &&
    eduStr.toLowerCase() !== 'nan' &&
    eduStr.toLowerCase() !== 'not specified' &&
    eduStr.toLowerCase() !== 'not provided'
  ) {
    // Normalize exact value from CSV / Supabase ("Enlish Version" -> "English Version", "Bangla Medium", "O/A Level")
    const eduLower = eduStr.toLowerCase();
    if (eduLower.includes('enlish version') || eduLower.includes('english version')) {
      displayLabel = 'English Version';
    } else if (eduLower.includes('o/a level') || eduLower.includes('english medium')) {
      displayLabel = 'O/A Level (English Medium)';
    } else if (eduLower.includes('bangla medium')) {
      displayLabel = 'Bangla Medium';
    } else if (eduLower.includes('bangla version')) {
      displayLabel = 'Bangla Version';
    } else if (eduLower.includes('madrasa')) {
      displayLabel = 'Madrasa Medium';
    } else {
      displayLabel = eduStr;
    }
  } else {
    displayLabel = '';
  }

  return {
    displayLabel,
    hasExplicitBangla,
    hasExplicitEnglishVersion,
    hasExplicitEnglishMedium,
    hasExplicitMadrasa,
    isExclusivelyEnglishMedium,
  };
};

const getTutorEducationMediumMatch = (
  tutor: Tutor,
  selectedMedium: string
): { matches: boolean; bonus: number } => {
  if (!selectedMedium || selectedMedium === 'Any' || selectedMedium === 'All Mediums') {
    return { matches: true, bonus: 0 };
  }
  const info = parseTutorEducationBackground(
    tutor.educationBackground,
    tutor.classes,
    tutor.bio,
    tutor.university,
    tutor.department
  );

  if (selectedMedium === 'English Version') {
    return {
      matches: info.hasExplicitEnglishVersion,
      bonus: info.hasExplicitEnglishVersion ? 18 : 0,
    };
  }
  if (selectedMedium === 'English Medium' || selectedMedium === 'O/A Level') {
    return {
      matches: info.hasExplicitEnglishMedium,
      bonus: info.hasExplicitEnglishMedium ? 18 : 0,
    };
  }
  if (selectedMedium === 'Madrasa Medium') {
    return {
      matches: info.hasExplicitMadrasa,
      bonus: info.hasExplicitMadrasa ? 18 : 0,
    };
  }
  if (selectedMedium === 'Bangla Version' || selectedMedium === 'Bangla Medium') {
    // Only match tutors who actually have Bangla Medium / Bangla Version in their record or classes
    return {
      matches: info.hasExplicitBangla,
      bonus: info.hasExplicitBangla ? 18 : 0,
    };
  }

  // Custom medium string fallback
  const target = selectedMedium.toLowerCase().trim();
  const hay = `${tutor.educationBackground || ''} ${(tutor.classes || []).join(' ')} ${
    tutor.bio || ''
  }`.toLowerCase();
  const matches = hay.includes(target);
  return { matches, bonus: matches ? 12 : 0 };
};

// Extract explicit Preferred Days per week from Tutor's availability/preferredDays field & bio
const parseTutorPreferredDays = (rawAvail: unknown, rawBio: unknown): Set<number> => {
  const combined = convertBanglaDigitsToEnglish(
    `${String(rawAvail || '')} ${String(rawBio || '')}`.toLowerCase()
  );
  const days = new Set<number>();

  // Match patterns like "3 days", "4 din", "3-4 days", "3/4 days", "weekly 4 din", "সপ্তাহে ৩ দিন"
  const rangeRegex = /\b([1-7])\s*(?:[-–/]|to|বা|থেকে)\s*([1-7])\s*(?:days?|din|দিন)/gi;
  let m: RegExpExecArray | null;
  while ((m = rangeRegex.exec(combined)) !== null) {
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    for (let d = Math.min(start, end); d <= Math.max(start, end); d++) {
      days.add(d);
    }
  }

  const singleDayRegex1 = /\b([1-7])\s*(?:days?\s*\/?\s*week|days?|din|দিন)\b/gi;
  while ((m = singleDayRegex1.exec(combined)) !== null) {
    days.add(parseInt(m[1], 10));
  }

  const singleDayRegex2 = /\b(?:weekly|সপ্তাহে)\s*([1-7])\s*(?:days?|din|দিন)?\b/gi;
  while ((m = singleDayRegex2.exec(combined)) !== null) {
    days.add(parseInt(m[1], 10));
  }

  return days;
};

// Infer Tutor Subjects from Department, Class Level, and Bio when explicit subjects list is empty
const inferSubjectsForTutor = (
  rawSubjects: unknown,
  department: unknown,
  classes: unknown,
  bio: unknown
): string[] => {
  const explicit = ensureArray(rawSubjects);
  if (explicit.length > 0) return explicit;

  const text = `${String(department || '')} ${ensureArray(classes).join(' ')} ${String(
    bio || ''
  )}`.toLowerCase();
  const out = new Set<string>();

  if (/\b(accounting|একউন্টিং|হিসাববিজ্ঞান|ais|acca)\b/i.test(text)) {
    out.add('Accounting');
    out.add('Finance & Banking');
    out.add('Business Studies');
  }
  if (/\b(finance|banking|ফিন্যান্স)\b/i.test(text)) {
    out.add('Finance & Banking');
    out.add('Accounting');
    out.add('Economics');
  }
  if (/\b(economics|economic|অর্থনীতি)\b/i.test(text)) {
    out.add('Economics');
    out.add('General Math');
    out.add('English');
  }
  if (/\b(bba|mba|management|marketing|hrm|business|commerce)\b/i.test(text)) {
    out.add('Accounting');
    out.add('Business Studies');
    out.add('Finance & Banking');
    out.add('English');
    out.add('General Math');
  }
  if (/\b(cse|software|computer|it|ice|ict)\b/i.test(text)) {
    out.add('ICT');
    out.add('Higher Math');
    out.add('General Math');
    out.add('Physics');
  }
  if (
    /\b(eee|electrical|mechanical|civil|chemical|textile|apparel|engineering|kuet|buet|ruet|cuet|aust|butex)\b/i.test(
      text
    )
  ) {
    out.add('Physics');
    out.add('Higher Math');
    out.add('General Math');
    out.add('Chemistry');
    out.add('ICT');
  }
  if (/\b(physics|পদার্থ)\b/i.test(text)) {
    out.add('Physics');
    out.add('Higher Math');
    out.add('General Math');
    out.add('ICT');
  }
  if (/\b(chemistry|রসায়ন)\b/i.test(text)) {
    out.add('Chemistry');
    out.add('Physics');
    out.add('Biology');
    out.add('General Science');
  }
  if (/\b(math|mathematics|গণিত|statistics|পরিসংখ্যান)\b/i.test(text)) {
    out.add('Higher Math');
    out.add('General Math');
    out.add('Physics');
    out.add('ICT');
  }
  if (
    /\b(mbbs|medical|bds|dental|pharmacy|microbiology|biochemistry|biotechnology|botany|zoology|biology|bio|nursing|soil|agriculture|bsag|environmental|psychology)\b/i.test(
      text
    )
  ) {
    out.add('Biology');
    out.add('Chemistry');
    out.add('General Science');
    out.add('English');
  }
  if (/\b(english|ইংরেজি)\b/i.test(text)) {
    out.add('English');
    out.add('Bangla');
    out.add('All Subjects (Class 1-8)');
  }
  if (
    /\b(bangla|বাংলা|political|anthropology|sociology|history|islamic|law|japanese|journalism|msj|social|bss|ba\b)\b/i.test(
      text
    )
  ) {
    out.add('Bangla');
    out.add('English');
    out.add('Social Science');
    out.add('ICT');
  }
  if (/\b(science|bsc|b\.sc)\b/i.test(text) && out.size === 0) {
    out.add('General Science');
    out.add('General Math');
    out.add('Physics');
    out.add('Chemistry');
    out.add('Biology');
  }
  if (out.size === 0) {
    out.add('English');
    out.add('General Math');
    out.add('Bangla');
    out.add('General Science');
    out.add('ICT');
  }
  return Array.from(out);
};

// Clean Broken Mixed Bangla-English Names & Generate Clean Avatar URL
const cleanTutorName = (rawName: unknown): string => {
  if (!rawName) return 'Unnamed Tutor';
  let s = String(rawName).trim();
  if (/^https?:\/\/(www\.)?facebook\.com\//i.test(s)) {
    const slug = s
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
      .split(/[/?#]/)[0]
      .replace(/[._-]+/g, ' ')
      .trim();
    if (slug) s = slug;
  }
  s = s.replace(/Tanjিনা/gi, 'তানজিনা');
  s = s.replace(/Tanjina\s+আক্তার/gi, 'তানজিনা আক্তার');
  s = s.replace(/^[\u09BE-\u09CC\u09D7]+/, '');
  return s.trim() || 'Unnamed Tutor';
};

// Canonical Area Dictionary (merges spelling variations, case differences, and Bangla/English duplicates)
const CANONICAL_AREA_MAP: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'Dhanmondi', aliases: ['dhanmondi', 'danmondi', 'dhanmondhi', 'ধানমন্ডি', 'ধানমণ্ডি'] },
  { canonical: 'Azimpur', aliases: ['azimpur', 'ajimpur', 'azimour', 'ajimpor', 'azimupur', 'আজিমপুর'] },
  {
    canonical: 'Mohammadpur',
    aliases: ['mohammadpur', 'muhammadpur', 'mohammodpur', 'mohamad pur', 'mohommudpur', 'মোহাম্মদপুর'],
  },
  { canonical: 'Lalbagh', aliases: ['lalbagh', 'lalbag', 'লালবাগ'] },
  { canonical: 'Hazaribagh', aliases: ['hazaribagh', 'hazaribag', 'হাজারীবাগ', 'হাজারিবাগ'] },
  {
    canonical: 'Zigatola',
    aliases: ['zigatola', 'jigatola', 'zigatala', 'jigatala', 'zigata', 'জিগাতলা'],
  },
  { canonical: 'Kalabagan', aliases: ['kalabagan', 'kolabagan', 'kolabagam', 'কলাবাগান'] },
  {
    canonical: 'BDR / Pilkhana',
    aliases: ['bdr', 'bdr gate', 'pilkhana', 'বিডিআর', 'বিডিয়ার', 'পিলখানা'],
  },
  { canonical: 'New Market', aliases: ['new market', 'newmarket', 'নিউমার্কেট', 'নিউ মার্কেট'] },
  { canonical: 'Nilkhet', aliases: ['nilkhet', 'নীলক্ষেত'] },
  { canonical: 'Shahbagh', aliases: ['shahbagh', 'shahbag', 'শাহবাগ'] },
  { canonical: 'Farmgate', aliases: ['farmgate', 'framgate', 'ফার্মগেট'] },
  {
    canonical: 'Panthapath',
    aliases: ['panthapath', 'panthpath', 'panthapat', 'panthopoth', 'pantopath', 'pathapath', 'পান্থপথ'],
  },
  { canonical: 'Green Road', aliases: ['green road', 'greenroad', 'গ্রিন রোড', 'গ্রীন রোড'] },
  { canonical: 'Shankar', aliases: ['shankar', 'sankar', 'শংকর'] },
  { canonical: 'Rayerbazar', aliases: ['rayerbazar', 'rayer bazar', 'রায়েরবাজার'] },
  { canonical: 'Rayerbag', aliases: ['rayerbag', 'rayerbagh', 'রায়েরবাগ'] },
  {
    canonical: 'Shyamoli',
    aliases: ['shyamoli', 'shaymoli', 'shamoli', 'shemoli', 'শ্যামলী'],
  },
  { canonical: 'Adabor', aliases: ['adabor', 'adabar', 'আদাবর'] },
  { canonical: 'Mirpur', aliases: ['mirpur', 'মিরপুর'] },
  { canonical: 'Pallabi', aliases: ['pallabi', 'পল্লবী'] },
  { canonical: 'Kazipara', aliases: ['kazipara', 'কাজীপাড়া'] },
  { canonical: 'Shewrapara', aliases: ['shewrapara', 'shrewpara', 'শেওড়াপাড়া'] },
  { canonical: 'Agargaon', aliases: ['agargaon', 'আগারগাঁও'] },
  { canonical: 'Uttara', aliases: ['uttara', 'উত্তরা'] },
  { canonical: 'Badda', aliases: ['badda', 'middle badda', 'বাড্ডা'] },
  { canonical: 'Aftabnagar', aliases: ['aftabnagar', 'aftab nagar', 'আফতাবনগর'] },
  { canonical: 'Gulshan', aliases: ['gulshan', 'গুলশান'] },
  { canonical: 'Banani', aliases: ['banani', 'বনানী'] },
  { canonical: 'Baridhara', aliases: ['baridhara', 'বারিধারা'] },
  { canonical: 'Niketan', aliases: ['niketan', 'niketon', 'নিকেতন'] },
  { canonical: 'Nikunja', aliases: ['nikunja', 'nikunjo', 'নিকুঞ্জ'] },
  { canonical: 'Khilkhet', aliases: ['khilkhet', 'khilket', 'khillkhit', 'খিলক্ষেত'] },
  { canonical: 'Kuril', aliases: ['kuril', 'কুড়িল'] },
  { canonical: 'Nadda', aliases: ['nadda', 'nodda', 'norda', 'নদ্দা'] },
  { canonical: 'Natun Bazar', aliases: ['natun bazar', 'notun bazar', 'natonbazar', 'নতুন বাজার'] },
  { canonical: 'Vatara', aliases: ['vatara', 'bhatara', 'ভাটারা'] },
  {
    canonical: 'Bashundhara',
    aliases: ['bashundhara', 'basundhara', 'bashundhara ra', 'basundhara r', 'বসুন্ধরা'],
  },
  {
    canonical: 'Motijheel',
    aliases: ['motijheel', 'motijhil', 'motizheel', 'mothijeel', 'motizil', 'motojheel', 'মতিঝিল'],
  },
  {
    canonical: 'Khilgaon',
    aliases: ['khilgaon', 'khilgao', 'khilgoan', 'khilgon', 'খিলগাঁও'],
  },
  { canonical: 'Malibagh', aliases: ['malibagh', 'malibag', 'মালিবাগ'] },
  { canonical: 'Mouchak', aliases: ['mouchak', 'মৌচাক'] },
  { canonical: 'Siddheswari', aliases: ['siddheswari', 'siddeshwari', 'siddhswari', 'সিদ্ধেশ্বরী'] },
  { canonical: 'Shantibagh', aliases: ['shantibagh', 'shantibag', 'শান্তিবাগ'] },
  { canonical: 'Rampura', aliases: ['rampura', 'রামপুরা'] },
  {
    canonical: 'Banasree',
    aliases: ['banasree', 'banashree', 'bonosree', 'bonorsree', 'bonsree', 'south banasree', 'বনশ্রী'],
  },
  {
    canonical: 'Mogbazar',
    aliases: ['mogbazar', 'moghbazar', 'magbazar', 'mohbazar', 'মগবাজার'],
  },
  { canonical: 'Eskaton', aliases: ['eskaton', 'ইস্কাটন'] },
  { canonical: 'Bailey Road', aliases: ['bailey road', 'baily road', 'বেইলি রোড'] },
  {
    canonical: 'Shantinagar',
    aliases: ['shantinagar', 'shantinogor', 'santinagar', 'shantinagor', 'shantignar', 'শান্তিনগর'],
  },
  { canonical: 'Kakrail', aliases: ['kakrail', 'কাকরাইল'] },
  { canonical: 'Fakirapool', aliases: ['fakirapool', 'ফকিরাপুল'] },
  { canonical: 'Dilkusha', aliases: ['dilkusha', 'দিলকুশা'] },
  { canonical: 'Wari', aliases: ['wari', 'ওয়ারী', 'ওয়ারী', 'ওয়ারি'] },
  {
    canonical: 'Tikatuli',
    aliases: ['tikatuli', 'tikatuly', 'tikatoli', 'tikatuky', 'টিকাটুলি'],
  },
  { canonical: 'Gopibagh', aliases: ['gopibagh', 'gopibag', 'গোপীবাগ'] },
  { canonical: 'Golapbagh', aliases: ['golapbagh', 'golapbag', 'গোলাপবাগ'] },
  { canonical: 'Maniknagar', aliases: ['maniknagar', 'মানিকনগর'] },
  { canonical: 'Goran', aliases: ['goran', 'গোড়ান'] },
  { canonical: 'Shahjahanpur', aliases: ['shahjahanpur', 'shajahanpu', 'শাহজাহানপুর'] },
  { canonical: 'Sabujbagh', aliases: ['sabujbagh', 'sobujbagh', 'সবুজবাগ'] },
  {
    canonical: 'Puran Dhaka',
    aliases: ['puran dhaka', 'old dhaka', 'old town', 'all puran dhaka', 'পুরান ঢাকা'],
  },
  { canonical: 'Sutrapur', aliases: ['sutrapur', 'sutraphur', 'সূত্রাপুর'] },
  {
    canonical: 'Bangshal',
    aliases: ['bangshal', 'bongshal', 'banshal', 'bogsal', 'বংশাল'],
  },
  { canonical: 'Nazira Bazar', aliases: ['nazira bazar', 'nazirabazar', 'নাজিরাবাজার'] },
  { canonical: 'Bakshi Bazar', aliases: ['bakshi bazar', 'bakshibazar', 'bokshi bazar', 'boxibazar', 'বকশীবাজার'] },
  { canonical: 'Chankharpool', aliases: ['chankharpool', 'chankharpul', 'চাঁনখারপুল'] },
  { canonical: 'Chawkbazar', aliases: ['chawkbazar', 'chawk bazar', 'chowkbazar', 'চকবাজার'] },
  { canonical: 'Armanitola', aliases: ['armanitola', 'আরমানিটোলা'] },
  { canonical: 'Babu Bazar', aliases: ['babu bazar', 'babubazar', 'বাবুবাজার'] },
  { canonical: 'Begum Bazar', aliases: ['begum bazar', 'বেগম বাজার'] },
  { canonical: 'Islampur', aliases: ['islampur', 'ইসলামপুর'] },
  { canonical: 'Sadarghat', aliases: ['sadarghat', 'sodorghat', 'সদরঘাট'] },
  { canonical: 'Tanti Bazar', aliases: ['tanti bazar', 'tati bazaar', 'tatibazar', 'tatibajar', 'তাঁতীবাজার'] },
  { canonical: 'Shakhari Bazar', aliases: ['shakhari bazar', 'sakhari bazzar', 'শাঁখারীবাজার'] },
  { canonical: 'Laxmibazar', aliases: ['laxmibazar', 'laxibazar', 'luxmibazaar', 'লক্ষ্মীবাজার'] },
  { canonical: 'Gandaria', aliases: ['gandaria', 'ganderia', 'gendaria', 'গেন্ডারিয়া'] },
  { canonical: 'Narinda', aliases: ['narinda', 'নারিন্দা'] },
  { canonical: 'Nawabpur', aliases: ['nawabpur', 'nababpur', 'nobabpur', 'নবাবপুর'] },
  { canonical: 'Naya Bazar', aliases: ['naya bazar', 'noyabazar', 'noyabajar', 'নয়াবাজার'] },
  { canonical: 'Nazimuddin Road', aliases: ['nazimuddin road', 'najimuddin road', 'nazimuddin raod', 'নাজিমউদ্দিন রোড'] },
  { canonical: 'Siddik Bazar', aliases: ['siddik bazar', 'siddiq bazer', 'সিদ্দিক বাজার'] },
  { canonical: 'Mahuttuli', aliases: ['mahuttuli', 'mahuttuly', 'mohotuuli', 'মাহুতটুলী'] },
  { canonical: 'Kosaituli', aliases: ['kosaituli', 'kosaituly', 'কসাইটুলী'] },
  {
    canonical: 'Satrauza',
    aliases: ['satrauza', 'satrouja', 'satroja', 'satrowza', 'shatrawza', 'shatrowja', 'সতরওজা'],
  },
  { canonical: 'Dayaganj', aliases: ['dayaganj', 'doigonj', 'দয়াগঞ্জ'] },
  { canonical: 'Dolaipar', aliases: ['dolaipar', 'দোলাইপাড়'] },
  { canonical: 'Sayedabad', aliases: ['sayedabad', 'saydabad', 'সায়দাবাদ'] },
  {
    canonical: 'Jatrabari',
    aliases: ['jatrabari', 'jatrabarir', 'যাত্রাবাড়ী', 'যাত্রাবাড়ী'],
  },
  { canonical: 'Shanir Akhra', aliases: ['shanir akhra', 'shonirakhra', 'sonirakhra', 'শনির আখরা'] },
  { canonical: 'Signboard', aliases: ['signboard', 'sign board', 'সাইনবোর্ডে', 'সাইনবোর্ড'] },
  { canonical: 'Matuail', aliases: ['matuail', 'মাতুয়াইল'] },
  { canonical: 'Kadamtali', aliases: ['kadamtali', 'kodomtola', 'কদমতলী'] },
  { canonical: 'Dania', aliases: ['dania', 'দনিয়া'] },
  { canonical: 'Demra', aliases: ['demra', 'ডেমরা'] },
  { canonical: 'Mugda', aliases: ['mugda', 'mughda', 'মুগদা'] },
  { canonical: 'Basabo', aliases: ['basabo', 'bashabo', 'basbo', 'basahbo', 'বাসাবো'] },
  { canonical: 'Paltan', aliases: ['paltan', 'palton', 'polton', 'new paltan', 'naya paltan', 'nayapaltan', 'পল্টন'] },
  { canonical: 'Gulistan', aliases: ['gulistan', 'গুলিস্তান'] },
  { canonical: 'Kamalapur', aliases: ['kamalapur', 'komlapur', 'kamalapu', 'কমলাপুর'] },
  { canonical: 'Tejgaon', aliases: ['tejgaon', 'তেজগাঁও'] },
  { canonical: 'Tejkunipara', aliases: ['tejkunipara', 'তেজকুনিপাড়া'] },
  { canonical: 'Nakhalpara', aliases: ['nakhalpara', 'নাখালপাড়া'] },
  { canonical: 'Mohakhali', aliases: ['mohakhali', 'মহাখালী'] },
  { canonical: 'Karwan Bazar', aliases: ['karwan bazar', 'karwanbazar', 'কারওয়ান বাজার'] },
  { canonical: 'Banglamotor', aliases: ['banglamotor', 'bangla motor', 'বাংলামোটর'] },
  { canonical: 'Hatirpool', aliases: ['hatirpool', 'হাতিরপুল'] },
  { canonical: 'Hatirjheel', aliases: ['hatirjheel', 'hatir jheel', 'হাতিরঝিল'] },
  { canonical: 'Paribagh', aliases: ['paribagh', 'poribagh', 'paribag', 'পরিবাগ'] },
  { canonical: 'Elephant Road', aliases: ['elephant road', 'elephantroad', 'এলিফ্যান্ট রোড'] },
  { canonical: 'Science Lab', aliases: ['science lab', 'সাইন্সল্যাব'] },
  { canonical: 'Katabon', aliases: ['katabon', 'কাঁটাবন'] },
  { canonical: 'Kathalbagan', aliases: ['kathalbagan', 'কাঁঠালবাগান'] },
  { canonical: 'Rajabazar', aliases: ['rajabazar', 'raja bazar', 'রাজারবাজার', 'রাজাবাজার'] },
  { canonical: 'Indira Road', aliases: ['indira road', 'ইন্দিরা রোড'] },
  { canonical: 'Monipuripara', aliases: ['monipuripara', 'monipuri para', 'moniporipara', 'মনিপুরীপাড়া'] },
  { canonical: 'Bijoy Sarani', aliases: ['bijoy sarani', 'bijoy soroni', 'বিজয় সরণি'] },
  { canonical: 'Asad Gate', aliases: ['asad gate', 'আসাদ গেট'] },
  { canonical: 'Lalmatia', aliases: ['lalmatia', 'lalmatiya', 'লালমাটিয়া'] },
  { canonical: 'Sobhanbagh', aliases: ['sobhanbagh', 'sobhanbag', 'সোবহানবাগ'] },
  { canonical: 'Shekhertek', aliases: ['shekhertek', 'শেখেরটেক'] },
  { canonical: 'Dhaka Uddan', aliases: ['dhaka uddan', 'ঢাকা উদ্যান'] },
  { canonical: 'Bosila', aliases: ['bosila', 'boshila', 'bolisa', 'বসিলা'] },
  { canonical: 'Shukrabad', aliases: ['shukrabad', 'sukrabad', 'শুক্রাবাদ'] },
  { canonical: 'Palashi', aliases: ['palashi', 'polashi', 'পলাশী'] },
  { canonical: 'Ramna', aliases: ['ramna', 'রমনা'] },
  { canonical: 'Cantonment', aliases: ['cantonment', 'ক্যান্টনমেন্ট'] },
  { canonical: 'Savar', aliases: ['savar', 'সাভার'] },
  { canonical: 'Keraniganj', aliases: ['keraniganj', 'keranigonj', 'কেরানীগঞ্জ'] },
  { canonical: 'Kamrangirchar', aliases: ['kamrangirchar', 'kamrangichor', 'কামরাঙ্গীরচর'] },
];

const toTitleCase = (str: string): string => {
  return str.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
};

// Extract all matching canonical areas from a raw string (even if multiple areas are written together without commas)
const extractCanonicalAreasFromPhrase = (phrase: string): string[] => {
  let s = phrase
    .replace(/[()[\]{}"'’‘]/g, ' ')
    .replace(/^[\s,.\-–]+|[\s,.\-–]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!s) return [];
  const lower = s.toLowerCase();
  if (
    lower === 'nan' ||
    lower === 'not specified' ||
    lower === 'dhaka' ||
    lower === 'dhaka city' ||
    lower === 'ঢাকা' ||
    lower === 'any' ||
    lower === 'anywhere' ||
    lower === 'anywhere nearby' ||
    lower === 'almost anywhere in dhaka'
  ) {
    return [];
  }

  // 1. Check exact alias match first
  for (const entry of CANONICAL_AREA_MAP) {
    if (entry.canonical.toLowerCase() === lower || entry.aliases.includes(lower)) {
      return [entry.canonical];
    }
  }

  // 2. Scan for any known area aliases inside the phrase (handles "Dhanmondi gulshan banani", "Wari tikatuli narinda", etc.)
  const matchedCanonicals: string[] = [];
  for (const entry of CANONICAL_AREA_MAP) {
    for (const alias of entry.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = /[\u0980-\u09FF]/.test(alias)
        ? new RegExp(escaped, 'i')
        : new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');
      if (regex.test(lower)) {
        if (!matchedCanonicals.includes(entry.canonical)) {
          matchedCanonicals.push(entry.canonical);
        }
        break;
      }
    }
  }

  if (matchedCanonicals.length > 0) {
    return matchedCanonicals;
  }

  // 3. Fallback: strip common filler words like "area", "etc", "near", "around"
  const stripped = s
    .replace(/\b(?:whole\s+area|area|etc|nearby|near|around|arround|inside|only|and|or)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!stripped || stripped.length < 2) return [];

  for (const entry of CANONICAL_AREA_MAP) {
    if (
      entry.canonical.toLowerCase() === stripped.toLowerCase() ||
      entry.aliases.includes(stripped.toLowerCase())
    ) {
      return [entry.canonical];
    }
  }

  if (/^[a-zA-Z\s.\-/]+$/.test(stripped)) {
    return [toTitleCase(stripped.toLowerCase())];
  }
  return [stripped];
};

const normalizeSingleAreaToken = (token: string): string => {
  const extracted = extractCanonicalAreasFromPhrase(token);
  return extracted[0] || '';
};

// Remove all numbers (English & Bangla digits) and house/flat/road number fragments from addresses
const cleanAddressText = (raw: unknown): string => {
  if (!raw) return '';
  let s = String(raw).trim();
  if (!s || s.toLowerCase() === 'nan' || s.toLowerCase() === 'not specified') return '';
  s = s.replace(
    /\b(?:flat|house|holding|plot|apt|room|floor)\s*(?:no\.?|#|:|-)?\s*[0-9\u09E6-\u09EF]+[a-zA-Z]?\b/gi,
    ' '
  );
  s = s.replace(/\b[0-9\u09E6-\u09EF]+\s*(?:\/\s*[0-9\u09E6-\u09EFa-zA-Z]+)+\b/g, ' ');
  s = s.replace(/\b[0-9\u09E6-\u09EF]+\s*(?:no\.?|নং|st|nd|rd|th)\b/gi, ' ');
  s = s.replace(/\b[0-9\u09E6-\u09EF]+[a-zA-Z]\b/g, ' ');
  s = s.replace(/[0-9\u09E6-\u09EF]+/g, ' ');
  s = s.replace(/[\/#:()’‘]+/g, ' ');
  s = s.replace(/\s*,\s*/g, ', ');
  s = s.replace(/(,\s*){2,}/g, ', ');
  s = s.replace(/^[\s,.\-–]+|[\s,.\-–]+$/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();

  const parts = s
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const uniqueParts: string[] = [];
  for (const part of parts) {
    const extracted = extractCanonicalAreasFromPhrase(part);
    const items =
      extracted.length > 0
        ? extracted
        : [part.toLowerCase() === 'dhaka' ? 'Dhaka' : toTitleCase(part.toLowerCase())];
    for (const norm of items) {
      const key = norm.toLowerCase();
      if (norm && !seen.has(key)) {
        seen.add(key);
        uniqueParts.push(norm);
      }
    }
  }
  return uniqueParts.join(', ');
};

const cleanAreasList = (raw: unknown): string[] => {
  const arr = ensureArray(raw);
  const seenKeys = new Set<string>();
  const result: string[] = [];

  for (const item of arr) {
    const subChunks = String(item || '')
      .split(/[,;|•/]+|\s+-\s+|\s+&\s+|\s+and\s+|\s+or\s+|\.\s+/i)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const chunk of subChunks) {
      const cleanedChunk = chunk
        .replace(/[0-9\u09E6-\u09EF]+/g, ' ')
        .replace(/[\/#:()’‘]+/g, ' ')
        .trim();
      const extractedList = extractCanonicalAreasFromPhrase(cleanedChunk);
      for (const areaName of extractedList) {
        const key = areaName.toLowerCase();
        if (areaName && areaName.length >= 2 && !seenKeys.has(key)) {
          seenKeys.add(key);
          result.push(areaName);
        }
      }
    }
  }

  return result;
};

const getCleanAvatarUrl = (name: string): string => {
  const cleaned = cleanTutorName(name);
  const words = cleaned.split(/\s+/).filter(Boolean);
  let initials = 'TU';
  const asciiLetters = cleaned.match(/[A-Za-z]+/g);
  if (asciiLetters && asciiLetters.join('').length >= 2 && !/[\u0980-\u09FF]/.test(cleaned)) {
    if (asciiLetters.length >= 2) {
      initials = (asciiLetters[0][0] + asciiLetters[1][0]).toUpperCase();
    } else {
      initials = asciiLetters[0].slice(0, 2).toUpperCase();
    }
  } else {
    const banglaChars = words
      .map((w) => {
        const m = w.match(/[\u0985-\u09B9A-Za-z]/);
        return m ? m[0] : '';
      })
      .filter(Boolean);
    initials = banglaChars.slice(0, 2).join('') || 'T';
  }

  const colorPalette = [
    { bg: 'a7f3d0', text: '065f46' },
    { bg: 'ddd6fe', text: '4c1d95' },
    { bg: 'fecdd3', text: '881337' },
    { bg: 'bae6fd', text: '0c4a6e' },
    { bg: 'fde68a', text: '78350f' },
    { bg: 'fbcfe8', text: '831843' },
    { bg: 'c7d2fe', text: '1e1b4b' },
    { bg: '99f6e4', text: '134e4a' },
    { bg: 'fed7aa', text: '7c2d12' },
    { bg: 'd9f99d', text: '365314' },
    { bg: 'e9d5ff', text: '581c87' },
    { bg: 'bfdbfe', text: '1e3a8a' },
  ];

  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = colorPalette[Math.abs(hash) % colorPalette.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=${palette.bg}&color=${palette.text}&size=200&bold=true&length=2`;
};

// Fix Excel date conversion & Filter out invalid numbers like 37115 in Class Level
const normalizeClassString = (raw: unknown): string[] => {
  if (!raw) return [];
  const items = Array.isArray(raw) ? raw : String(raw).split(/[,;\n|]+/);
  const monthMap: Record<string, string> = {
    jan: '1',
    feb: '2',
    mar: '3',
    apr: '4',
    may: '5',
    jun: '6',
    jul: '7',
    aug: '8',
    sep: '9',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const validClasses: string[] = [];
  for (const item of items) {
    const s = String(item || '').trim();
    if (
      !s ||
      s.toLowerCase() === 'nan' ||
      s.toLowerCase() === 'not provided' ||
      s.toLowerCase() === 'not specified' ||
      s.toLowerCase() === 'none'
    ) {
      continue;
    }
    if (/^\d{3,}$/.test(s)) {
      continue;
    }
    if (/^\d+$/.test(s)) {
      const num = parseInt(s, 10);
      if (num >= 1 && num <= 12) {
        validClasses.push(`Class ${num}`);
      }
      continue;
    }
    const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})$/);
    if (m1 && monthMap[m1[2].toLowerCase()]) {
      validClasses.push(`Class ${monthMap[m1[2].toLowerCase()]}-${m1[1]}`);
      continue;
    }
    const m2 = s.match(/^([A-Za-z]{3})-(\d{1,2})$/);
    if (m2 && monthMap[m2[1].toLowerCase()]) {
      validClasses.push(`Class ${monthMap[m2[1].toLowerCase()]}-${m2[2]}`);
      continue;
    }
    if (/\b\d{4,}\b/.test(s)) {
      continue;
    }
    validClasses.push(s);
  }

  return Array.from(new Set(validClasses));
};

const SUBJECTS_LIST = [
  'Bangla',
  'English',
  'General Math',
  'Higher Math',
  'Physics',
  'Chemistry',
  'Biology',
  'ICT',
  'Accounting',
  'Finance',
  'Economics',
  'Science',
  'All Subjects (Class 1-5)',
  'All Subjects (Class 6-8)',
];

const DHAKA_AREAS = [
  'Dhanmondi',
  'Mirpur',
  'Uttara',
  'Mohammadpur',
  'Badda',
  'Gulshan',
  'Banani',
  'Bashundhara',
  'Motijheel',
  'Khilgaon',
  'Malibagh',
  'Rampura',
  'Mogbazar',
  'Shantinagar',
  'Azimpur',
  'Lalbagh',
  'Wari',
  'Jatrabari',
  'Savar',
  'Farmgate',
  'Tejgaon',
  'Cantonment',
  'Banasree',
  'Mugda',
  'Basabo',
  'Shahbagh',
  'Puran Dhaka',
  'Sutrapur',
];

const CLASSES_LIST = [
  'Class 1-5',
  'Class 5-10',
  'Class 1-10',
  'Class 6-8',
  'Class 9-10 (SSC)',
  'Class 11-12 (HSC)',
  'O/A Level',
  'Admission',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

interface CatalogEntry {
  label: string;
  aliases: string[];
}

const UNIVERSITY_CATALOG: CatalogEntry[] = [
  {
    label: 'University of Dhaka (DU)',
    aliases: ['university of dhaka', 'dhaka university', 'du', 'ঢাকা বিশ্ববিদ্যালয়', 'ঢাকা বিশ্ববিদ্যালয়'],
  },
  { label: 'BUET', aliases: ['buet', 'bangladesh university of engineering'] },
  { label: 'Jahangirnagar University (JU)', aliases: ['jahangirnagar', 'ju'] },
  { label: 'Jagannath University (JnU)', aliases: ['jagannath', 'jnu'] },
  {
    label: 'Dhaka Medical College (DMC)',
    aliases: ['dmc', 'dhaka medical'],
  },
  { label: 'North South University (NSU)', aliases: ['nsu', 'north south'] },
  { label: 'BRAC University', aliases: ['brac'] },
  { label: 'East West University (EWU)', aliases: ['ewu', 'east west'] },
  { label: 'Ahsanullah University (AUST)', aliases: ['aust', 'ahsanullah'] },
  { label: 'AIUB', aliases: ['aiub', 'american international', 'auib'] },
  { label: 'Independent University (IUB)', aliases: ['iub', 'independent university'] },
  { label: 'United International University (UIU)', aliases: ['uiu', 'united international'] },
  { label: 'Daffodil International University (DIU)', aliases: ['diu', 'daffodil'] },
  { label: 'University of Liberal Arts Bangladesh (ULAB)', aliases: ['ulab', 'liberal arts'] },
  { label: 'Bangladesh University of Business & Technology (BUBT)', aliases: ['bubt', 'business and technology'] },
  { label: 'IUBAT', aliases: ['iubat', 'business agriculture and technology'] },
  { label: 'Northern University Bangladesh (NUB)', aliases: ['nub', 'northern university'] },
  { label: 'ASA University Bangladesh (ASAUB)', aliases: ['asa university', 'asaub'] },
  { label: 'Asian University of Bangladesh (AUB)', aliases: ['aub', 'asian university'] },
  { label: 'Bangladesh University (BU)', aliases: ['bangladesh university'] },
  { label: 'Central Women’s University (CWU)', aliases: ['cwu', "central woman's university", 'central womens university'] },
  { label: 'University of Scholars', aliases: ['university of scholars', 'ius'] },
  { label: 'Dhaka International University', aliases: ['dhaka international'] },
  { label: 'Dhaka College', aliases: ['dhaka college', 'dc'] },
  { label: 'Eden Mohila College', aliases: ['eden', 'eden mohila', 'eden college'] },
  { label: 'Govt. Titumir College', aliases: ['titumir', 'tc'] },
  { label: 'Kabi Nazrul Govt. College', aliases: ['kabi nazrul', 'kabi nozrul', 'kngc'] },
  { label: 'Govt. Shaheed Suhrawardy College', aliases: ['suhrawardy', 'gssc'] },
  { label: 'Begum Badrunnessa Govt. Girls College', aliases: ['badrunnessa', 'bbggc'] },
  { label: 'Dhaka City College', aliases: ['dhaka city college', 'city college', 'dcc'] },
  { label: 'National University (NU)', aliases: ['national university', 'nu', 'sbpgc'] },
  { label: 'KUET', aliases: ['kuet', 'khulna university of engineering'] },
  { label: 'RUET', aliases: ['ruet', 'rajshahi university of engineering'] },
  { label: 'CUET', aliases: ['cuet', 'chittagong university of engineering'] },
  { label: 'SUST', aliases: ['sust', 'shahjalal'] },
  { label: 'BUTEX', aliases: ['butex', 'bangladesh university of textiles'] },
  { label: 'BUFT', aliases: ['buft', 'bgmea'] },
  { label: 'BUP', aliases: ['bup', 'bangladesh university of professionals', 'army iba'] },
  { label: 'MIST', aliases: ['mist', 'military institute'] },
  { label: 'IUT', aliases: ['iut', 'islamic university of technology'] },
  { label: 'University of Asia Pacific (UAP)', aliases: ['uap', 'asia pacific'] },
  { label: 'Southeast University', aliases: ['southeast', 'seu'] },
  { label: 'Stamford University', aliases: ['stamford'] },
  { label: 'World University of Bangladesh (WUB)', aliases: ['world university', 'wub'] },
  { label: 'Green University', aliases: ['green university', 'gub'] },
  { label: 'University of Development Alternative (UODA)', aliases: ['uoda', 'development alternative'] },
  { label: 'Islamic University (IU)', aliases: ['islamic university', 'iu'] },
  { label: 'BSMRSTU', aliases: ['bsmrstu', 'gopalganj', 'goapalganj', 'gopalgonj science'] },
  { label: 'HSTU (Hajee Mohammad Danesh)', aliases: ['hstu', 'hajee mohammad danesh'] },
  { label: 'Bangladesh Agricultural University (BAU)', aliases: ['bau', 'bangladesh agricultural university'] },
  { label: 'University of Chittagong (CU)', aliases: ['chittagong university', 'university of chittagong'] },
  { label: 'University of Rajshahi (RU)', aliases: ['rajshahi university', 'university of rajshahi', 'ru'] },
  { label: 'Sher-e-Bangla Agricultural University (SAU)', aliases: ['sher-e-bangla', 'sher e bangla', 'sau', 'sbau'] },
  { label: 'Bangladesh Medical College', aliases: ['bangladesh medical college', 'bmc'] },
  { label: 'Sir Salimullah Medical College (SSMC)', aliases: ['ssmc', 'salimullah medical'] },
  { label: 'Dhaka National Medical College (DNMC)', aliases: ['dnmc', 'dhaka national medical'] },
  { label: 'Green Life Medical College', aliases: ['green life medical'] },
  { label: 'Anwer Khan Modern Medical College', aliases: ['anwer khan'] },
  { label: 'MH Samorita Medical College', aliases: ['samorita medical'] },
  { label: 'Dhaka Central University', aliases: ['dhaka central'] },
];

const DEPARTMENT_CATALOG: CatalogEntry[] = [
  { label: 'CSE (Computer Science)', aliases: ['cse', 'computer science', 'software engineering', 'cs'] },
  { label: 'EEE (Electrical & Electronic)', aliases: ['eee', 'electrical', 'electronic'] },
  { label: 'BBA / Business Administration', aliases: ['bba', 'business administration', 'business studies'] },
  { label: 'English', aliases: ['english', 'eng'] },
  { label: 'Mathematics', aliases: ['math', 'mathematics', 'applied math'] },
  { label: 'Physics', aliases: ['physics', 'phy'] },
  { label: 'Chemistry', aliases: ['chemistry', 'chem'] },
  { label: 'Pharmacy', aliases: ['pharmacy', 'pharm', 'b.pharm'] },
  { label: 'Textile Engineering', aliases: ['textile', 'tem', 'apparel', 'fabric', 'wet process'] },
  { label: 'Mechanical Engineering', aliases: ['mechanical', 'me'] },
  { label: 'Civil Engineering', aliases: ['civil', 'ce'] },
  { label: 'Architecture', aliases: ['architecture', 'arch'] },
  { label: 'Economics', aliases: ['economics', 'econ'] },
  { label: 'Accounting', aliases: ['accounting', 'ais'] },
  { label: 'Finance & Banking', aliases: ['finance', 'banking'] },
  { label: 'Management', aliases: ['management', 'mgt'] },
  { label: 'Marketing', aliases: ['marketing', 'mkt'] },
  { label: 'Law / LLB', aliases: ['law', 'llb', 'llm'] },
  { label: 'MBBS / Medical / Dental', aliases: ['mbbs', 'medical', 'dental', 'bds'] },
  { label: 'Biology / Botany / Zoology', aliases: ['biology', 'botany', 'zoology'] },
  { label: 'Microbiology', aliases: ['microbiology'] },
  { label: 'Biochemistry & Molecular Biology', aliases: ['biochemistry', 'molecular'] },
  { label: 'Genetic Engineering & Biotechnology', aliases: ['genetic', 'biotechnology'] },
  { label: 'Statistics', aliases: ['statistics', 'stat'] },
  { label: 'Sociology', aliases: ['sociology'] },
  { label: 'Political Science', aliases: ['political science'] },
  { label: 'Bangla', aliases: ['bangla', 'bengali'] },
  { label: 'History', aliases: ['history'] },
  { label: 'Psychology', aliases: ['psychology'] },
  { label: 'Geography & Environment', aliases: ['geography', 'environment'] },
  { label: 'Soil Science', aliases: ['soil science', 'soil'] },
  { label: 'Leather / Footwear Engineering', aliases: ['leather', 'footwear'] },
  { label: 'Public Administration', aliases: ['public administration'] },
  { label: 'International Relations (IR)', aliases: ['international relations', 'ir'] },
  { label: 'International Business (IB)', aliases: ['international business'] },
  { label: 'Tourism & Hospitality Management (THM)', aliases: ['thm', 'tourism', 'hospitality'] },
  { label: 'Criminology', aliases: ['criminology'] },
  { label: 'Journalism & Media', aliases: ['journalism', 'media', 'mass communication'] },
  { label: 'ICT / IT', aliases: ['ict', 'information technology'] },
];

const matchesCatalogFilter = (
  rawValue: unknown,
  selectedLabel: string,
  catalog: CatalogEntry[]
): boolean => {
  // Collapse multiple spaces and punctuation noise
  const val = String(rawValue || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (
    !val ||
    val === 'not specified' ||
    val === '-' ||
    val === 'no' ||
    val === 'nai' ||
    val === 'n/a'
  ) {
    return false;
  }

  // Prevent false positives when filtering for "University of Dhaka (DU)" on 7-College / affiliated college rows
  if (selectedLabel === 'University of Dhaka (DU)') {
    if (
      /\b(dhaka college|eden|titumir|kabi nazrul|kabi nozrul|suhrawardy|badrunnessa|bangla college|city college|7\s*college|7c|affiliated|afflicted|technology unit|du technology)\b/i.test(
        val
      )
    ) {
      return false;
    }
  }

  // Prevent "Bangladesh University (BU)" from matching BUET, BUBT, BUP, BAU, BUTEX, BUFT
  if (selectedLabel === 'Bangladesh University (BU)') {
    if (
      /\b(engineering|textile|business|professionals|agricultural|health|buet|bubt|bup|bau|butex|buft)\b/i.test(
        val
      )
    ) {
      return false;
    }
  }

  const entry = catalog.find((item) => item.label === selectedLabel);
  if (!entry) {
    const cleanTarget = selectedLabel.toLowerCase().replace(/\s+/g, ' ').trim();
    return val === cleanTarget || val.includes(cleanTarget);
  }
  return entry.aliases.some((alias) => {
    const cleanAlias = alias.toLowerCase().replace(/\s+/g, ' ').trim();
    if (cleanAlias.length <= 4) {
      const wordRegex = new RegExp(
        `(^|[^a-z])${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`,
        'i'
      );
      return wordRegex.test(val);
    }
    return val.includes(cleanAlias);
  });
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'find' | 'requests' | 'payments' | 'pool' | 'settings'>(
    'find'
  );
  const detectDeviceType = useCallback((): 'mobile' | 'tablet' | 'laptop' => {
    if (typeof window === 'undefined') return 'laptop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1100) return 'tablet';
    return 'laptop';
  }, []);

  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'laptop'>(detectDeviceType);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1100) {
      return true;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const detected = detectDeviceType();
      setDeviceMode(detected);
      if (detected === 'tablet') {
        setIsSidebarCollapsed(true);
      } else if (detected === 'laptop') {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [detectDeviceType]);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Configurations
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_supabase_cfg_v5') || '{}');
      const reqTbl =
        !saved.requestsTableName || saved.requestsTableName === 'tuition_requests'
          ? HARDCODED_MASTER_CONFIG.supabase.requestsTableName
          : saved.requestsTableName;
      const payTbl =
        !saved.paymentsTableName || saved.paymentsTableName === 'payment_ledger'
          ? HARDCODED_MASTER_CONFIG.supabase.paymentsTableName
          : saved.paymentsTableName;
      return {
        url: saved.url || HARDCODED_MASTER_CONFIG.supabase.url,
        anonKey: saved.anonKey || HARDCODED_MASTER_CONFIG.supabase.anonKey,
        tableName: saved.tableName || HARDCODED_MASTER_CONFIG.supabase.tableName,
        requestsTableName: reqTbl,
        paymentsTableName: payTbl,
      };
    } catch {
      return HARDCODED_MASTER_CONFIG.supabase;
    }
  });

  const [wasenderConfig, setWasenderConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_wasender_cfg_v5') || '{}');
      return { ...HARDCODED_MASTER_CONFIG.wasender, ...saved };
    } catch {
      return HARDCODED_MASTER_CONFIG.wasender;
    }
  });

  const [smsGatewayConfig, setSmsGatewayConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('at_smsgw_cfg_v5') || '{}');
      return { ...HARDCODED_MASTER_CONFIG.smsGateway, ...saved };
    } catch {
      return HARDCODED_MASTER_CONFIG.smsGateway;
    }
  });

  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('at_sheet_url_v5') || HARDCODED_MASTER_CONFIG.sheetUrl;
  });

  // Lock states for Settings cards
  const [isSupabaseLocked, setIsSupabaseLocked] = useState(true);
  const [isWasenderLocked, setIsWasenderLocked] = useState(() => Boolean(wasenderConfig.apiKey));
  const [isSmsLocked, setIsSmsLocked] = useState(() => Boolean(smsGatewayConfig.apiKey));

  // Deleted Phones Blacklist
  const [deletedPhones, setDeletedPhones] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('at_deleted_phones_v5') || '[]');
    } catch {
      return [];
    }
  });

  // Tutors State
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [, setIsLoadingDb] = useState(false);
  const [lastSheetSyncTime, setLastSheetSyncTime] = useState<string | null>(null);

  // Guardian Requirements Draft & Applied Filter State
  const defaultRequirementsState: RequirementsState = {
    guardianName: 'Mr. Hasan',
    batchCode: 'AT9832',
    selectedClass: 'All Classes',
    selectedEducationMedium: 'Any',
    selectedSubjects: [],
    preferredGender: 'Any',
    selectedUniversity: 'All Universities',
    selectedDepartment: 'All Departments',
    selectedAreas: [],
    salaryBudgetCap: 25000,
    tuitionType: 'Any',
    preferredDays: 'Any',
  };
  const [requirements, setRequirements] = useState<RequirementsState>(defaultRequirementsState);
  const [appliedRequirements, setAppliedRequirements] = useState<RequirementsState>(
    defaultRequirementsState
  );
  const [manualLocationQuery, setManualLocationQuery] = useState('');

  // Modals State
  const [selectedTutorForProfile, setSelectedTutorForProfile] = useState<Tutor | null>(null);
  const [selectedTutorForSms, setSelectedTutorForSms] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [smsText, setSmsText] = useState('');
  const [isSendingGateway, setIsSendingGateway] = useState(false);

  const [selectedTutorIds, setSelectedTutorIds] = useState<(number | string)[]>([]);
  const [bulkSmsModalOpen, setBulkSmsModalOpen] = useState(false);
  const [bulkSmsText, setBulkSmsText] = useState('');

  const [addTutorModalOpen, setAddTutorModalOpen] = useState(false);
  const initialNewTutorForm = {
    name: '',
    gender: 'Male',
    phone: '',
    presentAddress: '',
    university: '',
    educationBackground: 'Bangla Version',
    department: '',
    preferredAreas: [] as string[],
    subjects: [] as string[],
    classes: [] as string[],
    salaryRange: '',
    tuitionType: 'Home Tuition',
    preferredDays: 'Negotiable',
    bio: '',
  };
  const [newTutorForm, setNewTutorForm] = useState(initialNewTutorForm);

  // ============================================================================
  // GUARDIAN REQUESTS & PAYMENTS LEDGER STATE (SYNCED WITH SUPABASE)
  // ============================================================================
  const [tuitionRequests, setTuitionRequests] = useState<TuitionRequest[]>([]);
  const [addRequestModalOpen, setAddRequestModalOpen] = useState(false);
  const initialRequestForm = {
    code: `AT${Math.floor(1000 + Math.random() * 9000)}`,
    studentName: '',
    guardianName: '',
    className: 'Class 9',
    educationMedium: 'Any',
    subjects: [] as string[],
    preferredGender: 'Any',
    preferredVarsity: 'All Universities',
    preferredDepartment: 'All Departments',
    areas: [] as string[],
    location: '',
    salaryBudgetCap: 25000,
    salary: 'Negotiable',
    tuitionType: 'Home Tuition',
    preferredDays: '4 Days/Week',
    schedule: '4 Days/Week (Any)',
    contact: '',
    notes: '',
  };
  const [newRequestForm, setNewRequestForm] = useState(initialRequestForm);

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [ledgerDateMode, setLedgerDateMode] = useState<'all' | 'date' | 'month' | 'range'>('all');
  const [ledgerSelectedDate, setLedgerSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | string | null>(null);
  const initialPaymentForm = {
    tuitionCode: `AT${Math.floor(1000 + Math.random() * 9000)}`,
    tutorName: '',
    tutorPhone: '',
    tutorUniversity: '',
    studentName: '',
    guardianName: '',
    guardianPhone: '',
    studentClass: 'Class 9',
    educationMedium: 'Bangla Medium',
    subjects: '',
    area: 'Dhanmondi',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlyFee: 8000 as number | string,
    commissionPercentage: 100 as number | string,
    payableAmount: 8000 as number | string,
    paidAmount: 5000 as number | string,
    paymentMethod: 'bKash',
    paymentNote: '',
  };
  const [newPaymentForm, setNewPaymentForm] = useState(initialPaymentForm);

  // Initialize Supabase Client
  const getSupabaseClient = useCallback((): SupabaseClient | null => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) return null;
    try {
      return createClient(supabaseConfig.url.trim(), supabaseConfig.anonKey.trim());
    } catch {
      return null;
    }
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  // Normalize Tutor Row
  const normalizeTutorRow = useCallback((row: Record<string, unknown>): Tutor => {
    const phoneObj = formatBdPhoneNumbers(row.phone || row.whatsapp || '');
    const waObj = formatBdPhoneNumbers(row.whatsapp || row.phone || '');
    const rawSalNum = sanitizeNumber(row.expectedSalary ?? row.expected_salary ?? 0, 0);

    let rawBio = String(row.bio || '').trim();
    let extractedRange = String(row.salaryRange || row.salary_range || '').trim();
    let extractedTuitionType = String(row.tuitionType || row.tuition_type || '').trim();
    let extractedPreferredDays = String(
      row.preferredDays || row.preferred_days || row.availability || ''
    ).trim();
    let extractedEduBg = String(
      row.educationBackground ||
        row.education_background ||
        row.medium ||
        row.school ||
        ''
    ).trim();

    const rangeMatch = rawBio.match(/\[SALARY_RANGE:([^\]]+)\]/);
    if (rangeMatch) {
      if (!extractedRange) extractedRange = rangeMatch[1].trim();
      rawBio = rawBio.replace(/\[SALARY_RANGE:[^\]]+\]\s*•?\s*/g, '').trim();
    }

    const typeMatch = rawBio.match(/\[TUITION_TYPE:([^\]]+)\]/);
    if (typeMatch) {
      extractedTuitionType = typeMatch[1].trim();
      rawBio = rawBio.replace(/\[TUITION_TYPE:[^\]]+\]\s*•?\s*/g, '').trim();
    }

    const daysMatch = rawBio.match(/\[PREFERRED_DAYS:([^\]]+)\]/);
    if (daysMatch) {
      extractedPreferredDays = daysMatch[1].trim();
      rawBio = rawBio.replace(/\[PREFERRED_DAYS:[^\]]+\]\s*•?\s*/g, '').trim();
    }

    const eduMatch = rawBio.match(/\[EDU_BG:([^\]]+)\]/);
    if (eduMatch) {
      if (!extractedEduBg) extractedEduBg = eduMatch[1].trim();
      rawBio = rawBio.replace(/\[EDU_BG:[^\]]+\]\s*•?\s*/g, '').trim();
    }

    let extractedClassesFromBio: string[] = [];
    const classMatch = rawBio.match(/Class Level:\s*([^•]+)/i);
    if (classMatch) {
      extractedClassesFromBio = normalizeClassString(classMatch[1].trim());
      rawBio = rawBio
        .replace(/•?\s*Class Level:\s*[^•]+/gi, '')
        .replace(/^•\s*|\s*•$/g, '')
        .trim();
    }

    if (rawBio.toLowerCase() === 'nan' || rawBio.toLowerCase() === 'not provided') {
      rawBio = '';
    }

    let finalSalaryRange = 'Not Provided';
    if (
      extractedRange &&
      extractedRange.toLowerCase() !== 'nan' &&
      extractedRange.toLowerCase() !== 'negotiable' &&
      extractedRange.toLowerCase() !== 'not provided'
    ) {
      finalSalaryRange = extractedRange;
    } else if (rawSalNum >= 500 && rawSalNum !== 7500 && rawSalNum !== 36687) {
      finalSalaryRange = `${rawSalNum.toLocaleString()} BDT`;
    }

    const parsedTypes = Array.from(parseTutorTuitionTypes(extractedTuitionType, rawBio));
    const finalTuitionType = parsedTypes.length > 0 ? parsedTypes.join(', ') : 'Home Tuition';

    const parsedDays = Array.from(parseTutorPreferredDays(extractedPreferredDays, rawBio)).sort(
      (a, b) => a - b
    );
    const finalPreferredDays =
      parsedDays.length > 0
        ? `${parsedDays.join(', ')} Days/Week`
        : extractedPreferredDays &&
          extractedPreferredDays.toLowerCase() !== 'nan' &&
          extractedPreferredDays.toLowerCase() !== 'not provided'
        ? extractedPreferredDays
        : 'Negotiable';

    const directClasses = normalizeClassString(row.classes);
    const finalClasses = directClasses.length > 0 ? directClasses : extractedClassesFromBio;
    const cleanedName = cleanTutorName(row.name || 'Unnamed Tutor');
    const salaryBounds = parseSalaryRangeBounds(finalSalaryRange, rawSalNum);

    const rawGenderStr = String(row.gender || '').trim().toLowerCase();
    const normalizedGender =
      rawGenderStr.includes('female') || rawGenderStr === 'f' || rawGenderStr.includes('নারী') || rawGenderStr.includes('মহিলা')
        ? 'Female'
        : rawGenderStr.includes('male') || rawGenderStr === 'm' || rawGenderStr.includes('পুরুষ')
        ? 'Male'
        : 'Any';

    const finalSubjects = inferSubjectsForTutor(
      row.subjects,
      row.department,
      finalClasses,
      rawBio
    );

    const eduProfile = parseTutorEducationBackground(
      extractedEduBg,
      finalClasses,
      rawBio,
      row.university,
      row.department
    );

    return {
      id: (row.id as number | string) ?? Date.now() + Math.random(),
      name: cleanedName,
      gender: normalizedGender,
      avatar: getCleanAvatarUrl(cleanedName),
      presentAddress:
        cleanAddressText(row.presentAddress || row.present_address) || 'Not Specified',
      university: String(row.university || 'Not Specified'),
      department: String(row.department || 'Not Specified'),
      preferredAreas: cleanAreasList(row.preferredAreas ?? row.preferred_areas),
      subjects: finalSubjects,
      phone: phoneObj.localWithZero,
      whatsapp: waObj.localWithZero || phoneObj.localWithZero,
      classes: finalClasses,
      expectedSalary: salaryBounds.hasSalary ? salaryBounds.min : 0,
      salaryMin: salaryBounds.min,
      salaryMax: salaryBounds.max,
      hasSalary: salaryBounds.hasSalary,
      salaryRange: finalSalaryRange,
      tuitionType: finalTuitionType,
      preferredDays: finalPreferredDays,
      educationBackground: eduProfile.displayLabel,
      bio: rawBio,
    };
  }, []);

  // Parse CSV Text into Array of Rows
  const parseCsvTextToMatrix = (csvText: string): string[][] => {
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const ch = cleanText[i];
      const nextCh = cleanText[i + 1];

      if (ch === '"') {
        if (inQuotes && nextCh === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
        if (ch === '\r' && nextCh === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) rows.push(currentRow);
    }
    return rows;
  };

  // Convert CSV Matrix to Tutor Objects
  const parseMatrixToTutors = useCallback((matrix: string[][]): Tutor[] => {
    if (!matrix || matrix.length < 2) return [];
    const headers = matrix[0].map((h) =>
      String(h || '')
        .replace(/^\uFEFF/, '')
        .toLowerCase()
        .trim()
    );

    const findCol = (predicates: Array<(h: string) => boolean>) => {
      for (const pred of predicates) {
        const idx = headers.findIndex((h) => pred(h));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = findCol([
      (h) =>
        h === 'full name' ||
        h === 'name' ||
        h === 'teacher name' ||
        h === 'tutor name' ||
        h.includes('আপনার নাম'),
      (h) =>
        h.includes('name') &&
        !h.includes('university') &&
        !h.includes('college') &&
        !h.includes('school') &&
        !h.includes('department') &&
        !h.includes('subject'),
    ]);
    const phoneIdx = findCol([
      (h) =>
        h.includes('phone number') ||
        h === 'current number' ||
        h === 'phone' ||
        h === 'mobile' ||
        h === 'contact' ||
        h.includes('মোবাইল') ||
        h.includes('ফোন'),
      (h) => (h.includes('contact') || h.includes('number')) && !h.includes('whatsapp'),
    ]);
    const waIdx = findCol([(h) => h.includes('whatsapp') || h.includes('হোয়াটসঅ্যাপ')]);
    const uniIdx = findCol([
      (h) =>
        h.includes('university') ||
        h === 'university / college' ||
        h.includes('institution') ||
        h.includes('varsity') ||
        h.includes('বিশ্ববিদ্যালয়'),
    ]);
    const eduBgIdx = findCol([
      (h) =>
        h.includes('select your education') ||
        h.includes('your academic level') ||
        h === 'academic level' ||
        h.includes('education background') ||
        h.includes('educational background') ||
        h.includes('medium') ||
        h.includes('version') ||
        h.includes('curriculum') ||
        h.includes('মিডিয়াম') ||
        h.includes('ভার্সন'),
    ]);
    const deptIdx = findCol([
      (h) =>
        h.includes('department') ||
        h === 'dept' ||
        h.includes('subject/dept') ||
        h.includes('বিভাগ'),
    ]);
    const prefLocIdx = findCol([
      (h) =>
        h.includes('tuition location') ||
        h.includes('preferred location') ||
        h.includes('preferred area') ||
        h.includes('preferredareas') ||
        h.includes('preferred_areas') ||
        h.includes('kon kon area') ||
        h.includes('কোন কোন এলাকায়'),
      (h) =>
        (h.includes('location') || h.includes('area')) &&
        !h.includes('self') &&
        !h.includes('current') &&
        !h.includes('present'),
    ]);
    const selfLocIdx = findCol([
      (h) =>
        h.includes('self location') ||
        h.includes('current location') ||
        h.includes('present location') ||
        h.includes('present address') ||
        h.includes('presentaddress') ||
        h.includes('present_address') ||
        h.includes('বর্তমান ঠিকানা'),
    ]);
    const subjIdx = findCol([
      (h) =>
        h.includes('favourite subject') ||
        h.includes('favorite subject') ||
        h.includes('preferred subject') ||
        h.includes('subjects') ||
        h === 'subject',
    ]);
    const genderIdx = findCol([(h) => h.includes('gender') || h.includes('লিঙ্গ')]);
    const classIdx = findCol([
      (h) =>
        h.includes('class level') ||
        h === 'classes' ||
        h === 'class' ||
        h.includes('preferred class') ||
        h.includes('কোন ক্লাস'),
    ]);
    const salaryIdx = findCol([
      (h) => h.includes('salary') || h.includes('expected_salary') || h.includes('বেতন'),
    ]);
    const tuitionTypeIdx = findCol([(h) => h.includes('tuition type') || h === 'type']);
    const daysIdx = findCol([
      (h) => h.includes('preferred days') || h.includes('days') || h.includes('availability'),
    ]);
    const notesIdx = findCol([(h) => h.includes('rules') || h.includes('notes')]);
    const banglaNoteIdx = findCol([
      (h) => h.includes('আপনার কিছু বলার থাকলে') || h === 'bio' || h.includes('comment'),
    ]);

    const getCell = (row: string[], idx: number) =>
      idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '';
    const mapByPhone = new Map<string, Tutor>();

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      const rawName = getCell(row, nameIdx);
      const primaryPhoneCandidate = formatBdPhoneNumbers(getCell(row, phoneIdx));
      const waPhoneCandidate = formatBdPhoneNumbers(getCell(row, waIdx));

      // Prefer a valid 11-digit BD mobile number from either phone or whatsapp column
      let phoneFormatted = primaryPhoneCandidate.isValid
        ? primaryPhoneCandidate
        : waPhoneCandidate.isValid
        ? waPhoneCandidate
        : primaryPhoneCandidate.localWithZero
        ? primaryPhoneCandidate
        : waPhoneCandidate;

      // Fallback scan across the row if neither phone column yielded a valid BD number
      if (!phoneFormatted.isValid) {
        for (let c = 0; c < row.length; c++) {
          const candidate = formatBdPhoneNumbers(getCell(row, c));
          if (candidate.isValid) {
            phoneFormatted = candidate;
            break;
          }
        }
      }

      if (!rawName || !phoneFormatted.localWithZero) continue;

      const waFormatted = waPhoneCandidate.isValid ? waPhoneCandidate : phoneFormatted;
      const uniVal = getCell(row, uniIdx) || 'Not Specified';
      const rawEduBgVal = getCell(row, eduBgIdx);
      const deptVal = getCell(row, deptIdx) || 'Not Specified';
      const rawGender = getCell(row, genderIdx).toLowerCase();
      const genderVal =
        rawGender.includes('female') ||
        rawGender === 'f' ||
        rawGender.includes('নারী') ||
        rawGender.includes('মহিলা')
          ? 'Female'
          : rawGender.includes('male') || rawGender === 'm' || rawGender.includes('পুরুষ')
          ? 'Male'
          : 'Any';
      const areasVal = cleanAreasList(getCell(row, prefLocIdx));
      const selfLocVal =
        cleanAddressText(getCell(row, selfLocIdx)) || areasVal[0] || 'Not Specified';
      const rawClassCell = getCell(row, classIdx);
      const rawSubjCell = getCell(row, subjIdx);
      let classesVal = normalizeClassString(rawClassCell);
      if (
        classesVal.length === 0 &&
        /\b(class|cls|ssc|hsc|level|\d\s*[-–to]+\s*\d)/i.test(rawSubjCell)
      ) {
        classesVal = normalizeClassString(rawSubjCell);
      }

      const rawSalStr = getCell(row, salaryIdx).trim();
      const cleanSalRange =
        rawSalStr && rawSalStr.toLowerCase() !== 'nan' ? rawSalStr : 'Not Provided';

      const salaryBounds = parseSalaryRangeBounds(cleanSalRange, 0);

      const bioParts: string[] = [];
      if (cleanSalRange !== 'Not Provided') {
        bioParts.push(`[SALARY_RANGE:${cleanSalRange}]`);
      }
      if (rawEduBgVal && rawEduBgVal.toLowerCase() !== 'nan') {
        bioParts.push(`[EDU_BG:${rawEduBgVal}]`);
      }
      const n1 = getCell(row, notesIdx);
      const n2 = getCell(row, banglaNoteIdx);
      if (n1 && n1.toLowerCase() !== 'yes' && n1.toLowerCase() !== 'nan') bioParts.push(n1);
      if (n2 && n2 !== n1 && n2.toLowerCase() !== 'nan') bioParts.push(n2);

      const combinedNotes = [n1, n2].filter(Boolean).join(' • ');
      const subjectsVal = inferSubjectsForTutor(rawSubjCell, deptVal, classesVal, combinedNotes);
      const rawTypeCell = getCell(row, tuitionTypeIdx);
      const rawDaysCell = getCell(row, daysIdx);

      const parsedTypes = Array.from(parseTutorTuitionTypes(rawTypeCell, combinedNotes));
      const finalTuitionType = parsedTypes.length > 0 ? parsedTypes.join(', ') : 'Home Tuition';

      const parsedDays = Array.from(parseTutorPreferredDays(rawDaysCell, combinedNotes)).sort(
        (a, b) => a - b
      );
      const finalPreferredDays =
        parsedDays.length > 0
          ? `${parsedDays.join(', ')} Days/Week`
          : rawDaysCell && rawDaysCell.toLowerCase() !== 'nan'
          ? rawDaysCell
          : 'Negotiable';

      const cleanedName = cleanTutorName(rawName);
      if (!cleanedName) continue;

      const eduProfile = parseTutorEducationBackground(
        rawEduBgVal,
        classesVal,
        combinedNotes,
        uniVal,
        deptVal
      );

      const tutorItem: Tutor = {
        id: Date.now() + r + Math.floor(Math.random() * 10000),
        name: cleanedName,
        gender: genderVal,
        phone: phoneFormatted.localWithZero,
        whatsapp: waFormatted.localWithZero || phoneFormatted.localWithZero,
        presentAddress: selfLocVal,
        university: uniVal,
        department: deptVal,
        preferredAreas: areasVal,
        subjects: subjectsVal,
        classes: classesVal,
        expectedSalary: salaryBounds.hasSalary ? salaryBounds.min : 0,
        salaryMin: salaryBounds.min,
        salaryMax: salaryBounds.max,
        hasSalary: salaryBounds.hasSalary,
        salaryRange: cleanSalRange,
        tuitionType: finalTuitionType,
        preferredDays: finalPreferredDays,
        educationBackground: eduProfile.displayLabel,
        bio: bioParts.join(' • '),
        avatar: getCleanAvatarUrl(cleanedName),
      };

      mapByPhone.set(phoneFormatted.localWithZero, tutorItem);
    }

    return Array.from(mapByPhone.values());
  }, []);

  // Fetch Tutors from Supabase
  const fetchTutorsFromSupabase = useCallback(
    async (silent = false): Promise<Tutor[]> => {
      const client = getSupabaseClient();
      if (!client) return [];
      if (!silent) setIsLoadingDb(true);
      try {
        const { data, error } = await client
          .from(supabaseConfig.tableName)
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;

        const byPhone = new Map<string, Tutor>();
        const duplicateIdsToDelete: Array<number | string> = [];
        const rowsToRepair: Array<{
          id: number | string;
          payload: Record<string, unknown>;
        }> = [];

        (data || []).forEach((raw: Record<string, unknown>) => {
          const norm = normalizeTutorRow(raw);
          if (!norm.name || !norm.phone) return;
          if (deletedPhones.includes(norm.phone)) return;

          const rawClassesStr = JSON.stringify(raw.classes || []);
          const rawPresent = String(raw.presentAddress || raw.present_address || '');
          const rawAreasArr = ensureArray(raw.preferredAreas ?? raw.preferred_areas);
          const rawAreasStr = JSON.stringify(rawAreasArr);
          if (
            raw.name !== norm.name ||
            rawPresent !== norm.presentAddress ||
            rawAreasStr !== JSON.stringify(norm.preferredAreas) ||
            rawClassesStr.includes('37115') ||
            /\b\d{4,}\b/.test(rawClassesStr) ||
            /[0-9\u09E6-\u09EF]/.test(rawPresent) ||
            /[0-9\u09E6-\u09EF]/.test(rawAreasStr)
          ) {
            rowsToRepair.push({
              id: raw.id as number | string,
              payload: {
                name: norm.name,
                classes: norm.classes,
                presentAddress: norm.presentAddress,
                preferredAreas: norm.preferredAreas,
                avatar: norm.avatar,
              },
            });
          }

          if (byPhone.has(norm.phone)) {
            duplicateIdsToDelete.push(raw.id as number | string);
          } else {
            byPhone.set(norm.phone, norm);
          }
        });

        if (duplicateIdsToDelete.length > 0) {
          await client.from(supabaseConfig.tableName).delete().in('id', duplicateIdsToDelete);
        }

        for (const item of rowsToRepair) {
          await client.from(supabaseConfig.tableName).update(item.payload).eq('id', item.id);
        }

        const cleanList = Array.from(byPhone.values());
        setTutors(cleanList);
        return cleanList;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (!silent) triggerToast(`Database Error: ${message}`);
        return [];
      } finally {
        if (!silent) setIsLoadingDb(false);
      }
    },
    [getSupabaseClient, supabaseConfig.tableName, normalizeTutorRow, deletedPhones, triggerToast]
  );

  // Fetch Guardian Requests & Payment Ledger from Supabase
  const fetchRequestsFromSupabase = useCallback(
    async (silent = false) => {
      const client = getSupabaseClient();
      if (!client) return;
      try {
        const { data, error } = await client
          .from(supabaseConfig.requestsTableName)
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          setTuitionRequests(
            data.map((r: Record<string, unknown>) => {
              const codeStr = String(r.id || r.code || r.tuition_code || 'AT9832');
              const daysPart = String(r.preferredDays || '4 Days/Week');
              const genderPart = String(r.preferredGender || 'Any');
              const rawType = String(r.tuitionType || 'Home Tuition');
              const normType =
                rawType === 'Home'
                  ? 'Home Tuition'
                  : rawType === 'Online'
                  ? 'Online Tuition'
                  : rawType === 'Batch'
                  ? 'Batch Tuition'
                  : rawType;
              const scheduleStr = r.schedule
                ? String(r.schedule)
                : daysPart.includes('(')
                ? daysPart
                : `${daysPart} (${genderPart})`;
              const rawNote = String(r.note ?? r.notes ?? '').trim();
              const eduMatch = rawNote.match(/\[EDU_BG:(.*?)\]/);
              const cleanNote = rawNote.replace(/\[EDU_BG:.*?\]/g, '').trim();
              const rawAreaStr = String(r.tuitionArea || r.location || 'Dhanmondi (General)');
              const parsedAreas = cleanAreasList(rawAreaStr);
              const rawSalaryStr = String(r.salaryRange || r.salary || 'Negotiable');
              const salBounds = parseSalaryRangeBounds(rawSalaryStr, 0);
              return {
                id: String(r.id || codeStr),
                code: codeStr,
                studentName: String(r.studentName || r.student_name || 'Student'),
                guardianName: String(r.guardianName || r.guardian_name || 'Guardian'),
                className: String(r.className || r.class_name || 'Class 9'),
                educationMedium: eduMatch ? eduMatch[1].trim() : 'Any',
                location: rawAreaStr,
                areas:
                  parsedAreas.length > 0
                    ? parsedAreas
                    : rawAreaStr.replace(/\(.*?\)/g, '').trim()
                    ? [rawAreaStr.replace(/\(.*?\)/g, '').trim()]
                    : [],
                preferredVarsity: String(
                  r.preferredUniversity ||
                    r.preferredVarsity ||
                    r.preferred_varsity ||
                    'All Universities'
                ),
                preferredDepartment: String(
                  r.preferredDepartment || r.preferred_department || 'All Departments'
                ),
                preferredGender: genderPart,
                tuitionType: normType,
                preferredDays: daysPart,
                schedule: scheduleStr,
                salary: rawSalaryStr,
                salaryBudgetCap: salBounds.hasSalary ? salBounds.max : 25000,
                contact:
                  formatBdPhoneNumbers(r.guardianPhone || r.contact || r.phone || '')
                    .localWithZero || String(r.guardianPhone || r.contact || ''),
                notes: cleanNote || '""',
                subjects: ensureArray(r.subjects),
              };
            })
          );
        }
        if (!silent) triggerToast('Requests refreshed from Supabase!');
      } catch {
        // ignore table missing fallback
      }
    },
    [getSupabaseClient, supabaseConfig.requestsTableName, triggerToast]
  );

  const fetchPaymentsFromSupabase = useCallback(
    async (silent = false) => {
      const client = getSupabaseClient();
      if (!client) return;
      try {
        const { data, error } = await client
          .from(supabaseConfig.paymentsTableName)
          .select('*')
          .order('id', { ascending: false });
        if (!error && Array.isArray(data)) {
          setPaymentRecords(
            data.map((p: Record<string, unknown>) => {
              const fee = sanitizeNumber(p.monthlyFee ?? p.monthly_fee, 0);
              const paid = sanitizeNumber(p.paidAmount ?? p.paid_amount, 0);
              const rawDue = p.dueAmount ?? p.due_amount;
              const rawUniMeta = String(
                p.tutorUniversity || p.tutor_university || ''
              ).trim();

              // Extract packed metadata tags from tutorUniversity if present
              const extractTag = (tag: string) => {
                const regex = new RegExp(`\\[${tag}:([^\\]]+)\\]`);
                const m = rawUniMeta.match(regex);
                return m ? m[1].trim() : '';
              };
              const cleanUni = rawUniMeta.replace(/\[[A-Z_]+:[^\]]+\]\s*•?\s*/g, '').trim();
              const guardianName = extractTag('G_NAME');
              const guardianPhone = extractTag('G_PHONE');
              const eduMedium = extractTag('MEDIUM') || 'Bangla Medium';
              const subjectsStr = extractTag('SUBJ');
              const commPct = sanitizeNumber(extractTag('COMM_PCT') || 100, 100);
              const payableAmt = sanitizeNumber(
                extractTag('PAYABLE') || fee,
                fee
              );
              const payMethod = extractTag('METHOD') || 'bKash';
              const payNote = extractTag('NOTE');

              const due =
                rawDue !== undefined && rawDue !== null
                  ? Math.max(0, sanitizeNumber(rawDue, 0))
                  : Math.max(0, payableAmt - paid);

              return {
                id: p.id as number | string,
                tuitionCode: String(p.code || p.tuitionCode || p.tuition_code || 'AT9832'),
                tutorName: String(p.tutorName || p.tutor_name || 'Tutor'),
                tutorPhone:
                  formatBdPhoneNumbers(p.tutorPhone || p.tutor_phone || '').localWithZero ||
                  String(p.tutorPhone || p.tutor_phone || ''),
                tutorUniversity: cleanUni,
                studentName: String(p.studentName || p.student_name || 'Student'),
                guardianName,
                guardianPhone,
                studentClass: String(p.studentClass || p.student_class || 'Class 9'),
                educationMedium: eduMedium,
                subjects: subjectsStr,
                area: String(p.tuitionArea || p.area || 'Dhaka'),
                joiningDate: String(
                  p.joiningDate || p.joining_date || new Date().toISOString().slice(0, 10)
                ),
                monthlyFee: fee,
                commissionPercentage: commPct,
                payableAmount: payableAmt,
                paidAmount: paid,
                dueAmount: due,
                paymentMethod: payMethod,
                paymentNote: payNote,
                status: due <= 0 ? 'Fully Paid' : 'Pending Due',
              };
            })
          );
        }
        if (!silent) triggerToast('Payments Ledger refreshed from Supabase!');
      } catch {
        // ignore table missing fallback
      }
    },
    [getSupabaseClient, supabaseConfig.paymentsTableName, triggerToast]
  );

  // Sync Google Sheet with Supabase
  const syncGoogleSheetToSupabase = useCallback(
    async (silent = true) => {
      if (!sheetUrl) return;
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return;
      const sheetId = match[1];
      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      try {
        const res = await fetch(csvExportUrl);
        if (!res.ok) return;
        const csvText = await res.text();
        const matrix = parseCsvTextToMatrix(csvText);
        const sheetTutors = parseMatrixToTutors(matrix).filter(
          (t) => !deletedPhones.includes(t.phone)
        );

        if (sheetTutors.length === 0) return;

        const client = getSupabaseClient();
        if (!client) {
          setTutors(sheetTutors);
          return;
        }

        const { data: existingRows } = await client.from(supabaseConfig.tableName).select('*');

        const existingByPhone = new Map<string, Record<string, unknown>>();
        (existingRows || []).forEach((r: Record<string, unknown>) => {
          const p = formatBdPhoneNumbers(r.phone || '').localWithZero;
          if (p) existingByPhone.set(p, r);
        });

        const toInsert: Array<Record<string, unknown>> = [];
        const toUpdate: Array<{ id: unknown; payload: Record<string, unknown> }> = [];

        for (const st of sheetTutors) {
          const existing = existingByPhone.get(st.phone);
          if (!existing) {
            toInsert.push({
              name: st.name,
              gender: st.gender,
              phone: st.phone,
              presentAddress: st.presentAddress,
              university: st.university,
              department: st.department,
              school: st.educationBackground || null,
              preferredAreas: st.preferredAreas,
              subjects: st.subjects,
              classes: st.classes,
              expectedSalary: st.expectedSalary,
              bio: st.bio,
              avatar: st.avatar,
            });
          } else {
            const exNorm = normalizeTutorRow(existing);
            const cleanStBio = st.bio
              .replace(/\[SALARY_RANGE:[^\]]+\]\s*•?\s*/g, '')
              .replace(/\[EDU_BG:[^\]]+\]\s*•?\s*/g, '')
              .trim();
            const nextEduBg = st.educationBackground || exNorm.educationBackground || '';
            const nextBio =
              !st.educationBackground && exNorm.educationBackground
                ? [
                    `[EDU_BG:${exNorm.educationBackground}]`,
                    st.bio.replace(/\[EDU_BG:[^\]]+\]\s*•?\s*/g, '').trim(),
                  ]
                    .filter(Boolean)
                    .join(' • ')
                : st.bio;
            const changed =
              exNorm.name !== st.name ||
              exNorm.gender !== st.gender ||
              exNorm.university !== st.university ||
              exNorm.department !== st.department ||
              exNorm.presentAddress !== st.presentAddress ||
              exNorm.salaryRange !== st.salaryRange ||
              (st.educationBackground && exNorm.educationBackground !== st.educationBackground) ||
              JSON.stringify(exNorm.classes) !== JSON.stringify(st.classes) ||
              JSON.stringify(exNorm.preferredAreas) !== JSON.stringify(st.preferredAreas) ||
              JSON.stringify(exNorm.subjects) !== JSON.stringify(st.subjects) ||
              exNorm.bio !== cleanStBio;

            if (changed) {
              toUpdate.push({
                id: existing.id,
                payload: {
                  name: st.name,
                  gender: st.gender,
                  presentAddress: st.presentAddress,
                  university: st.university,
                  department: st.department,
                  school: nextEduBg || null,
                  preferredAreas: st.preferredAreas,
                  subjects: st.subjects,
                  classes: st.classes,
                  expectedSalary: st.expectedSalary,
                  bio: nextBio,
                },
              });
            }
          }
        }

        if (toInsert.length > 0) {
          await client.from(supabaseConfig.tableName).insert(toInsert);
        }

        for (const item of toUpdate) {
          await client.from(supabaseConfig.tableName).update(item.payload).eq('id', item.id);
        }

        setLastSheetSyncTime(new Date().toLocaleTimeString());
        if (toInsert.length > 0 || toUpdate.length > 0 || !silent) {
          await fetchTutorsFromSupabase(true);
          if (!silent) {
            triggerToast(`Synced! New: ${toInsert.length}, Updated: ${toUpdate.length}`);
          }
        }
      } catch {
        if (!silent) triggerToast('Google Sheet Sync failed. Check link sharing permission.');
      }
    },
    [
      sheetUrl,
      parseMatrixToTutors,
      deletedPhones,
      getSupabaseClient,
      supabaseConfig.tableName,
      normalizeTutorRow,
      fetchTutorsFromSupabase,
      triggerToast,
    ]
  );

  // Initial Load & 30-second Live Watcher
  useEffect(() => {
    fetchTutorsFromSupabase(false).then(() => {
      syncGoogleSheetToSupabase(true);
    });
    fetchRequestsFromSupabase(true);
    fetchPaymentsFromSupabase(true);
    const interval = setInterval(() => {
      syncGoogleSheetToSupabase(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [
    fetchTutorsFromSupabase,
    syncGoogleSheetToSupabase,
    fetchRequestsFromSupabase,
    fetchPaymentsFromSupabase,
  ]);

  // Add Manual Request Handler (Saves all Guardian Requirements directly to Supabase guardian_requests)
  const handleAddManualRequest = async () => {
    if (!newRequestForm.studentName.trim() && !newRequestForm.guardianName.trim()) {
      triggerToast('Student বা Guardian এর নাম লিখুন!');
      return;
    }
    const reqCode = (
      newRequestForm.code.trim() || `AT${Math.floor(1000 + Math.random() * 9000)}`
    ).trim();
    const cleanContact =
      formatBdPhoneNumbers(newRequestForm.contact).localWithZero ||
      newRequestForm.contact.trim() ||
      'Not Provided';

    const preferredGender = newRequestForm.preferredGender || 'Any';
    const preferredDays = newRequestForm.preferredDays || '4 Days/Week';
    const tuitionType = newRequestForm.tuitionType || 'Home Tuition';
    const schedStr = `${preferredDays} (${preferredGender})`;

    const combinedAreas = Array.from(
      new Set([
        ...newRequestForm.areas,
        ...(newRequestForm.location.trim()
          ? ensureArray(newRequestForm.location.trim())
          : []),
      ])
    );
    const locationDisplay =
      combinedAreas.length > 0 ? combinedAreas.join(', ') : 'Dhanmondi (General)';

    const salaryStr =
      newRequestForm.salary.trim() && newRequestForm.salary.trim() !== 'Negotiable'
        ? newRequestForm.salary.trim()
        : Number(newRequestForm.salaryBudgetCap) < 25000
        ? `BDT ${Number(newRequestForm.salaryBudgetCap).toLocaleString()}/mo`
        : 'Negotiable';

    const eduMed = newRequestForm.educationMedium || 'Any';
    const item: TuitionRequest = {
      id: reqCode,
      code: reqCode,
      studentName: newRequestForm.studentName.trim() || 'Student',
      guardianName: newRequestForm.guardianName.trim() || 'Guardian',
      className: newRequestForm.className.trim() || 'Class 9',
      educationMedium: eduMed,
      location: locationDisplay,
      areas: combinedAreas,
      preferredVarsity: newRequestForm.preferredVarsity.trim() || 'All Universities',
      preferredDepartment: newRequestForm.preferredDepartment.trim() || 'All Departments',
      preferredGender,
      tuitionType,
      preferredDays,
      schedule: schedStr,
      salary: salaryStr,
      salaryBudgetCap: Number(newRequestForm.salaryBudgetCap) || 25000,
      contact: cleanContact,
      notes: newRequestForm.notes.trim() || '""',
      subjects: newRequestForm.subjects,
    };

    const noteWithEdu = [
      eduMed && eduMed !== 'Any' ? `[EDU_BG:${eduMed}]` : '',
      newRequestForm.notes.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    const dbPayload = {
      id: reqCode,
      guardianName: item.guardianName,
      studentName: item.studentName,
      className: item.className,
      subjects: item.subjects,
      preferredGender: item.preferredGender,
      preferredUniversity: item.preferredVarsity,
      preferredDepartment: item.preferredDepartment,
      tuitionArea: item.location,
      salaryRange: item.salary,
      preferredDays: item.preferredDays,
      tuitionType: item.tuitionType,
      guardianPhone: item.contact,
      note: noteWithEdu,
    };

    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from(supabaseConfig.requestsTableName)
        .upsert([dbPayload], { onConflict: 'id' });
      if (error) {
        triggerToast(`Supabase Save Error: ${error.message}`);
        return;
      }
      await fetchRequestsFromSupabase(true);
    } else {
      setTuitionRequests((prev) => [item, ...prev]);
    }

    setNewRequestForm({
      ...initialRequestForm,
      code: `AT${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setAddRequestModalOpen(false);
    triggerToast('নতুন গার্ডিয়ান রিকোয়েস্ট সুপাবেসে সংরক্ষিত হয়েছে!');
  };

  // Delete Request Handler (Deletes directly from Supabase guardian_requests)
  const handleDeleteRequest = async (reqId: number | string) => {
    setTuitionRequests((prev) => prev.filter((r) => r.id !== reqId && r.code !== reqId));
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from(supabaseConfig.requestsTableName)
        .delete()
        .eq('id', String(reqId));
      if (error) {
        triggerToast(`Supabase Delete Error: ${error.message}`);
        return;
      }
      await fetchRequestsFromSupabase(true);
    }
    triggerToast('রিকোয়েস্ট সুপাবেস থেকে মুছে ফেলা হয়েছে!');
  };

  // Match Tutors Now from Request Card (populates all Guardian Requirement filters)
  const handleMatchFromRequest = (req: TuitionRequest) => {
    const reqAreas =
      req.areas && req.areas.length > 0
        ? req.areas
        : (req.location || '').replace(/\(.*?\)/g, '').trim()
        ? ensureArray((req.location || '').replace(/\(.*?\)/g, '').trim())
        : [];

    const schedLower = String(req.schedule || '').toLowerCase();
    const typeLower = String(req.tuitionType || '').toLowerCase();
    let matchedType = 'Any';
    if (typeLower.includes('online') || schedLower.includes('online')) {
      matchedType = 'Online Tuition';
    } else if (typeLower.includes('batch') || schedLower.includes('batch')) {
      matchedType = 'Batch Tuition';
    } else if (typeLower.includes('home') || schedLower.includes('home')) {
      matchedType = 'Home Tuition';
    }

    let matchedDays = 'Any';
    const daySource = `${req.preferredDays || ''} ${req.schedule || ''}`;
    const dayMatch = daySource.match(/\b([3-6])\s*days?\/week\b/i);
    if (dayMatch && !String(req.preferredDays || '').toLowerCase().startsWith('any')) {
      matchedDays = `${dayMatch[1]} Days/Week`;
    }

    const matchedGender =
      req.preferredGender === 'Male' || req.preferredGender === 'Female'
        ? req.preferredGender
        : 'Any';

    const salBounds = parseSalaryRangeBounds(req.salary, 0);
    const budgetCap =
      req.salaryBudgetCap && req.salaryBudgetCap < 25000
        ? req.salaryBudgetCap
        : salBounds.hasSalary
        ? salBounds.max
        : 25000;

    const updatedReq: RequirementsState = {
      ...requirements,
      guardianName: req.guardianName || 'Mr. Hasan',
      batchCode: req.code || 'AT9832',
      selectedClass: req.className || 'All Classes',
      selectedEducationMedium: req.educationMedium || 'Any',
      selectedSubjects: Array.isArray(req.subjects) ? req.subjects : [],
      preferredGender: matchedGender,
      selectedUniversity:
        req.preferredVarsity && req.preferredVarsity !== 'All Universities'
          ? req.preferredVarsity
          : 'All Universities',
      selectedDepartment:
        req.preferredDepartment && req.preferredDepartment !== 'All Departments'
          ? req.preferredDepartment
          : 'All Departments',
      selectedAreas: reqAreas,
      salaryBudgetCap: budgetCap,
      tuitionType: matchedType,
      preferredDays: matchedDays,
    };
    setRequirements(updatedReq);
    setAppliedRequirements(updatedReq);
    setActiveTab('find');
    triggerToast(`Matching Tutors for ${req.code} (${req.studentName})...`);
  };

  // Open Edit Payment Modal
  const handleOpenEditPaymentModal = (rec: PaymentRecord) => {
    setEditingPaymentId(rec.id);
    setNewPaymentForm({
      tuitionCode: rec.tuitionCode || 'AT9832',
      tutorName: rec.tutorName || '',
      tutorPhone: rec.tutorPhone || '',
      tutorUniversity: rec.tutorUniversity || '',
      studentName: rec.studentName || '',
      guardianName: rec.guardianName || '',
      guardianPhone: rec.guardianPhone || '',
      studentClass: rec.studentClass || 'Class 9',
      educationMedium: rec.educationMedium || 'Bangla Medium',
      subjects: rec.subjects || '',
      area: rec.area || 'Dhanmondi',
      joiningDate: rec.joiningDate || new Date().toISOString().slice(0, 10),
      monthlyFee: rec.monthlyFee ?? 8000,
      commissionPercentage: rec.commissionPercentage ?? 100,
      payableAmount: rec.payableAmount ?? rec.monthlyFee ?? 8000,
      paidAmount: rec.paidAmount ?? 0,
      paymentMethod: rec.paymentMethod || 'bKash',
      paymentNote: rec.paymentNote || '',
    });
    setAddPaymentModalOpen(true);
  };

  // Add or Update Payment Record Handler (Saves directly to Supabase payments_ledger)
  const handleAddPaymentRecord = async () => {
    if (!newPaymentForm.tutorName.trim()) {
      triggerToast('Tutor Name দেওয়া আবশ্যক!');
      return;
    }
    if (!newPaymentForm.studentName.trim()) {
      triggerToast('Student Name দেওয়া আবশ্যক!');
      return;
    }
    const fee = sanitizeNumber(newPaymentForm.monthlyFee, 0);
    const commPct = sanitizeNumber(newPaymentForm.commissionPercentage, 100);
    const payable = sanitizeNumber(
      newPaymentForm.payableAmount,
      Math.round((fee * commPct) / 100) || fee
    );
    const paid = sanitizeNumber(newPaymentForm.paidAmount, 0);
    const due = Math.max(0, payable - paid);
    const joinDate = newPaymentForm.joiningDate || new Date().toISOString().slice(0, 10);
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const cleanPhone =
      formatBdPhoneNumbers(newPaymentForm.tutorPhone).localWithZero ||
      newPaymentForm.tutorPhone.trim();
    const cleanGuardianPhone =
      formatBdPhoneNumbers(newPaymentForm.guardianPhone).localWithZero ||
      newPaymentForm.guardianPhone.trim();

    const packedUniversityMeta = [
      newPaymentForm.guardianName.trim()
        ? `[G_NAME:${newPaymentForm.guardianName.trim()}]`
        : '',
      cleanGuardianPhone ? `[G_PHONE:${cleanGuardianPhone}]` : '',
      newPaymentForm.educationMedium
        ? `[MEDIUM:${newPaymentForm.educationMedium}]`
        : '',
      newPaymentForm.subjects.trim() ? `[SUBJ:${newPaymentForm.subjects.trim()}]` : '',
      `[COMM_PCT:${commPct}]`,
      `[PAYABLE:${payable}]`,
      newPaymentForm.paymentMethod ? `[METHOD:${newPaymentForm.paymentMethod}]` : '',
      newPaymentForm.paymentNote.trim()
        ? `[NOTE:${newPaymentForm.paymentNote.trim()}]`
        : '',
      newPaymentForm.tutorUniversity.trim(),
    ]
      .filter(Boolean)
      .join(' • ');

    const dbPayload = {
      code: newPaymentForm.tuitionCode.trim() || 'AT9832',
      tutorName: newPaymentForm.tutorName.trim(),
      tutorPhone: cleanPhone,
      tutorUniversity: packedUniversityMeta,
      studentName: newPaymentForm.studentName.trim() || 'Student',
      studentClass: newPaymentForm.studentClass.trim() || 'Class 9',
      tuitionArea: newPaymentForm.area.trim() || 'Dhaka',
      joiningDate: joinDate,
      isNewThisMonth: joinDate.startsWith(currentMonthPrefix),
      monthlyFee: fee,
      paidAmount: paid,
      dueAmount: due,
      status: due <= 0 ? 'paid' : 'due',
    };

    const client = getSupabaseClient();
    if (client) {
      if (editingPaymentId !== null) {
        const { error } = await client
          .from(supabaseConfig.paymentsTableName)
          .update(dbPayload)
          .eq('id', editingPaymentId);
        if (error) {
          triggerToast(`Supabase Update Error: ${error.message}`);
          return;
        }
      } else {
        const { error } = await client
          .from(supabaseConfig.paymentsTableName)
          .insert([dbPayload]);
        if (error) {
          triggerToast(`Supabase Save Error: ${error.message}`);
          return;
        }
      }
      await fetchPaymentsFromSupabase(true);
    } else {
      const item: PaymentRecord = {
        id: editingPaymentId ?? Date.now(),
        tuitionCode: dbPayload.code,
        tutorName: dbPayload.tutorName,
        tutorPhone: dbPayload.tutorPhone,
        tutorUniversity: newPaymentForm.tutorUniversity.trim(),
        studentName: dbPayload.studentName,
        guardianName: newPaymentForm.guardianName.trim(),
        guardianPhone: cleanGuardianPhone,
        studentClass: dbPayload.studentClass,
        educationMedium: newPaymentForm.educationMedium,
        subjects: newPaymentForm.subjects.trim(),
        area: dbPayload.tuitionArea,
        joiningDate: dbPayload.joiningDate,
        monthlyFee: fee,
        commissionPercentage: commPct,
        payableAmount: payable,
        paidAmount: paid,
        dueAmount: due,
        paymentMethod: newPaymentForm.paymentMethod,
        paymentNote: newPaymentForm.paymentNote.trim(),
        status: due <= 0 ? 'Fully Paid' : 'Pending Due',
      };
      if (editingPaymentId !== null) {
        setPaymentRecords((prev) =>
          prev.map((p) => (p.id === editingPaymentId ? item : p))
        );
      } else {
        setPaymentRecords((prev) => [item, ...prev]);
      }
    }
    setEditingPaymentId(null);
    setNewPaymentForm({
      ...initialPaymentForm,
      tuitionCode: `AT${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setAddPaymentModalOpen(false);
    triggerToast(
      editingPaymentId !== null
        ? 'পেমেন্ট রেকর্ড সুপাবেসে আপডেট হয়েছে!'
        : 'পেমেন্ট রেকর্ড সুপাবেসে সংরক্ষিত হয়েছে!'
    );
  };

  // Delete Payment Record Handler (Deletes directly from Supabase payments_ledger)
  const handleDeletePaymentRecord = async (recId: number | string) => {
    setPaymentRecords((prev) => prev.filter((p) => p.id !== recId));
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from(supabaseConfig.paymentsTableName)
        .delete()
        .eq('id', recId);
      if (error) {
        triggerToast(`Supabase Delete Error: ${error.message}`);
        return;
      }
      await fetchPaymentsFromSupabase(true);
    }
    triggerToast('পেমেন্ট রেকর্ড সুপাবেস থেকে মুছে ফেলা হয়েছে!');
  };

  // Delete Tutor from Supabase & Dashboard
  const handleDeleteTutor = async (tutor: Tutor) => {
    if (!tutor) return;
    const cleanPhone = formatBdPhoneNumbers(tutor.phone).localWithZero;

    setTutors((prev) => prev.filter((t) => t.id !== tutor.id && t.phone !== cleanPhone));
    if (selectedTutorForProfile && selectedTutorForProfile.id === tutor.id) {
      setSelectedTutorForProfile(null);
    }

    if (cleanPhone) {
      const updatedBlacklist = Array.from(new Set([...deletedPhones, cleanPhone]));
      setDeletedPhones(updatedBlacklist);
      localStorage.setItem('at_deleted_phones_v5', JSON.stringify(updatedBlacklist));
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from(supabaseConfig.tableName).delete().eq('id', tutor.id);
        if (cleanPhone) {
          await client.from(supabaseConfig.tableName).delete().eq('phone', cleanPhone);
        }
        triggerToast(`"${tutor.name}" সুপাবেস এবং ড্যাশবোর্ড থেকে ডিলিট করা হয়েছে!`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        triggerToast(`Delete Error: ${message}`);
      }
    } else {
      triggerToast(`"${tutor.name}" ডিলিট করা হয়েছে!`);
    }
  };

  // Manual Add Tutor
  const handleManualAddTutor = async () => {
    if (!newTutorForm.name.trim() || !newTutorForm.phone.trim()) {
      triggerToast('Teacher name এবং Contacts (ফোন নম্বর) দেওয়া আবশ্যক!');
      return;
    }
    const phoneObj = formatBdPhoneNumbers(newTutorForm.phone);
    const rawRange = newTutorForm.salaryRange.trim();
    const cleanRange = rawRange ? rawRange : 'Not Provided';
    const allNums = rawRange.replace(/,/g, '').match(/\d+/g);
    const salNum =
      allNums && allNums.length > 0 ? Math.max(...allNums.map((n) => parseInt(n, 10))) : 0;
    const chosenType = newTutorForm.tuitionType || 'Home Tuition';
    const chosenDays = newTutorForm.preferredDays || 'Negotiable';
    const chosenEduBg = (newTutorForm.educationBackground || 'Bangla Version').trim();
    const storedBio = [
      cleanRange !== 'Not Provided' ? `[SALARY_RANGE:${cleanRange}]` : '',
      chosenType ? `[TUITION_TYPE:${chosenType}]` : '',
      chosenDays && chosenDays !== 'Negotiable' ? `[PREFERRED_DAYS:${chosenDays}]` : '',
      chosenEduBg ? `[EDU_BG:${chosenEduBg}]` : '',
      newTutorForm.bio.trim(),
    ]
      .filter(Boolean)
      .join(' • ');

    const cleanedName = cleanTutorName(newTutorForm.name.trim());
    const payload = {
      name: cleanedName,
      gender: newTutorForm.gender || 'Male',
      phone: phoneObj.localWithZero,
      presentAddress: cleanAddressText(newTutorForm.presentAddress) || 'Not Specified',
      university: newTutorForm.university.trim() || 'Not Specified',
      department: newTutorForm.department.trim() || 'Not Specified',
      school: chosenEduBg || null,
      preferredAreas: cleanAreasList(newTutorForm.preferredAreas),
      subjects: ensureArray(newTutorForm.subjects),
      classes: normalizeClassString(newTutorForm.classes),
      expectedSalary: salNum >= 500 ? salNum : 0,
      bio: storedBio,
      avatar: getCleanAvatarUrl(cleanedName),
    };

    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from(supabaseConfig.tableName).insert([payload]);
      if (error) {
        triggerToast(`DB Insert Error: ${error.message}`);
        return;
      }
      await fetchTutorsFromSupabase(true);
    } else {
      setTutors((prev) => [normalizeTutorRow({ id: Date.now(), ...payload }), ...prev]);
    }

    setNewTutorForm(initialNewTutorForm);
    setAddTutorModalOpen(false);
    triggerToast('নতুন টিউটর সফলভাবে যুক্ত হয়েছে!');
  };

  // Upload CSV File Handler (Non-destructive Merge / Upsert into Supabase)
  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let allParsed: Tutor[] = [];
    for (const file of files) {
      const text = await file.text();
      const matrix = parseCsvTextToMatrix(text);
      const items = parseMatrixToTutors(matrix);
      allParsed = [...allParsed, ...items];
    }

    if (allParsed.length === 0) {
      triggerToast('CSV ফাইলে কোনো বৈধ টিউটর পাওয়া যায়নি!');
      e.target.value = '';
      return;
    }

    const mergedMap = new Map<string, Tutor>();
    allParsed.forEach((t) => {
      if (mergedMap.has(t.phone)) {
        const prev = mergedMap.get(t.phone)!;
        mergedMap.set(t.phone, {
          ...prev,
          ...t,
          subjects: t.subjects.length > 0 ? t.subjects : prev.subjects,
          preferredAreas: t.preferredAreas.length > 0 ? t.preferredAreas : prev.preferredAreas,
          classes: t.classes.length > 0 ? t.classes : prev.classes,
          bio: t.bio || prev.bio,
        });
      } else {
        mergedMap.set(t.phone, t);
      }
    });

    const finalList = Array.from(mergedMap.values());
    const uploadedPhoneSet = new Set(finalList.map((t) => t.phone));

    // If any uploaded tutor was previously deleted, restore them from deletedPhones blacklist
    if (deletedPhones.some((p) => uploadedPhoneSet.has(p))) {
      const updatedDeleted = deletedPhones.filter((p) => !uploadedPhoneSet.has(p));
      setDeletedPhones(updatedDeleted);
      localStorage.setItem('at_deleted_phones_v5', JSON.stringify(updatedDeleted));
    }

    const client = getSupabaseClient();
    if (client) {
      setIsLoadingDb(true);
      try {
        // Fetch existing rows so we only replace matching phone numbers and NEVER wipe other existing tutors
        const { data: existingRows, error: fetchErr } = await client
          .from(supabaseConfig.tableName)
          .select('id, phone');
        if (fetchErr) throw fetchErr;

        const matchingIdsToDelete: Array<number | string> = [];
        (existingRows || []).forEach((r: Record<string, unknown>) => {
          const normPhone = formatBdPhoneNumbers(r.phone || '').localWithZero;
          if (normPhone && uploadedPhoneSet.has(normPhone) && r.id !== undefined && r.id !== null) {
            matchingIdsToDelete.push(r.id as number | string);
          }
        });

        if (matchingIdsToDelete.length > 0) {
          for (let i = 0; i < matchingIdsToDelete.length; i += 100) {
            const chunk = matchingIdsToDelete.slice(i, i + 100);
            const { error: delErr } = await client
              .from(supabaseConfig.tableName)
              .delete()
              .in('id', chunk);
            if (delErr) throw delErr;
          }
        }

        // Reverse order before inserting so row #1 of the CSV gets the highest ID and appears first (id DESC)
        const dbRows = [...finalList].reverse().map((t) => ({
          name: t.name,
          gender: t.gender,
          phone: t.phone,
          presentAddress: t.presentAddress,
          university: t.university,
          department: t.department,
          school: t.educationBackground || null,
          preferredAreas: t.preferredAreas,
          subjects: t.subjects,
          classes: t.classes,
          expectedSalary: t.expectedSalary,
          bio: t.bio,
          avatar: t.avatar,
        }));

        for (let i = 0; i < dbRows.length; i += 100) {
          const chunk = dbRows.slice(i, i + 100);
          const { error: insErr } = await client.from(supabaseConfig.tableName).insert(chunk);
          if (insErr) throw insErr;
        }

        const refreshed = await fetchTutorsFromSupabase(true);
        triggerToast(
          `CSV আপলোড সফল! আপলোডেড: ${finalList.length} জন • মোট টিউটর: ${refreshed.length} জন`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        triggerToast(`Upload Error: ${message}`);
      } finally {
        setIsLoadingDb(false);
      }
    } else {
      setTutors((prev) => {
        const remaining = prev.filter((p) => !uploadedPhoneSet.has(p.phone));
        return [...finalList, ...remaining];
      });
      triggerToast(`${finalList.length} জন টিউটর লোড হয়েছে!`);
    }
    e.target.value = '';
  };

  // Clean Standardized Dropdown Lists
  const uniqueUniversities = useMemo(() => {
    return UNIVERSITY_CATALOG.map((u) => u.label);
  }, []);

  const uniqueDepartments = useMemo(() => {
    return DEPARTMENT_CATALOG.map((d) => d.label);
  }, []);

  const uniqueAreas = useMemo(() => {
    const mapByLower = new Map<string, string>();
    CANONICAL_AREA_MAP.forEach((entry) => {
      mapByLower.set(entry.canonical.toLowerCase(), entry.canonical);
    });
    DHAKA_AREAS.forEach((a) => {
      const norm = normalizeSingleAreaToken(a) || a;
      mapByLower.set(norm.toLowerCase(), norm);
    });
    tutors.forEach((t) => {
      (t.preferredAreas || []).forEach((a) => {
        const clean = a.trim();
        if (clean && clean.length >= 2 && !mapByLower.has(clean.toLowerCase())) {
          mapByLower.set(clean.toLowerCase(), clean);
        }
      });
    });
    return Array.from(mapByLower.values()).sort((a, b) => a.localeCompare(b));
  }, [tutors]);

  const updateRequirementsFilter = useCallback(
    (updater: Partial<RequirementsState> | ((prev: RequirementsState) => RequirementsState)) => {
      setRequirements((prev) =>
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      );
    },
    []
  );

  // Matched & Filtered Tutors Calculation
  const matchedTutors = useMemo(() => {
    const activeFilter = appliedRequirements;

    return tutors
      .filter((t) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const hay = `${t.name} ${t.university} ${t.department} ${t.presentAddress} ${t.phone} ${
            t.educationBackground || ''
          } ${(t.preferredAreas || []).join(' ')} ${(t.subjects || []).join(' ')} ${(
            t.classes || []
          ).join(' ')} ${t.salaryRange || ''} ${t.tuitionType || ''} ${
            t.preferredDays || ''
          }`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        if (activeFilter.selectedClass && activeFilter.selectedClass !== 'All Classes') {
          const classMatch = getTutorClassMatchResult(t.classes, activeFilter.selectedClass);
          if (!classMatch.matches) return false;
        }

        if (
          activeFilter.selectedEducationMedium &&
          activeFilter.selectedEducationMedium !== 'Any' &&
          activeFilter.selectedEducationMedium !== 'All Mediums'
        ) {
          const medMatch = getTutorEducationMediumMatch(t, activeFilter.selectedEducationMedium);
          if (!medMatch.matches) return false;
        }

        if (activeFilter.selectedSubjects.length > 0) {
          const tSub = `${(t.subjects || []).join(' ')} ${(t.classes || []).join(' ')} ${
            t.department || ''
          } ${t.bio || ''}`.toLowerCase();
          const hasAny = activeFilter.selectedSubjects.some((s) => {
            const sLower = s.toLowerCase().trim();
            if (sLower.startsWith('all subjects')) {
              return /\b(all|সব)\b/i.test(tSub) || (t.subjects || []).length >= 3;
            }
            const cleanSub = sLower.replace(/\(.*?\)/g, '').trim();
            if (tSub.includes(cleanSub)) return true;
            if (cleanSub === 'general math' || cleanSub === 'math') {
              return /\b(math|maths|mathematics|g\.?\s*math|গণিত)\b/i.test(tSub);
            }
            if (cleanSub === 'higher math') {
              return /\b(higher\s*math|h\.?\s*math|h-math|mathematics|উচ্চতর\s*গণিত)\b/i.test(
                tSub
              );
            }
            if (cleanSub === 'physics') {
              return /\b(physics|phy|physic|পদার্থ)\b/i.test(tSub);
            }
            if (cleanSub === 'chemistry') {
              return /\b(chemistry|chem|chamistry|chemistr|che|রসায়ন)\b/i.test(tSub);
            }
            if (cleanSub === 'biology') {
              return /\b(biology|bio|biolog|botany|zoology|জীববিজ্ঞান)\b/i.test(tSub);
            }
            if (cleanSub === 'english') {
              return /\b(english|eng|englis|ইংরেজি)\b/i.test(tSub);
            }
            if (cleanSub === 'bangla') {
              return /\b(bangla|bengali|bangl|বাংলা)\b/i.test(tSub);
            }
            if (cleanSub === 'accounting') {
              return /\b(accounting|acc|accountin|accunting|accoutinh|হিসাববিজ্ঞান)\b/i.test(tSub);
            }
            if (cleanSub === 'finance') {
              return /\b(finance|fin|financ|financce|fiance|ফিন্যান্স)\b/i.test(tSub);
            }
            if (cleanSub === 'economics') {
              return /\b(economics|economic|econ|অর্থনীতি)\b/i.test(tSub);
            }
            if (cleanSub === 'science') {
              return /\b(science|general\s*science|g\.?\s*science|sci|বিজ্ঞান)\b/i.test(tSub);
            }
            if (cleanSub === 'ict') {
              return /\b(ict|computer|cse|আইসিটি)\b/i.test(tSub);
            }
            return false;
          });
          if (!hasAny) return false;
        }

        if (activeFilter.preferredGender && activeFilter.preferredGender !== 'Any') {
          const tGen = String(t.gender || '').trim().toLowerCase();
          const targetGen = activeFilter.preferredGender.trim().toLowerCase();
          if (tGen !== targetGen) {
            return false;
          }
        }

        if (
          activeFilter.selectedUniversity &&
          activeFilter.selectedUniversity !== 'All Universities'
        ) {
          if (
            !matchesCatalogFilter(t.university, activeFilter.selectedUniversity, UNIVERSITY_CATALOG)
          ) {
            return false;
          }
        }

        if (
          activeFilter.selectedDepartment &&
          activeFilter.selectedDepartment !== 'All Departments'
        ) {
          if (
            !matchesCatalogFilter(t.department, activeFilter.selectedDepartment, DEPARTMENT_CATALOG)
          ) {
            return false;
          }
        }

        if (activeFilter.selectedAreas.length > 0) {
          const tutorCanonicalAreas = cleanAreasList([
            ...(t.preferredAreas || []),
            t.presentAddress,
          ]).map((x) => x.toLowerCase());
          const tAreaRaw = `${(t.preferredAreas || []).join(' ')} ${t.presentAddress}`.toLowerCase();

          const hasArea = activeFilter.selectedAreas.some((selectedArea) => {
            const normSelected = (normalizeSingleAreaToken(selectedArea) || selectedArea).toLowerCase();
            if (tutorCanonicalAreas.includes(normSelected) || tAreaRaw.includes(normSelected)) {
              return true;
            }
            const canonicalEntry = CANONICAL_AREA_MAP.find(
              (c) => c.canonical.toLowerCase() === normSelected
            );
            if (canonicalEntry) {
              return canonicalEntry.aliases.some((alias) => tAreaRaw.includes(alias));
            }
            const keywords = normSelected.split(/\s+/).filter((w) => w.length >= 3);
            return keywords.some((kw) => tAreaRaw.includes(kw));
          });
          if (!hasArea) return false;
        }

        if (
          activeFilter.tuitionType &&
          activeFilter.tuitionType !== 'Any' &&
          activeFilter.tuitionType !== 'All Types'
        ) {
          const tutorTypes = parseTutorTuitionTypes(t.tuitionType, t.bio);
          if (!tutorTypes.has(activeFilter.tuitionType)) {
            return false;
          }
        }

        if (
          activeFilter.preferredDays &&
          activeFilter.preferredDays !== 'Any' &&
          activeFilter.preferredDays !== 'Any Days'
        ) {
          const targetDayMatch = activeFilter.preferredDays.match(/([1-7])/);
          if (targetDayMatch) {
            const targetDay = parseInt(targetDayMatch[1], 10);
            const tutorDays = parseTutorPreferredDays(t.preferredDays, t.bio);
            // If tutor explicitly specified days, require targetDay; if Negotiable (empty set), allow them
            if (tutorDays.size > 0 && !tutorDays.has(targetDay)) {
              return false;
            }
          }
        }

        return true;
      })
      .map((t) => {
        let score = 60;
        const bounds = parseSalaryRangeBounds(t.salaryRange, t.expectedSalary);
        if (activeFilter.selectedClass && activeFilter.selectedClass !== 'All Classes') {
          const classMatch = getTutorClassMatchResult(t.classes, activeFilter.selectedClass);
          score += classMatch.specificityBonus;
        }
        if (
          activeFilter.selectedEducationMedium &&
          activeFilter.selectedEducationMedium !== 'Any' &&
          activeFilter.selectedEducationMedium !== 'All Mediums'
        ) {
          const medMatch = getTutorEducationMediumMatch(t, activeFilter.selectedEducationMedium);
          score += medMatch.bonus;
        }
        if (activeFilter.selectedAreas.length > 0) score += 18;
        if (activeFilter.selectedSubjects.length > 0) score += 12;
        if (activeFilter.selectedUniversity !== 'All Universities') score += 5;
        if (
          activeFilter.tuitionType &&
          activeFilter.tuitionType !== 'Any' &&
          activeFilter.tuitionType !== 'All Types'
        ) {
          score += 5;
        }
        if (
          activeFilter.preferredDays &&
          activeFilter.preferredDays !== 'Any' &&
          activeFilter.preferredDays !== 'Any Days'
        ) {
          score += 8;
        }
        return {
          ...t,
          salaryMin: bounds.min,
          salaryMax: bounds.max,
          hasSalary: bounds.hasSalary,
          matchScore: Math.min(99, score),
        };
      })
      .sort((a, b) => {
        if ((b.matchScore || 0) !== (a.matchScore || 0)) {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        return 0;
      });
  }, [tutors, searchQuery, appliedRequirements]);

  // Filtered Tutor Pool (searches across all tutors by name, university, department, area, phone, subject)
  const filteredPoolTutors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tutors;
    return tutors.filter((t) => {
      const hay = `${t.name} ${t.university} ${t.department} ${t.presentAddress} ${t.phone} ${(
        t.preferredAreas || []
      ).join(' ')} ${(t.subjects || []).join(' ')} ${(t.classes || []).join(' ')} ${
        t.salaryRange || ''
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [tutors, searchQuery]);

  // Filtered Guardian Requests (searches by code, student, guardian, location, class, varsity, department, gender, type, contact, subjects, notes)
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tuitionRequests;
    return tuitionRequests.filter((req) => {
      const hay = `${req.code} ${req.studentName} ${req.guardianName} ${req.className} ${
        req.location
      } ${req.preferredVarsity} ${req.preferredDepartment || ''} ${req.preferredGender || ''} ${
        req.tuitionType || ''
      } ${req.schedule} ${req.salary} ${req.contact} ${req.notes} ${(req.subjects || []).join(
        ' '
      )}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tuitionRequests, searchQuery]);

  // Date-filtered Payment Records (applies before tab filter & KPI cards so KPIs reflect selected date/month/range)
  const dateFilteredPayments = useMemo(() => {
    return paymentRecords.filter((rec) => {
      const joinDate = String(rec.joiningDate || '').trim();
      if (ledgerDateMode === 'date' && ledgerSelectedDate) {
        return joinDate === ledgerSelectedDate;
      }
      if (ledgerDateMode === 'month' && ledgerSelectedMonth) {
        return joinDate.startsWith(ledgerSelectedMonth);
      }
      if (ledgerDateMode === 'range') {
        if (ledgerStartDate && joinDate < ledgerStartDate) return false;
        if (ledgerEndDate && joinDate > ledgerEndDate) return false;
        return true;
      }
      return true;
    });
  }, [
    paymentRecords,
    ledgerDateMode,
    ledgerSelectedDate,
    ledgerSelectedMonth,
    ledgerStartDate,
    ledgerEndDate,
  ]);

  // Filtered Payments Ledger (filters by dateFilteredPayments + ledgerFilter tab + searchQuery)
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    return dateFilteredPayments.filter((rec) => {
      const dueAmt = Math.max(
        0,
        Number(rec.dueAmount) || Math.max(0, (Number(rec.monthlyFee) || 0) - (Number(rec.paidAmount) || 0))
      );
      if (ledgerFilter === 'due' && dueAmt <= 0) return false;
      if (ledgerFilter === 'paid' && dueAmt > 0) return false;
      if (
        ledgerFilter === 'month' &&
        !String(rec.joiningDate || '').startsWith(currentMonthPrefix)
      ) {
        return false;
      }
      if (q) {
        const hay = `${rec.tuitionCode} ${rec.tutorName} ${rec.tutorPhone} ${rec.studentName} ${rec.area} ${rec.joiningDate} ${rec.monthlyFee} ${rec.paidAmount} ${dueAmt} ${rec.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dateFilteredPayments, ledgerFilter, searchQuery]);

  // Open Single Offer Modal
  const handleOpenSingleSms = (tutor: Tutor) => {
    setSelectedTutorForSms(tutor);
    const areaText =
      requirements.selectedAreas.length > 0
        ? requirements.selectedAreas.join(', ')
        : (tutor.preferredAreas && tutor.preferredAreas[0]) || 'Dhaka';
    const subjText =
      requirements.selectedSubjects.length > 0
        ? requirements.selectedSubjects.join(', ')
        : (tutor.subjects && tutor.subjects[0]) || 'All Subjects';

    setSmsText(
      `আসসালামু আলাইকুম ${tutor.name},\nActive Tutors থেকে নতুন একটি টিউশন অফার (${requirements.batchCode}):\n• লোকেশন: ${areaText}\n• বিষয়: ${subjText}\n• বাজেট: BDT ${Number(
        requirements.salaryBudgetCap
      ).toLocaleString()}/mo (${requirements.preferredDays})\nআগ্রহী হলে দ্রুত যোগাযোগ করুন।`
    );
  };

  // Send via WaSender API
  const sendViaWasenderGateway = async (rawPhone: string, messageText: string) => {
    const formatted = formatBdPhoneNumbers(rawPhone);
    if (!formatted.wasenderFormat) {
      triggerToast('সঠিক ফোন নম্বর পাওয়া যায়নি!');
      return;
    }

    if (!wasenderConfig.apiKey) {
      const waLink = `https://wa.me/${formatted.wasenderFormat}?text=${encodeURIComponent(
        messageText
      )}`;
      copyToClipboardSafe(messageText);
      const a = document.createElement('a');
      a.href = waLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      triggerToast(`WaSender ফরম্যাটে (${formatted.wasenderFormat}) হোয়াটসঅ্যাপ ওপেন হয়েছে!`);
      return;
    }

    setIsSendingGateway(true);
    try {
      const response = await fetch(wasenderConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wasenderConfig.apiKey}`,
        },
        body: JSON.stringify({
          to: formatted.wasenderFormat,
          phone: formatted.wasenderFormat,
          number: formatted.wasenderFormat,
          text: messageText,
          message: messageText,
          instance_id: wasenderConfig.instanceId || undefined,
        }),
      });

      if (response.ok) {
        triggerToast(`WaSender মেসেজ সফলভাবে পাঠানো হয়েছে (${formatted.wasenderFormat})!`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      const waLink = `https://wa.me/${formatted.wasenderFormat}?text=${encodeURIComponent(
        messageText
      )}`;
      const a = document.createElement('a');
      a.href = waLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      triggerToast(
        `API রেসপন্স না পাওয়ায় সরাসরি WhatsApp (${formatted.wasenderFormat}) ওপেন করা হয়েছে।`
      );
    } finally {
      setIsSendingGateway(false);
    }
  };

  // Send via Phone SMS Gateway
  const sendViaPhoneSmsGateway = async (rawPhone: string, messageText: string) => {
    const formatted = formatBdPhoneNumbers(rawPhone);
    if (!formatted.localWithZero) {
      triggerToast('সঠিক ফোন নম্বর পাওয়া যায়নি!');
      return;
    }

    if (!smsGatewayConfig.apiKey) {
      const a = document.createElement('a');
      a.href = `sms:${formatted.localWithZero}?body=${encodeURIComponent(messageText)}`;
      a.click();
      triggerToast(`Phone SMS (${formatted.localWithZero}) ওপেন করা হয়েছে!`);
      return;
    }

    setIsSendingGateway(true);
    try {
      const url = `${smsGatewayConfig.apiUrl}?token=${encodeURIComponent(
        smsGatewayConfig.apiKey
      )}&to=${encodeURIComponent(formatted.localWithZero)}&message=${encodeURIComponent(
        messageText
      )}`;
      await fetch(url, { mode: 'no-cors' });
      triggerToast(`Phone SMS পাঠানো হয়েছে (${formatted.localWithZero})!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      triggerToast(`SMS Error: ${message}`);
    } finally {
      setIsSendingGateway(false);
    }
  };

  const isMobileView = deviceMode === 'mobile';
  const isTabletView = deviceMode === 'tablet';
  const isLaptopView = deviceMode === 'laptop';

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50">
      {/* ==================================================================== */}
      {/* AUTO-DETECTED RESPONSIVE CONTAINER (MOBILE • TABLET • LAPTOP)        */}
      {/* ==================================================================== */}
      <div
        className={`flex-1 flex flex-col w-full bg-slate-50 relative ${
          isMobileView
            ? ''
            : 'flex-row h-[100dvh] overflow-hidden'
        }`}
      >
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div
            className={`fixed ${
              isMobileView ? 'bottom-16' : 'bottom-5'
            } right-3 left-3 sm:left-auto sm:right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center justify-between sm:justify-start gap-3 text-xs font-semibold animate-bounce`}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}

        {/* MOBILE TOP BRAND BAR (AUTO-DISPLAYED ON MOBILE SCREENS) */}
        {isMobileView && (
          <div className="sticky top-0 bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 flex-shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Icon name="menu" size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('find');
                  setSearchQuery('');
                  setIsMobileMenuOpen(false);
                }}
                title="Go to Home (Find Tutors)"
                className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-90 transition"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
                  <Icon name="graduationCap" size={18} />
                </div>
                <div className="leading-tight min-w-0">
                  <h1 className="font-extrabold text-sm tracking-tight truncate">
                    Active <span className="text-emerald-400">Tutors</span>
                  </h1>
                  <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase truncate">
                    {lastSheetSyncTime ? `Synced: ${lastSheetSyncTime}` : 'Tuition Management'}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {activeTab === 'find' && (
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 border transition ${
                    isMobileFiltersOpen
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-emerald-400 border-slate-700'
                  }`}
                >
                  <Icon name="sliders" size={13} />
                  <span>{isMobileFiltersOpen ? `Tutors (${matchedTutors.length})` : 'Filters'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="relative h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0"
              >
                <Icon name="bell" size={15} />
                {tuitionRequests.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MOBILE DRAWER BACKDROP */}
        {isMobileView && isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
          />
        )}

        {/* LEFT SIDEBAR (DRAWER IN MOBILE, COMPACT RAIL IN TABLET, FULL SIDEBAR IN LAPTOP) */}
        <aside
          className={`${
            isMobileView
              ? `fixed inset-y-0 left-0 z-50 w-64 ${
                  isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : isTabletView
              ? `static ${isSidebarCollapsed ? 'w-20' : 'w-56'}`
              : `static ${isSidebarCollapsed ? 'w-20' : 'w-64'}`
          } bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 flex-shrink-0 select-none border-r border-slate-800`}
        >
          <div>
            {/* Brand Header + Slide Toggle Button */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('find');
                  setSearchQuery('');
                  setIsMobileMenuOpen(false);
                }}
                title="Go to Home Page (Find Tutors)"
                className="flex items-center gap-3 overflow-hidden text-left cursor-pointer group hover:opacity-95 transition"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 flex-shrink-0 transition">
                  <Icon name="graduationCap" size={22} />
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <div className="leading-tight truncate">
                    <h1 className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-300 transition">
                      Active <span className="text-emerald-400">Tutors</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                      Tuition Management
                    </p>
                  </div>
                )}
              </button>

              {/* CLOSE DRAWER ON MOBILE / SLIDE BUTTON ON TABLET & LAPTOP */}
              <button
                onClick={() => {
                  if (isMobileView) {
                    setIsMobileMenuOpen(false);
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }
                }}
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-colors flex-shrink-0 border border-slate-700"
              >
                {isMobileView ? (
                  <Icon name="x" size={16} />
                ) : (
                  <Icon name={isSidebarCollapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
                )}
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1.5 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('find');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed && !isMobileView
                    ? 'justify-center px-2'
                    : 'justify-between px-3.5'
                } py-3 rounded-xl transition-all ${
                  activeTab === 'find'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name="compass" size={18} />
                  {(!isSidebarCollapsed || isMobileView) && <span>Find Tutors</span>}
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <span className="px-2 py-0.5 text-[10px] rounded-md bg-slate-900/20 font-extrabold">
                    LIVE
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('requests');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed && !isMobileView
                    ? 'justify-center px-2'
                    : 'justify-between px-3.5'
                } py-3 rounded-xl transition-all ${
                  activeTab === 'requests'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name="inbox" size={18} />
                  {(!isSidebarCollapsed || isMobileView) && <span>Requests</span>}
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-md font-extrabold ${
                      activeTab === 'requests'
                        ? 'bg-slate-900/20 text-slate-950'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {tuitionRequests.length} New
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('payments');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed && !isMobileView
                    ? 'justify-center px-2'
                    : 'justify-between px-3.5'
                } py-3 rounded-xl transition-all ${
                  activeTab === 'payments'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name="creditCard" size={18} />
                  {(!isSidebarCollapsed || isMobileView) && <span>Payments Ledger</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pool');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed && !isMobileView
                    ? 'justify-center px-2'
                    : 'justify-between px-3.5'
                } py-3 rounded-xl transition-all ${
                  activeTab === 'pool'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name="users" size={18} />
                  {(!isSidebarCollapsed || isMobileView) && <span>Tutor Pool</span>}
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <span className="text-xs font-bold text-slate-400">{tutors.length}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarCollapsed && !isMobileView
                    ? 'justify-center px-2'
                    : 'justify-between px-3.5'
                } py-3 rounded-xl transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name="settings" size={18} />
                  {(!isSidebarCollapsed || isMobileView) && <span>Settings</span>}
                </div>
                {(!isSidebarCollapsed || isMobileView) && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </nav>
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                AT
              </div>
              {(!isSidebarCollapsed || isMobileView) && (
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">Admin Operations</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {lastSheetSyncTime ? `Synced: ${lastSheetSyncTime}` : 'Auto-Sync Active'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main
          className={`flex-1 flex flex-col min-w-0 ${
            isMobileView ? 'pb-20' : 'h-full overflow-hidden pb-0'
          }`}
        >
          {/* Top Bar for Find Tutor */}
          {activeTab === 'find' && (
            <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 sm:py-3 flex flex-col gap-2.5 flex-shrink-0">
              <div
                className={`flex ${
                  isMobileView
                    ? 'flex-col gap-2'
                    : 'flex-row items-center justify-between gap-3'
                }`}
              >
                {!isMobileView && (
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                        Find Tutor
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Find the right tutor based on guardian requirements
                    </p>
                  </div>
                )}

                <div
                  className={`flex ${
                    isMobileView
                      ? 'flex-col items-stretch gap-2 w-full'
                      : 'flex-row items-center justify-end gap-2'
                  }`}
                >
                  {/* Active Match Batch Box with Switch */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          ACTIVE MATCH BATCH
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">
                        <span className="text-emerald-700 mr-1.5">{requirements.batchCode}</span>
                        <span>{requirements.guardianName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-6 w-px bg-slate-200"></div>
                      <button
                        type="button"
                        onClick={() => {
                          if (tuitionRequests.length > 0) {
                            const currentIndex = tuitionRequests.findIndex(
                              (r) => r.code === requirements.batchCode
                            );
                            const nextReq =
                              tuitionRequests[(currentIndex + 1) % tuitionRequests.length];
                            handleMatchFromRequest(nextReq);
                          } else {
                            setActiveTab('requests');
                          }
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
                        title="Switch Active Batch"
                      >
                        <Icon name="refresh" size={13} />
                        <span>Switch</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className={`relative ${isMobileView ? 'w-full' : isTabletView ? 'w-48' : 'w-60'}`}>
                    <Icon
                      name="search"
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tutor, varsity, phone..."
                      className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* MOBILE SEGMENTED SWITCHER: GUARDIAN REQUIREMENTS vs MATCHED TUTORS */}
              {isMobileView && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                      isMobileFiltersOpen
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon name="sliders" size={13} />
                    <span>ফিল্টার / Requirements</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                      !isMobileFiltersOpen
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon name="users" size={13} />
                    <span>Tutors ({matchedTutors.length})</span>
                  </button>
                </div>
              )}
            </header>
          )}

          {/* Top Bar for Pool only */}
          {activeTab === 'pool' && (
            <header
              className={`bg-white border-b border-slate-200 px-3 sm:px-5 py-3 flex ${
                isMobileView
                  ? 'flex-col gap-2.5'
                  : 'flex-row items-center justify-between gap-2.5'
              } flex-shrink-0`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Tutor Pool Directory
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Total: {tutors.length}
                  </span>
                </div>
                {!isMobileView && (
                  <p className="text-xs text-slate-500">
                    সকল টিউটরের তালিকা পরিচালনা করুন এবং মেসেজ পাঠান
                  </p>
                )}
              </div>

              <div
                className={`flex ${
                  isMobileView ? 'flex-col items-stretch' : 'flex-row items-center'
                } gap-2`}
              >
                <div className={`relative ${isMobileView ? 'w-full' : 'w-52'}`}>
                  <Icon
                    name="search"
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tutor, varsity, phone..."
                    className="pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncGoogleSheetToSupabase(false)}
                    className="flex-1 sm:flex-initial justify-center px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Icon name="refresh" size={14} />
                    <span>Sync</span>
                  </button>

                  <label className="flex-1 sm:flex-initial justify-center px-3 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl cursor-pointer flex items-center gap-1.5 transition">
                    <Icon name="database" size={14} />
                    <span>CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setAddTutorModalOpen(true)}
                    className="flex-1 sm:flex-initial justify-center px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Icon name="userPlus" size={14} />
                    <span>Add Tutor</span>
                  </button>
                </div>
              </div>
            </header>
          )}

          {/* Top Bar for Requests */}
          {activeTab === 'requests' && (
            <header
              className={`bg-white border-b border-slate-200 px-3 sm:px-5 py-3 flex ${
                isMobileView
                  ? 'flex-col gap-2.5'
                  : 'flex-row items-center justify-between gap-2.5'
              } flex-shrink-0`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchRequestsFromSupabase(false)}
                    className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Icon name="refresh" size={13} />
                    <span>Refresh</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {searchQuery.trim()
                      ? `${filteredRequests.length} / ${tuitionRequests.length} Requests`
                      : `${tuitionRequests.length} Requests`}
                  </span>
                </div>

                {isMobileView && (
                  <button
                    onClick={() => setAddRequestModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-full flex items-center gap-1.5 transition"
                  >
                    <Icon name="userPlus" size={13} />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className={`relative ${isMobileView ? 'flex-1' : 'w-56'}`}>
                  <Icon
                    name="search"
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search request, area..."
                    className="pl-9 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>

                {!isMobileView && (
                  <button
                    onClick={() => setAddRequestModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1.5 transition"
                  >
                    <Icon name="userPlus" size={14} />
                    <span>Add Request</span>
                  </button>
                )}
              </div>
            </header>
          )}

          {/* Top Bar for Payments Ledger */}
          {activeTab === 'payments' && (
            <header
              className={`bg-white border-b border-slate-200 px-3 sm:px-5 py-3 flex ${
                isMobileView
                  ? 'flex-col gap-2.5'
                  : 'flex-row items-center justify-between gap-2.5'
              } flex-shrink-0`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchPaymentsFromSupabase(false)}
                    className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Icon name="refresh" size={13} />
                    <span>Refresh</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {searchQuery.trim()
                      ? `${filteredPayments.length} / ${paymentRecords.length} Records`
                      : `${paymentRecords.length} Records`}
                  </span>
                </div>

                {isMobileView && (
                  <button
                    onClick={() => {
                      setEditingPaymentId(null);
                      setNewPaymentForm(initialPaymentForm);
                      setAddPaymentModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-full flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Icon name="plus" size={13} />
                    <span>Add Record</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className={`relative ${isMobileView ? 'flex-1' : 'w-56'}`}>
                  <Icon
                    name="search"
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tutor, code, student..."
                    className="pl-9 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>

                {!isMobileView && (
                  <button
                    onClick={() => {
                      setEditingPaymentId(null);
                      setNewPaymentForm(initialPaymentForm);
                      setAddPaymentModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Icon name="plus" size={14} />
                    <span>Add Record</span>
                  </button>
                )}
              </div>
            </header>
          )}

          {/* TAB 1: FIND TUTORS */}
          {activeTab === 'find' && (
            <div
              className={`flex-1 flex ${
                isMobileView ? 'flex-col' : 'flex-row overflow-hidden'
              } relative`}
            >
              {/* LEFT FILTER PANEL: CLEAN GUARDIAN REQUIREMENTS UI */}
              <div
                className={`${
                  isMobileView
                    ? isMobileFiltersOpen
                      ? 'flex w-full'
                      : 'hidden'
                    : isTabletView
                    ? 'flex w-[300px] border-r border-slate-200 overflow-y-auto'
                    : 'flex w-[380px] border-r border-slate-200 overflow-y-auto'
                } flex-col bg-white p-4 pb-8 space-y-4 flex-shrink-0`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon name="sliders" size={16} />
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Guardian Requirements
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      const resetObj: RequirementsState = {
                        ...requirements,
                        selectedClass: 'All Classes',
                        selectedEducationMedium: 'Any',
                        selectedSubjects: [],
                        preferredGender: 'Any',
                        selectedUniversity: 'All Universities',
                        selectedDepartment: 'All Departments',
                        selectedAreas: [],
                        salaryBudgetCap: 25000,
                        tuitionType: 'Any',
                        preferredDays: 'Any',
                      };
                      setRequirements(resetObj);
                      setAppliedRequirements(resetObj);
                      setManualLocationQuery('');
                      triggerToast('সকল ফিল্টার রিসেট করা হয়েছে!');
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
                  >
                    Reset
                  </button>
                </div>

                {/* 1. Class / Grade */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Class / Grade
                  </label>
                  <select
                    value={requirements.selectedClass}
                    onChange={(e) =>
                      updateRequirementsFilter({ selectedClass: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All Classes">All Classes</option>
                    <option value="HSC 1st Year">HSC 1st Year</option>
                    <option value="HSC 2nd Year">HSC 2nd Year</option>
                    {CLASSES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1B. Select Your Education Background (Medium / Version) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Select Your Education Background (Medium / Version)
                  </label>
                  <select
                    value={requirements.selectedEducationMedium || 'Any'}
                    onChange={(e) =>
                      updateRequirementsFilter({ selectedEducationMedium: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Any">All Mediums / Version (সব মিডিয়াম)</option>
                    <option value="Bangla Version">
                      Bangla Version / Medium (বাংলা ভার্সন / মিডিয়াম)
                    </option>
                    <option value="English Version">
                      English Version (ইংলিশ ভার্সন)
                    </option>
                    <option value="English Medium">
                      English Medium (ইংলিশ মিডিয়াম - O/A Level)
                    </option>
                    <option value="Madrasa Medium">
                      Madrasa Medium (মাদ্রাসা মিডিয়াম)
                    </option>
                  </select>
                </div>

                {/* 2. Subject Names */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Subject Names ({requirements.selectedSubjects.length} selected)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !requirements.selectedSubjects.includes(val)) {
                        updateRequirementsFilter({
                          selectedSubjects: [...requirements.selectedSubjects, val],
                        });
                      }
                      e.target.value = '';
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>
                      + Add Subject / বিষয় যোগ করুন
                    </option>
                    {SUBJECTS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {requirements.selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {requirements.selectedSubjects.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/70 border border-emerald-300 text-emerald-700 rounded-full text-xs font-bold"
                        >
                          {s}
                          <button
                            onClick={() =>
                              updateRequirementsFilter({
                                selectedSubjects: requirements.selectedSubjects.filter(
                                  (item) => item !== s
                                ),
                              })
                            }
                            className="hover:text-rose-600 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Preferred Gender */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Preferred Gender
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
                    {['Any', 'Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateRequirementsFilter({ preferredGender: g })}
                        className={`py-2 text-xs font-extrabold rounded-xl transition ${
                          requirements.preferredGender === g
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Preferred University */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Preferred University
                  </label>
                  <select
                    value={requirements.selectedUniversity}
                    onChange={(e) =>
                      updateRequirementsFilter({ selectedUniversity: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All Universities">All Universities</option>
                    {uniqueUniversities.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Preferred Department */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Preferred Department
                  </label>
                  <select
                    value={requirements.selectedDepartment}
                    onChange={(e) =>
                      updateRequirementsFilter({ selectedDepartment: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="All Departments">All Departments</option>
                    {uniqueDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Tuition Area(s) + Quick Select */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800">
                      Tuition Area(s) ({requirements.selectedAreas.length} selected)
                    </label>
                    {(requirements.selectedAreas.length > 0 || manualLocationQuery.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRequirementsFilter({ selectedAreas: [] });
                          setManualLocationQuery('');
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Manual Location Search & Custom Input */}
                  <div className="relative mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Icon
                          name="search"
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={manualLocationQuery}
                          onChange={(e) => setManualLocationQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = manualLocationQuery.trim();
                              if (val) {
                                const normVal = normalizeSingleAreaToken(val) || val;
                                if (!requirements.selectedAreas.includes(normVal)) {
                                  updateRequirementsFilter({
                                    selectedAreas: [...requirements.selectedAreas, normVal],
                                  });
                                }
                                setManualLocationQuery('');
                              }
                            }
                          }}
                          placeholder="লোকেশন লিখে সার্চ করুন (যেমন: Dhanmondi, Mirpur...)"
                          className="w-full pl-8 pr-7 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        {manualLocationQuery && (
                          <button
                            type="button"
                            onClick={() => setManualLocationQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            <Icon name="x" size={13} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = manualLocationQuery.trim();
                          if (!val) return;
                          const normVal = normalizeSingleAreaToken(val) || val;
                          if (!requirements.selectedAreas.includes(normVal)) {
                            updateRequirementsFilter({
                              selectedAreas: [...requirements.selectedAreas, normVal],
                            });
                          }
                          setManualLocationQuery('');
                        }}
                        className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex-shrink-0 transition shadow-xs"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Live Matching Area Suggestions Dropdown */}
                    {manualLocationQuery.trim().length > 0 && (
                      <div className="mt-1.5 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg divide-y divide-slate-100 z-20">
                        {uniqueAreas
                          .filter(
                            (a) =>
                              a.toLowerCase().includes(manualLocationQuery.trim().toLowerCase()) &&
                              !requirements.selectedAreas.includes(a)
                          )
                          .slice(0, 8)
                          .map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                updateRequirementsFilter({
                                  selectedAreas: [...requirements.selectedAreas, suggestion],
                                });
                                setManualLocationQuery('');
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between transition"
                            >
                              <span className="flex items-center gap-1.5">
                                <Icon name="mapPin" size={12} className="text-emerald-600" />
                                <span>{suggestion}</span>
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600">
                                + Select
                              </span>
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={() => {
                            const val = manualLocationQuery.trim();
                            if (!val) return;
                            if (!requirements.selectedAreas.includes(val)) {
                              updateRequirementsFilter({
                                selectedAreas: [...requirements.selectedAreas, val],
                              });
                            }
                            setManualLocationQuery('');
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70 flex items-center justify-between transition"
                        >
                          <span>Use custom location: &quot;{manualLocationQuery.trim()}&quot;</span>
                          <span className="text-[10px] font-extrabold">+ Add Custom</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Selection */}
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !requirements.selectedAreas.includes(val)) {
                        updateRequirementsFilter({
                          selectedAreas: [...requirements.selectedAreas, val],
                        });
                      }
                      e.target.value = '';
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>
                      + তালিকায় থাকা এলাকা থেকে বেছে নিন (Dropdown)
                    </option>
                    {uniqueAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  {requirements.selectedAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {requirements.selectedAreas.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold"
                        >
                          <Icon name="mapPin" size={12} />
                          <span>{a}</span>
                          <button
                            onClick={() =>
                              updateRequirementsFilter({
                                selectedAreas: requirements.selectedAreas.filter(
                                  (item) => item !== a
                                ),
                              })
                            }
                            className="hover:text-rose-900 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Select Location Chips */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                      Quick Select:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Wari',
                        'Nazira Bazar',
                        'Lalbagh',
                        'Chankharpool',
                        'Puran Dhaka',
                        'Dhanmondi Shukrabad',
                      ].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            if (!requirements.selectedAreas.includes(loc)) {
                              updateRequirementsFilter({
                                selectedAreas: [...requirements.selectedAreas, loc],
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition"
                        >
                          + {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Tuition Type & Preferred Days */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Tuition Type
                    </label>
                    <select
                      value={requirements.tuitionType}
                      onChange={(e) =>
                        updateRequirementsFilter({ tuitionType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Any">All Types</option>
                      <option value="Home Tuition">Home Tuition</option>
                      <option value="Online Tuition">Online Tuition</option>
                      <option value="Batch Tuition">Batch Tuition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Preferred Days
                    </label>
                    <select
                      value={requirements.preferredDays}
                      onChange={(e) =>
                        updateRequirementsFilter({ preferredDays: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Any">Any Days</option>
                      <option value="3 Days/Week">3 Days/Week</option>
                      <option value="4 Days/Week">4 Days/Week</option>
                      <option value="5 Days/Week">5 Days/Week</option>
                      <option value="6 Days/Week">6 Days/Week</option>
                    </select>
                  </div>
                </div>

                {/* 9. Big Green Search Now Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      let nextReq = { ...requirements };
                      const typedLoc = manualLocationQuery.trim();
                      if (typedLoc) {
                        const normLoc = normalizeSingleAreaToken(typedLoc) || typedLoc;
                        if (!nextReq.selectedAreas.includes(normLoc)) {
                          nextReq = {
                            ...nextReq,
                            selectedAreas: [...nextReq.selectedAreas, normLoc],
                          };
                          setRequirements(nextReq);
                        }
                        setManualLocationQuery('');
                      }
                      setAppliedRequirements(nextReq);
                      setIsMobileFiltersOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      triggerToast('ফিল্টার অনুযায়ী টিউটর তালিকা আপডেট করা হয়েছে!');
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                  >
                    <Icon name="search" size={16} />
                    <span>Search Now (খুঁজুন)</span>
                  </button>
                </div>
              </div>

              {/* RIGHT MATCHED TUTORS LIST */}
              <div
                className={`${
                  isMobileView && isMobileFiltersOpen ? 'hidden' : 'flex'
                } flex-1 flex-col ${isMobileView ? '' : 'overflow-hidden'} bg-slate-50`}
              >
                {/* Batch Action Bar */}
                <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          matchedTutors.length > 0 &&
                          selectedTutorIds.length === matchedTutors.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTutorIds(matchedTutors.map((t) => t.id));
                          } else {
                            setSelectedTutorIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Select All</span>
                    </label>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-800">
                      Matched:{' '}
                      <span className="text-emerald-600 font-extrabold">
                        {matchedTutors.length}
                      </span>
                    </span>
                    {!isMobileView && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">
                          Code: {requirements.batchCode} ({requirements.guardianName})
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isMobileView && (
                      <button
                        type="button"
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
                      >
                        <Icon name="sliders" size={12} />
                        <span>Edit Filters</span>
                      </button>
                    )}
                    {isLaptopView && (
                      <span className="text-xs text-slate-500 font-medium">
                        Sorted by Match Score
                      </span>
                    )}
                    {selectedTutorIds.length > 0 && (
                      <button
                        onClick={() => {
                          setBulkSmsText(
                            `আসসালামু আলাইকুম,\nActive Tutors থেকে নতুন টিউশন অফার (${requirements.batchCode})। আগ্রহী হলে দ্রুত যোগাযোগ করুন।`
                          );
                          setBulkSmsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Icon name="send" size={13} />
                        <span>Bulk ({selectedTutorIds.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                <div
                  className={`flex-1 ${
                    isMobileView ? '' : 'overflow-y-auto'
                  } p-3 sm:p-5 grid ${
                    isLaptopView ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
                  } gap-3.5 content-start`}
                >
                  {matchedTutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={tutor.avatar}
                              alt={tutor.name}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                  {tutor.name}
                                </h4>
                                {tutor.gender && tutor.gender !== 'Any' && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                                      tutor.gender === 'Female'
                                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                                    }`}
                                  >
                                    {tutor.gender}
                                  </span>
                                )}
                                {ensureArray(tutor.classes).length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-violet-50 text-violet-700 border border-violet-200">
                                    Class: {ensureArray(tutor.classes).slice(0, 2).join(', ')}
                                  </span>
                                )}
                                {tutor.educationBackground && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                    {tutor.educationBackground}
                                  </span>
                                )}
                                {tutor.tuitionType && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {tutor.tuitionType}
                                  </span>
                                )}
                                {tutor.preferredDays && tutor.preferredDays !== 'Negotiable' && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {tutor.preferredDays}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium truncate">
                                Department: <span className="font-bold">{tutor.department}</span>
                              </p>
                              <p className="text-xs text-emerald-700 font-bold truncate">
                                University: {tutor.university}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              ⚡ {tutor.matchScore}%
                            </span>
                            <input
                              type="checkbox"
                              checked={selectedTutorIds.includes(tutor.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTutorIds([...selectedTutorIds, tutor.id]);
                                } else {
                                  setSelectedTutorIds(
                                    selectedTutorIds.filter((id) => id !== tutor.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Present Location & Salary Range Box */}
                        <div className="mt-3.5 grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Present Location
                            </span>
                            <span className="font-bold text-slate-800 truncate block">
                              {tutor.presentAddress || 'Not Specified'}
                            </span>
                          </div>
                          <div className="border-l border-slate-200 pl-2.5 min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Salary Range
                            </span>
                            <span className="font-extrabold text-emerald-700 truncate block">
                              {tutor.salaryRange && tutor.salaryRange !== 'Not Provided'
                                ? `BDT ${tutor.salaryRange}`
                                : 'Not Provided'}
                            </span>
                          </div>
                        </div>

                        {/* Preferred Areas */}
                        <div className="mt-3">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Kon kon area te tuitioni korabe
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {ensureArray(tutor.preferredAreas).length > 0 ? (
                              ensureArray(tutor.preferredAreas).map((area) => (
                                <span
                                  key={area}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold"
                                >
                                  {area}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Not Specified</span>
                            )}
                          </div>
                        </div>

                        {/* Favourite Subject */}
                        <div className="mt-3">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Your Favourite Subject
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {ensureArray(tutor.subjects).length > 0 ? (
                              ensureArray(tutor.subjects).map((subj) => (
                                <span
                                  key={subj}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold"
                                >
                                  {subj}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Not Specified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
                          📞 {tutor.phone}
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => setSelectedTutorForProfile(tutor)}
                            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => handleOpenSingleSms(tutor)}
                            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Icon name="send" size={13} />
                            <span>Send Offer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TUTOR POOL WITH DELETE OPTION */}
          {activeTab === 'pool' && (
            <div className={`flex-1 ${isMobileView ? '' : 'overflow-y-auto'} p-3 sm:p-5`}>
              <div
                className={`grid ${
                  isMobileView
                    ? 'grid-cols-1'
                    : isTabletView
                    ? 'grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                } gap-3.5`}
              >
                {filteredPoolTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={tutor.avatar}
                            alt={tutor.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {tutor.name}
                            </h4>
                            <p className="text-xs text-slate-600 font-semibold truncate">
                              {tutor.department}
                            </p>
                            <p className="text-xs text-emerald-700 font-bold truncate">
                              {tutor.university}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTutor(tutor)}
                          title="Delete from Supabase & Dashboard"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition flex-shrink-0"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>

                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                        <p className="truncate">
                          <span className="text-slate-400 font-bold">Present Location: </span>
                          <span className="font-bold text-slate-800">{tutor.presentAddress}</span>
                        </p>
                        <p>
                          <span className="text-slate-400 font-bold">Contacts: </span>
                          <span className="font-mono font-bold text-emerald-700">
                            {tutor.phone}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedTutorForProfile(tutor)}
                        className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleOpenSingleSms(tutor)}
                        className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      >
                        Send Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GUARDIAN REQUESTS */}
          {activeTab === 'requests' && (
            <div className={`flex-1 ${isMobileView ? '' : 'overflow-y-auto'} p-3 sm:p-5 space-y-4`}>
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center max-w-5xl">
                  <p className="text-sm font-extrabold text-slate-700">No requests found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &quot;Add Request&quot; to create and save a new guardian request in Supabase.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4 max-w-5xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold">
                          {req.code}
                        </span>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {req.studentName}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          • Guardian: {req.guardianName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.preferredGender && req.preferredGender !== 'Any' && (
                          <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-extrabold">
                            {req.preferredGender} Tutor
                          </span>
                        )}
                        {req.tuitionType && req.tuitionType !== 'Any' && (
                          <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
                            {req.tuitionType}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                          {req.salary || 'Negotiable'}
                        </span>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          title="Delete Request from Supabase"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`grid ${
                        isMobileView ? 'grid-cols-2' : 'grid-cols-5'
                      } gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs`}
                    >
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          Class / Grade
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.className}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          Tuition Area(s)
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          Preferred Varsity
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.preferredVarsity}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          Department
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.preferredDepartment || 'All Departments'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          Schedule &amp; Gender
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {req.schedule}
                        </span>
                      </div>
                    </div>

                    {req.subjects && req.subjects.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 px-1">
                        <span className="text-[11px] font-bold text-slate-400 mr-1">
                          Subjects:
                        </span>
                        {req.subjects.map((subj) => (
                          <span
                            key={subj}
                            className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-slate-500 font-medium px-1">{req.notes || '""'}</div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-600">Contact: {req.contact}</span>
                      <button
                        onClick={() => {
                          handleMatchFromRequest(req);
                          setIsMobileFiltersOpen(false);
                        }}
                        className={`${
                          isMobileView ? 'w-full' : 'w-auto'
                        } justify-center px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition`}
                      >
                        <Icon name="compass" size={15} />
                        <span>Match Tutors Now</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: PAYMENTS LEDGER */}
          {activeTab === 'payments' && (
            <div className={`flex-1 ${isMobileView ? '' : 'overflow-y-auto'} p-3 sm:p-5 space-y-4`}>
              {/* Date Filter Bar (তারিখ অনুযায়ী ডাটা দেখার অপশন) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 mr-1">
                    <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon name="sliders" size={14} />
                    </span>
                    <span>Filter by Date (তারিখ অনুযায়ী দেখুন):</span>
                  </div>

                  <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                    {[
                      { id: 'all', label: 'All Dates (সব)' },
                      { id: 'date', label: 'Specific Date (নির্দিষ্ট দিন)' },
                      { id: 'month', label: 'By Month (মাস অনুযায়ী)' },
                      { id: 'range', label: 'Date Range (তারিখ হতে তারিখ)' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setLedgerDateMode(m.id as 'all' | 'date' | 'month' | 'range')
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                          ledgerDateMode === m.id
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Date Picker Inputs based on selected mode */}
                <div className="flex flex-wrap items-center gap-2">
                  {ledgerDateMode === 'date' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Date:</span>
                      <input
                        type="date"
                        value={ledgerSelectedDate}
                        onChange={(e) => setLedgerSelectedDate(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {ledgerDateMode === 'month' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Month:</span>
                      <input
                        type="month"
                        value={ledgerSelectedMonth}
                        onChange={(e) => setLedgerSelectedMonth(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {ledgerDateMode === 'range' && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">From:</span>
                      <input
                        type="date"
                        value={ledgerStartDate}
                        onChange={(e) => setLedgerStartDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-bold text-slate-500">To:</span>
                      <input
                        type="date"
                        value={ledgerEndDate}
                        onChange={(e) => setLedgerEndDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {ledgerDateMode !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLedgerDateMode('all');
                        setLedgerStartDate('');
                        setLedgerEndDate('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-extrabold transition"
                    >
                      Reset Date
                    </button>
                  )}
                </div>
              </div>

              {/* Summary KPI Cards (Now 4 Cards including TOTAL DUE) */}
              <div
                className={`grid ${
                  isMobileView ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'
                } gap-3.5`}
              >
                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      TOTAL FINALIZED
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {dateFilteredPayments.length}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">
                        Tuitions
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Icon name="check" size={14} />
                      <span>Active Agreements</span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Icon name="users" size={18} />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      JOININGS THIS MONTH
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                        {
                          dateFilteredPayments.filter((r) =>
                            String(r.joiningDate || '').startsWith(
                              ledgerDateMode === 'month' && ledgerSelectedMonth
                                ? ledgerSelectedMonth
                                : new Date().toISOString().slice(0, 7)
                            )
                          ).length
                        }
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">
                        Teachers
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
                      <Icon name="zap" size={14} />
                      <span>Active Joinings</span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon name="userPlus" size={18} />
                  </div>
                </div>

                <div className="bg-emerald-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 block">
                    TOTAL PAID VOLUME
                  </span>
                  <div className="my-1.5 text-2xl sm:text-3xl font-black">
                    ৳{' '}
                    {dateFilteredPayments
                      .reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                    <Icon name="check" size={14} />
                    <span>Successfully cleared</span>
                  </p>
                </div>

                {/* NEW CARD: TOTAL DUE (বকেয়া টাকা) */}
                <div className="bg-rose-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-rose-600/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-100 block">
                      TOTAL DUE (বকেয়া টাকা)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold text-white">
                      {
                        dateFilteredPayments.filter(
                          (r) =>
                            Math.max(
                              0,
                              Number(r.dueAmount) ||
                                Math.max(
                                  0,
                                  (Number(r.monthlyFee) || 0) - (Number(r.paidAmount) || 0)
                                )
                            ) > 0
                        ).length
                      }{' '}
                      Due
                    </span>
                  </div>
                  <div className="my-1.5 text-2xl sm:text-3xl font-black">
                    ৳{' '}
                    {dateFilteredPayments
                      .reduce(
                        (sum, r) =>
                          sum +
                          Math.max(
                            0,
                            Number(r.dueAmount) ||
                              Math.max(
                                0,
                                (Number(r.monthlyFee) || 0) - (Number(r.paidAmount) || 0)
                              )
                          ),
                        0
                      )
                      .toLocaleString()}
                  </div>
                  <p className="text-xs font-bold text-rose-100 flex items-center gap-1">
                    <Icon name="zap" size={14} />
                    <span>Pending collection</span>
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: `All Finalized (${dateFilteredPayments.length})` },
                  {
                    id: 'due',
                    label: `Pending Due (${
                      dateFilteredPayments.filter(
                        (r) =>
                          Math.max(
                            0,
                            Number(r.dueAmount) ||
                              Math.max(
                                0,
                                (Number(r.monthlyFee) || 0) - (Number(r.paidAmount) || 0)
                              )
                          ) > 0
                      ).length
                    })`,
                  },
                  {
                    id: 'paid',
                    label: `Fully Paid (${
                      dateFilteredPayments.filter(
                        (r) =>
                          Math.max(
                            0,
                            Number(r.dueAmount) ||
                              Math.max(
                                0,
                                (Number(r.monthlyFee) || 0) - (Number(r.paidAmount) || 0)
                              )
                          ) <= 0
                      ).length
                    })`,
                  },
                  { id: 'month', label: 'This Month' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLedgerFilter(tab.id)}
                    className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-extrabold transition ${
                      ledgerFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Card List for Payments Ledger in Mobile Version */}
              {isMobileView ? (
                <div className="space-y-3">
                  {filteredPayments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <p className="text-sm font-extrabold text-slate-700">No payment records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &quot;Add Record&quot; to save a payment record in Supabase.
                      </p>
                    </div>
                  ) : (
                    filteredPayments.map((rec) => {
                      const recPayable =
                        Number(rec.payableAmount) || Number(rec.monthlyFee) || 0;
                      const recDue = Math.max(
                        0,
                        Number(rec.dueAmount) !== undefined && !Number.isNaN(Number(rec.dueAmount))
                          ? Number(rec.dueAmount)
                          : Math.max(0, recPayable - (Number(rec.paidAmount) || 0))
                      );
                      return (
                        <div
                          key={rec.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-extrabold text-slate-900">
                                {rec.tuitionCode}
                              </span>
                              {rec.paymentMethod && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                                  {rec.paymentMethod}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-semibold">{rec.joiningDate}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Student &amp; Guardian
                              </span>
                              <p className="font-extrabold text-slate-900">{rec.studentName}</p>
                              <p className="text-[11px] font-semibold text-indigo-600">
                                {[rec.studentClass, rec.educationMedium]
                                  .filter(Boolean)
                                  .join(' • ') || 'Class N/A'}
                              </p>
                              <p className="text-slate-500 text-[11px]">{rec.area}</p>
                              {(rec.guardianName || rec.guardianPhone) && (
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  G: {[rec.guardianName, rec.guardianPhone].filter(Boolean).join(' - ')}
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Assigned Tutor
                              </span>
                              <p className="font-extrabold text-slate-900">{rec.tutorName}</p>
                              <p className="text-slate-600 font-mono">{rec.tutorPhone}</p>
                              {rec.tutorUniversity && (
                                <p className="text-[11px] text-slate-500 truncate">
                                  {rec.tutorUniversity}
                                </p>
                              )}
                              {rec.subjects && (
                                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                  Subj: {rec.subjects}
                                </p>
                              )}
                            </div>
                          </div>
                          {rec.paymentNote && (
                            <div className="px-2.5 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 font-medium">
                              Note: {rec.paymentNote}
                            </div>
                          )}
                          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  Salary / Fee
                                </span>
                                <span className="font-extrabold text-slate-900">
                                  ৳ {Number(rec.monthlyFee).toLocaleString()}
                                </span>
                                {rec.commissionPercentage && rec.commissionPercentage < 100 && (
                                  <span className="block text-[10px] font-bold text-indigo-600">
                                    Media ({rec.commissionPercentage}%): ৳{recPayable.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  Paid
                                </span>
                                <span className="font-extrabold text-emerald-700">
                                  ৳ {Number(rec.paidAmount).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  Due
                                </span>
                                <span
                                  className={`font-extrabold ${
                                    recDue > 0 ? 'text-rose-600' : 'text-slate-500'
                                  }`}
                                >
                                  ৳ {recDue.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditPaymentModal(rec)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold inline-flex items-center gap-1"
                              >
                                <Icon name="sliders" size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTutorForSms({
                                    name: rec.tutorName,
                                    phone: rec.tutorPhone,
                                  });
                                  setSmsText(
                                    `আসসালামু আলাইকুম ${rec.tutorName},\nআপনার টিউশন (${rec.tuitionCode} - ${rec.studentName}) পেমেন্ট আপডেট: পরিশোধিত ৳${rec.paidAmount}${
                                      recDue > 0 ? `, বকেয়া (Due): ৳${recDue}` : ' (সম্পূর্ণ পরিশোধিত)'
                                    }। ধন্যবাদ — Active Tutors`
                                  );
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1"
                              >
                                <Icon name="send" size={12} />
                                <span>SMS</span>
                              </button>
                              <button
                                onClick={() => handleDeletePaymentRecord(rec.id)}
                                title="Delete Record from Supabase"
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition inline-flex items-center justify-center"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Tablet & Laptop Ledger Table */
                <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 bg-slate-50/70">
                          <th className="py-3.5 px-4">TUITION CODE</th>
                          <th className="py-3.5 px-4">STUDENT &amp; GUARDIAN</th>
                          <th className="py-3.5 px-4">TUTOR &amp; VARSITY</th>
                          <th className="py-3.5 px-4">JOINING DATE</th>
                          <th className="py-3.5 px-4">SALARY &amp; MEDIA FEE</th>
                          <th className="py-3.5 px-4">PAID AMOUNT</th>
                          <th className="py-3.5 px-4">DUE AMOUNT</th>
                          <th className="py-3.5 px-4 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 px-4 text-center text-slate-400">
                              No payment records found. Click &quot;Add Record&quot; to add and save in Supabase.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map((rec) => {
                            const recPayable =
                              Number(rec.payableAmount) || Number(rec.monthlyFee) || 0;
                            const recDue = Math.max(
                              0,
                              Number(rec.dueAmount) !== undefined &&
                                !Number.isNaN(Number(rec.dueAmount))
                                ? Number(rec.dueAmount)
                                : Math.max(0, recPayable - (Number(rec.paidAmount) || 0))
                            );
                            return (
                              <tr key={rec.id} className="hover:bg-slate-50/80">
                                <td className="py-3.5 px-4 font-extrabold text-slate-900 align-top">
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 inline-block">
                                    {rec.tuitionCode}
                                  </span>
                                  {rec.subjects && (
                                    <span className="block text-[10px] font-bold text-slate-500 mt-1">
                                      {rec.subjects}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 align-top">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="font-extrabold text-slate-900">{rec.studentName}</p>
                                    {rec.studentClass && (
                                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                        {rec.studentClass}
                                      </span>
                                    )}
                                    {rec.educationMedium && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold">
                                        {rec.educationMedium}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 text-[11px] mt-0.5">{rec.area}</p>
                                  {(rec.guardianName || rec.guardianPhone) && (
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      Guardian:{' '}
                                      {[rec.guardianName, rec.guardianPhone]
                                        .filter(Boolean)
                                        .join(' • ')}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 align-top">
                                  <p className="font-extrabold text-slate-900">{rec.tutorName}</p>
                                  <p className="text-slate-600 font-mono">{rec.tutorPhone}</p>
                                  {rec.tutorUniversity && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {rec.tutorUniversity}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-700 align-top">
                                  {rec.joiningDate}
                                </td>
                                <td className="py-3.5 px-4 align-top">
                                  <p className="font-extrabold text-slate-900">
                                    ৳ {Number(rec.monthlyFee).toLocaleString()}
                                  </p>
                                  <p className="text-[11px] font-bold text-indigo-600 mt-0.5">
                                    Payable ({rec.commissionPercentage || 100}%): ৳{' '}
                                    {recPayable.toLocaleString()}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4 align-top">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">
                                      ৳ {Number(rec.paidAmount).toLocaleString()}
                                    </span>
                                    {rec.paymentMethod && (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                                        {rec.paymentMethod}
                                      </span>
                                    )}
                                  </div>
                                  {rec.paymentNote && (
                                    <p className="text-[11px] text-amber-700 font-medium mt-1 max-w-[180px]">
                                      {rec.paymentNote}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 align-top">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg font-extrabold border inline-block ${
                                      recDue > 0
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    ৳ {recDue.toLocaleString()}
                                  </span>
                                  <span
                                    className={`block text-[10px] font-extrabold mt-1 ${
                                      recDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                                    }`}
                                  >
                                    {recDue > 0 ? 'Pending Due' : 'Fully Paid'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right align-top">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditPaymentModal(rec)}
                                      title="Edit / Update Payment Record"
                                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold inline-flex items-center gap-1 transition"
                                    >
                                      <Icon name="sliders" size={12} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedTutorForSms({
                                          name: rec.tutorName,
                                          phone: rec.tutorPhone,
                                        });
                                        setSmsText(
                                          `আসসালামু আলাইকুম ${rec.tutorName},\nআপনার টিউশন (${rec.tuitionCode} - ${rec.studentName}) পেমেন্ট আপডেট: পরিশোধিত ৳${rec.paidAmount}${
                                            recDue > 0
                                              ? `, বকেয়া (Due): ৳${recDue}`
                                              : ' (সম্পূর্ণ পরিশোধিত)'
                                          }। ধন্যবাদ — Active Tutors`
                                        );
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 transition"
                                    >
                                      <Icon name="send" size={12} />
                                      <span>Message</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeletePaymentRecord(rec.id)}
                                      title="Delete Record from Supabase"
                                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition inline-flex items-center justify-center"
                                    >
                                      <Icon name="trash" size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div
              className={`flex-1 ${
                isMobileView ? '' : 'overflow-y-auto'
              } p-3 sm:p-6 space-y-4 max-w-4xl mx-auto w-full`}
            >
              {/* 1. WaSender WhatsApp Gateway Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      WaSender (WhatsApp Gateway Configuration)
                    </h3>
                    <p className="text-xs text-slate-500">
                      0 ছাড়া নম্বর থাকলে অটোমেটিক 0 এবং 880 ফরম্যাটে (যেমন: 88017XXXXXXXX) রূপান্তর
                      হয়ে মেসেজ যাবে
                    </p>
                  </div>
                  {isWasenderLocked ? (
                    <button
                      onClick={() => setIsWasenderLocked(false)}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
                    >
                      Change Keys
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.setItem('at_wasender_cfg_v5', JSON.stringify(wasenderConfig));
                        setIsWasenderLocked(true);
                        triggerToast('WaSender API কনফিগারেশন সেভ ও লক করা হয়েছে!');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Save &amp; Lock
                    </button>
                  )}
                </div>

                <div
                  className={`grid ${
                    isMobileView ? 'grid-cols-1' : 'grid-cols-2'
                  } gap-4 text-xs`}
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WaSender API Endpoint URL
                    </label>
                    <input
                      type="text"
                      disabled={isWasenderLocked}
                      value={wasenderConfig.apiUrl}
                      onChange={(e) =>
                        setWasenderConfig({ ...wasenderConfig, apiUrl: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WaSender API Key / Bearer Token
                    </label>
                    <input
                      type={isWasenderLocked ? 'password' : 'text'}
                      disabled={isWasenderLocked}
                      value={wasenderConfig.apiKey}
                      onChange={(e) => {
                        const updated = { ...wasenderConfig, apiKey: e.target.value };
                        setWasenderConfig(updated);
                        localStorage.setItem('at_wasender_cfg_v5', JSON.stringify(updated));
                      }}
                      placeholder="Paste WaSender API Key..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Phone SMS Gateway Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Phone SMS Gateway Configuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      মোবাইল ফোনে সরাসরি লোকাল SMS (01XXXXXXXXX ফরম্যাটে) পাঠানোর গেটওয়ে
                    </p>
                  </div>
                  {isSmsLocked ? (
                    <button
                      onClick={() => setIsSmsLocked(false)}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
                    >
                      Change Keys
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.setItem('at_smsgw_cfg_v5', JSON.stringify(smsGatewayConfig));
                        setIsSmsLocked(true);
                        triggerToast('SMS Gateway কনফিগারেশন সেভ ও লক করা হয়েছে!');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Save &amp; Lock
                    </button>
                  )}
                </div>

                <div
                  className={`grid ${
                    isMobileView ? 'grid-cols-1' : 'grid-cols-2'
                  } gap-4 text-xs`}
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SMS API URL</label>
                    <input
                      type="text"
                      disabled={isSmsLocked}
                      value={smsGatewayConfig.apiUrl}
                      onChange={(e) =>
                        setSmsGatewayConfig({ ...smsGatewayConfig, apiUrl: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      SMS API Key / Token
                    </label>
                    <input
                      type={isSmsLocked ? 'password' : 'text'}
                      disabled={isSmsLocked}
                      value={smsGatewayConfig.apiKey}
                      onChange={(e) => {
                        const updated = { ...smsGatewayConfig, apiKey: e.target.value };
                        setSmsGatewayConfig(updated);
                        localStorage.setItem('at_smsgw_cfg_v5', JSON.stringify(updated));
                      }}
                      placeholder="Paste SMS Gateway API Key..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Supabase & Google Sheet Hardcoded Configuration */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Supabase &amp; Google Sheet Live Sync (Hardcoded)
                    </h3>
                    <p className="text-xs text-slate-500">
                      আপনার Supabase URL, API Key এবং Google Sheet লিংক হার্ডকোড করা আছে
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSupabaseLocked(!isSupabaseLocked)}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
                  >
                    {isSupabaseLocked ? 'Change URL / Key' : 'Lock'}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      disabled={isSupabaseLocked}
                      value={supabaseConfig.url}
                      onChange={(e) => {
                        const updated = { ...supabaseConfig, url: e.target.value };
                        setSupabaseConfig(updated);
                        localStorage.setItem('at_supabase_cfg_v5', JSON.stringify(updated));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Supabase Publishable / Anon Key
                    </label>
                    <input
                      type={isSupabaseLocked ? 'password' : 'text'}
                      disabled={isSupabaseLocked}
                      value={supabaseConfig.anonKey}
                      onChange={(e) => {
                        const updated = { ...supabaseConfig, anonKey: e.target.value };
                        setSupabaseConfig(updated);
                        localStorage.setItem('at_supabase_cfg_v5', JSON.stringify(updated));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Google Sheet Live Link (Auto-Syncs every 30s)
                    </label>
                    <input
                      type="text"
                      disabled={isSupabaseLocked}
                      value={sheetUrl}
                      onChange={(e) => {
                        setSheetUrl(e.target.value);
                        localStorage.setItem('at_sheet_url_v5', e.target.value);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR (AUTO-DISPLAYED ON MOBILE SCREENS) */}
        {isMobileView && (
          <nav className="fixed bottom-0 inset-x-0 w-full max-w-full z-40 bg-slate-900 text-slate-300 border-t border-slate-800 grid grid-cols-5 h-14 select-none shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('find')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                activeTab === 'find' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="compass" size={16} />
              <span className="truncate">Find</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                activeTab === 'requests' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="inbox" size={16} />
              <span className="truncate">Requests</span>
              {tuitionRequests.length > 0 && (
                <span className="absolute top-1 right-2.5 px-1 min-w-[14px] h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {tuitionRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                activeTab === 'payments' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="creditCard" size={16} />
              <span className="truncate">Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pool')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                activeTab === 'pool' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="users" size={16} />
              <span className="truncate">Pool</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="settings" size={16} />
              <span className="truncate">Settings</span>
            </button>
          </nav>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TUTOR PROFILE MODAL                                                  */}
      {/* ==================================================================== */}
      {selectedTutorForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[88dvh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Icon name="graduationCap" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Teacher Profile Information</h3>
                  <p className="text-xs text-slate-400">
                    টিউটরের বিস্তারিত তথ্য, স্যালারি রেঞ্জ এবং বায়ো
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTutorForProfile(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* 1. Teacher name + Salary Range Badge */}
              <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedTutorForProfile.avatar}
                    alt={selectedTutorForProfile.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Teacher name
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedTutorForProfile.name}
                    </h2>
                  </div>
                </div>
                <div className="text-right bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <span className="text-[9px] text-emerald-700 font-bold uppercase block">
                    Salary Range
                  </span>
                  <span className="text-xs font-extrabold text-emerald-900">
                    {selectedTutorForProfile.salaryRange || 'Not Provided'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Present Location</p>
                  <p className="font-bold text-slate-800 mt-1 text-sm">
                    {selectedTutorForProfile.presentAddress || 'Not Specified'}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Contacts</p>
                  <p className="font-bold text-slate-900 font-mono mt-1 text-sm select-all">
                    {selectedTutorForProfile.phone}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">University name</p>
                  <p className="font-bold text-emerald-700 mt-1 text-sm">
                    {selectedTutorForProfile.university || 'Not Specified'}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Department</p>
                  <p className="font-bold text-slate-800 mt-1 text-sm">
                    {selectedTutorForProfile.department || 'Not Specified'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-2">
                  Kon kon area te tuitioni korabe
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ensureArray(selectedTutorForProfile.preferredAreas).length > 0 ? (
                    ensureArray(selectedTutorForProfile.preferredAreas).map((a) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">Not Specified</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase mb-2">
                  Your Favourite Subject
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ensureArray(selectedTutorForProfile.subjects).length > 0 ? (
                    ensureArray(selectedTutorForProfile.subjects).map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">Not Specified</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                    Class Level
                  </p>
                  {ensureArray(selectedTutorForProfile.classes).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {ensureArray(selectedTutorForProfile.classes).map((cls) => (
                        <span
                          key={cls}
                          className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-400 text-xs">Not Provided</p>
                  )}
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Salary Range</p>
                  <p className="font-bold text-emerald-700 mt-1 text-sm">
                    {selectedTutorForProfile.salaryRange || 'Not Provided'}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tuition Type</p>
                  <p className="font-bold text-indigo-700 mt-1 text-sm">
                    {selectedTutorForProfile.tuitionType || 'Home Tuition'}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Preferred Days</p>
                  <p className="font-bold text-slate-800 mt-1 text-sm">
                    {selectedTutorForProfile.preferredDays || 'Negotiable'}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Education Background (Medium / Version)
                  </p>
                  <p
                    className={`font-bold mt-1 text-sm ${
                      selectedTutorForProfile.educationBackground
                        ? 'text-amber-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {selectedTutorForProfile.educationBackground || 'Not Specified'}
                  </p>
                </div>
              </div>

              {selectedTutorForProfile.bio && selectedTutorForProfile.bio.trim() !== '' && (
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80">
                  <p className="text-[10px] text-amber-800 font-bold uppercase">
                    Bio / Note (আপনার কিছু বলার থাকলে)
                  </p>
                  <p className="font-medium text-slate-800 mt-1 text-xs leading-relaxed">
                    {selectedTutorForProfile.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTutorForProfile(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteTutor(selectedTutorForProfile)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center gap-1.5 transition"
                >
                  <Icon name="trash" size={14} />
                  <span>Delete Tutor</span>
                </button>
              </div>
              <button
                onClick={() => {
                  const t = selectedTutorForProfile;
                  setSelectedTutorForProfile(null);
                  handleOpenSingleSms(t);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Icon name="send" size={14} />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SINGLE MESSAGE DISPATCH MODAL (WASENDER + PHONE SMS)                 */}
      {/* ==================================================================== */}
      {selectedTutorForSms && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Send Message to {selectedTutorForSms.name}
                </h3>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">
                  Local: {formatBdPhoneNumbers(selectedTutorForSms.phone).localWithZero} •
                  WaSender: {formatBdPhoneNumbers(selectedTutorForSms.phone).wasenderFormat}
                </p>
              </div>
              <button
                onClick={() => setSelectedTutorForSms(null)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <textarea
                rows={5}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-800"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => {
                    copyToClipboardSafe(smsText);
                    triggerToast('মেসেজ কপি করা হয়েছে!');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Icon name="copy" size={14} />
                  <span>Copy</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isSendingGateway}
                    onClick={() => sendViaPhoneSmsGateway(selectedTutorForSms.phone, smsText)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Icon name="phone" size={14} />
                    <span>Send Phone SMS</span>
                  </button>

                  <button
                    disabled={isSendingGateway}
                    onClick={() => sendViaWasenderGateway(selectedTutorForSms.phone, smsText)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Icon name="messageCircle" size={14} />
                    <span>Send via WaSender</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BULK MESSAGE MODAL                                                   */}
      {/* ==================================================================== */}
      {bulkSmsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Bulk Dispatch ({selectedTutorIds.length} Tutors)
                </h3>
                <p className="text-xs text-emerald-400">
                  All numbers formatted automatically (+0 &amp; 880)
                </p>
              </div>
              <button
                onClick={() => setBulkSmsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <textarea
                rows={4}
                value={bulkSmsText}
                onChange={(e) => setBulkSmsText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setBulkSmsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const targets = matchedTutors.filter((t) => selectedTutorIds.includes(t.id));
                    for (const t of targets) {
                      await sendViaWasenderGateway(t.phone, bulkSmsText);
                    }
                    setBulkSmsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Icon name="send" size={14} />
                  <span>Send All via WaSender</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD NEW TUTOR MODAL                                                  */}
      {/* ==================================================================== */}
      {addTutorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Tutor</h3>
              <button
                onClick={() => setAddTutorModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">1. Teacher name *</label>
                  <input
                    type="text"
                    value={newTutorForm.name}
                    onChange={(e) => setNewTutorForm({ ...newTutorForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. Mizanur Rahman"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={newTutorForm.gender}
                    onChange={(e) => setNewTutorForm({ ...newTutorForm, gender: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Contacts (Phone) *
                  </label>
                  <input
                    type="text"
                    value={newTutorForm.phone}
                    onChange={(e) => setNewTutorForm({ ...newTutorForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="017XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Present Location
                  </label>
                  <input
                    type="text"
                    value={newTutorForm.presentAddress}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, presentAddress: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. Dhanmondi"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">4. University name</label>
                  <input
                    type="text"
                    value={newTutorForm.university}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, university: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. University of Dhaka"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">5. Department</label>
                  <input
                    type="text"
                    value={newTutorForm.department}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, department: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. CSE / Physics"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Your Education Background
                  </label>
                  <select
                    value={newTutorForm.educationBackground}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, educationBackground: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Bangla Version">Bangla Version / Medium</option>
                    <option value="English Version">English Version</option>
                    <option value="English Medium">English Medium (O/A Level)</option>
                    <option value="Madrasa Medium">Madrasa Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6. Kon kon area te tuitioni korabe
                  </label>
                  <input
                    type="text"
                    value={newTutorForm.preferredAreas.join(', ')}
                    onChange={(e) =>
                      setNewTutorForm({
                        ...newTutorForm,
                        preferredAreas: ensureArray(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Dhanmondi, Azimpur..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    7. Your Favourite Subject
                  </label>
                  <input
                    type="text"
                    value={newTutorForm.subjects.join(', ')}
                    onChange={(e) =>
                      setNewTutorForm({
                        ...newTutorForm,
                        subjects: ensureArray(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Math, Physics, English..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">8. Class Level</label>
                  <input
                    type="text"
                    value={ensureArray(newTutorForm.classes).join(', ')}
                    onChange={(e) =>
                      setNewTutorForm({
                        ...newTutorForm,
                        classes: ensureArray(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. 5-10, 10-12 (SSC & HSC)"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">9. Salary Range</label>
                  <input
                    type="text"
                    value={newTutorForm.salaryRange}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, salaryRange: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. 4-7,000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">10. Tuition Type</label>
                  <select
                    value={newTutorForm.tuitionType}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, tuitionType: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Home Tuition">Home Tuition</option>
                    <option value="Online Tuition">Online Tuition</option>
                    <option value="Batch Tuition">Batch Tuition</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">11. Preferred Days</label>
                  <select
                    value={newTutorForm.preferredDays}
                    onChange={(e) =>
                      setNewTutorForm({ ...newTutorForm, preferredDays: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Negotiable">Negotiable</option>
                    <option value="3 Days/Week">3 Days/Week</option>
                    <option value="4 Days/Week">4 Days/Week</option>
                    <option value="5 Days/Week">5 Days/Week</option>
                    <option value="6 Days/Week">6 Days/Week</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    12. Bio / Note (কিছু থাকলে লিখুন, না থাকলে খালি রাখুন)
                  </label>
                  <input
                    type="text"
                    value={newTutorForm.bio}
                    onChange={(e) => setNewTutorForm({ ...newTutorForm, bio: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="I am an experienced tutor..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setAddTutorModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAddTutor}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Save Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD MANUAL GUARDIAN REQUEST MODAL (ALL GUARDIAN REQUIREMENTS)        */}
      {/* ==================================================================== */}
      {addRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Add Manual Guardian Request</h3>
                <p className="text-[11px] text-emerald-400 font-medium">
                  গার্ডিয়ানের সকল রিকোয়ারমেন্ট পূরণ করে সুপাবেসে সেভ করুন
                </p>
              </div>
              <button
                onClick={() => setAddRequestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Row 1: Basic Student & Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Tuition Code</label>
                  <input
                    type="text"
                    value={newRequestForm.code}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={newRequestForm.studentName}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, studentName: e.target.value })
                    }
                    placeholder="e.g. Rakib"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newRequestForm.guardianName}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, guardianName: e.target.value })
                    }
                    placeholder="e.g. Mr. Hasan"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Guardian Contact (Phone)
                  </label>
                  <input
                    type="text"
                    value={newRequestForm.contact}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, contact: e.target.value })
                    }
                    placeholder="017XXXXXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Class / Grade, Education Medium & Preferred Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Class / Grade
                  </label>
                  <select
                    value={newRequestForm.className}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, className: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="All Classes">All Classes</option>
                    <option value="HSC 1st Year">HSC 1st Year</option>
                    <option value="HSC 2nd Year">HSC 2nd Year</option>
                    {CLASSES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Education Background (Medium)
                  </label>
                  <select
                    value={newRequestForm.educationMedium || 'Any'}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, educationMedium: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Any">All Mediums (Any)</option>
                    <option value="Bangla Version">Bangla Version / Medium</option>
                    <option value="English Version">English Version</option>
                    <option value="English Medium">English Medium (O/A Level)</option>
                    <option value="Madrasa Medium">Madrasa Medium</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Preferred Gender
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                    {['Any', 'Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setNewRequestForm({ ...newRequestForm, preferredGender: g })
                        }
                        className={`py-2 text-xs font-extrabold rounded-lg transition ${
                          newRequestForm.preferredGender === g
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Subject Names (Multi-Select) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-extrabold text-slate-800">
                    Subject Names ({newRequestForm.subjects.length} selected)
                  </label>
                  {newRequestForm.subjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewRequestForm({ ...newRequestForm, subjects: [] })}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !newRequestForm.subjects.includes(val)) {
                      setNewRequestForm({
                        ...newRequestForm,
                        subjects: [...newRequestForm.subjects, val],
                      });
                    }
                    e.target.value = '';
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  <option value="" disabled>
                    + Add Subject / বিষয় যোগ করুন
                  </option>
                  {SUBJECTS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {newRequestForm.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newRequestForm.subjects.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-full text-xs font-bold"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() =>
                            setNewRequestForm({
                              ...newRequestForm,
                              subjects: newRequestForm.subjects.filter((item) => item !== s),
                            })
                          }
                          className="hover:text-rose-600 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 4: Preferred University & Preferred Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Preferred University
                  </label>
                  <select
                    value={newRequestForm.preferredVarsity}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, preferredVarsity: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="All Universities">All Universities</option>
                    {uniqueUniversities.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Preferred Department
                  </label>
                  <select
                    value={newRequestForm.preferredDepartment}
                    onChange={(e) =>
                      setNewRequestForm({
                        ...newRequestForm,
                        preferredDepartment: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="All Departments">All Departments</option>
                    {uniqueDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Tuition Area(s) + Quick Select + Custom Location */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-extrabold text-slate-800">
                    Tuition Area(s) ({newRequestForm.areas.length} selected)
                  </label>
                  {newRequestForm.areas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewRequestForm({ ...newRequestForm, areas: [] })}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !newRequestForm.areas.includes(val)) {
                        setNewRequestForm({
                          ...newRequestForm,
                          areas: [...newRequestForm.areas, val],
                        });
                      }
                      e.target.value = '';
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                  >
                    <option value="" disabled>
                      + Add Location / এলাকা যোগ করুন
                    </option>
                    {uniqueAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newRequestForm.location}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, location: e.target.value })
                    }
                    placeholder="Or type custom area (e.g. Dhanmondi 15)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                {newRequestForm.areas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newRequestForm.areas.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold"
                      >
                        <Icon name="mapPin" size={12} />
                        <span>{a}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewRequestForm({
                              ...newRequestForm,
                              areas: newRequestForm.areas.filter((item) => item !== a),
                            })
                          }
                          className="hover:text-rose-900 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Quick Select:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Wari',
                      'Nazira Bazar',
                      'Lalbagh',
                      'Chankharpool',
                      'Puran Dhaka',
                      'Dhanmondi Shukrabad',
                    ].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          if (!newRequestForm.areas.includes(loc)) {
                            setNewRequestForm({
                              ...newRequestForm,
                              areas: [...newRequestForm.areas, loc],
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition"
                      >
                        + {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 6: Salary Budget Cap Slider & Presets */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-extrabold text-slate-800">Salary Budget Cap</label>
                  <span className="text-xs font-mono font-extrabold text-emerald-600">
                    {Number(newRequestForm.salaryBudgetCap) >= 25000
                      ? newRequestForm.salary || 'Any Budget (Negotiable)'
                      : `BDT ${Number(newRequestForm.salaryBudgetCap).toLocaleString()}/mo`}
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="25000"
                  step="500"
                  value={newRequestForm.salaryBudgetCap}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewRequestForm({
                      ...newRequestForm,
                      salaryBudgetCap: val,
                      salary:
                        val >= 25000 ? 'Negotiable' : `BDT ${val.toLocaleString()}/mo`,
                    });
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Any', val: 25000, text: 'Negotiable' },
                      { label: '3-5,000', val: 5000, text: '3-5,000' },
                      { label: '4-7,000', val: 7000, text: '4-7,000' },
                      { label: '6-10,000', val: 10000, text: '6-10,000' },
                    ].map((preset) => {
                      const isActive = newRequestForm.salary === preset.text;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setNewRequestForm({
                              ...newRequestForm,
                              salaryBudgetCap: preset.val,
                              salary: preset.text,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={newRequestForm.salary}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, salary: e.target.value })
                    }
                    placeholder="Custom Salary (e.g. 8,000 BDT)"
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs w-44"
                  />
                </div>
              </div>

              {/* Row 7: Tuition Type & Preferred Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Tuition Type
                  </label>
                  <select
                    value={newRequestForm.tuitionType}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, tuitionType: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Any">All Types</option>
                    <option value="Home Tuition">Home Tuition</option>
                    <option value="Online Tuition">Online Tuition</option>
                    <option value="Batch Tuition">Batch Tuition</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5">
                    Preferred Days
                  </label>
                  <select
                    value={newRequestForm.preferredDays}
                    onChange={(e) =>
                      setNewRequestForm({ ...newRequestForm, preferredDays: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Any">Any Days</option>
                    <option value="3 Days/Week">3 Days/Week</option>
                    <option value="4 Days/Week">4 Days/Week</option>
                    <option value="5 Days/Week">5 Days/Week</option>
                    <option value="6 Days/Week">6 Days/Week</option>
                  </select>
                </div>
              </div>

              {/* Row 8: Special Notes / Extra Requirements */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  Special Notes / Extra Requirements (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={newRequestForm.notes}
                  onChange={(e) =>
                    setNewRequestForm({ ...newRequestForm, notes: e.target.value })
                  }
                  placeholder="e.g. Experienced female tutor needed, evening time preferred..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setAddRequestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualRequest}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD / EDIT PAYMENT RECORD MODAL (SIMPLE & CLEAN)                     */}
      {/* ==================================================================== */}
      {addPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingPaymentId !== null
                  ? 'Update Payment Record'
                  : 'Add Payment Ledger Record'}
              </h3>
              <button
                onClick={() => {
                  setAddPaymentModalOpen(false);
                  setEditingPaymentId(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tuition Code
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.tuitionCode}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, tuitionCode: e.target.value })
                    }
                    placeholder="e.g. AT9832"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={newPaymentForm.joiningDate}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, joiningDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tutor Name *
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.tutorName}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, tutorName: e.target.value })
                    }
                    placeholder="e.g. Mizanur Rahman"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tutor Phone *
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.tutorPhone}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, tutorPhone: e.target.value })
                    }
                    placeholder="017XXXXXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.studentName}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, studentName: e.target.value })
                    }
                    placeholder="e.g. Rakib"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={newPaymentForm.area}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, area: e.target.value })
                    }
                    placeholder="e.g. Dhanmondi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Fee (BDT)
                  </label>
                  <input
                    type="number"
                    value={newPaymentForm.monthlyFee}
                    onChange={(e) =>
                      setNewPaymentForm({
                        ...newPaymentForm,
                        monthlyFee: e.target.value,
                        payableAmount: sanitizeNumber(e.target.value, 0),
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">
                    Paid Amount (BDT)
                  </label>
                  <input
                    type="number"
                    value={newPaymentForm.paidAmount}
                    onChange={(e) =>
                      setNewPaymentForm({ ...newPaymentForm, paidAmount: e.target.value })
                    }
                    className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-extrabold text-emerald-800"
                  />
                </div>
              </div>

              {/* Simple Live Due Display */}
              {(() => {
                const feeNum = sanitizeNumber(newPaymentForm.monthlyFee, 0);
                const paidNum = sanitizeNumber(newPaymentForm.paidAmount, 0);
                const dueNum = Math.max(0, feeNum - paidNum);
                return (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      dueNum > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="font-bold">Due Amount (বকেয়া টাকা):</span>
                    <span className="text-sm font-black">
                      ৳ {dueNum.toLocaleString()}{' '}
                      <span className="text-[11px] font-bold">
                        ({dueNum > 0 ? 'Pending Due' : 'Fully Paid'})
                      </span>
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAddPaymentModalOpen(false);
                  setEditingPaymentId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentRecord}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {editingPaymentId !== null ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
