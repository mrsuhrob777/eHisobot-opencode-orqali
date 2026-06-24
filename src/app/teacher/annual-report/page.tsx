"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import { Download, Trash2, PlusCircle, MinusCircle, Settings, X, Loader2, Save } from 'lucide-react';
import { getAnnualReportDataBySubject, saveAnnualReport, getAnnualReportById } from "@/actions/reports";
import { getTeacherData } from "@/actions/school-management";
import { t, type Lang } from "@/lib/i18n";
import { useSearchParams } from "next/navigation";

type RowData = {
  id: string;
  n: string;
  sinf: string;
  oquvchiSoni: string;
  [key: string]: string;
};

const initialData: RowData[] = [];

const parseNum = (val: string | number) => {
  if (typeof val === 'number') return val;
  if (val === undefined || val === null || String(val).trim() === '') return 0;
  const clean = String(val).replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

const formatNum = (val: number, precision: number = 1) => {
  if (val === undefined || val === null || isNaN(val)) return '';
  return val.toFixed(precision).replace('.', ',');
};

const getDiff = (v2: string, v1: string) => {
  if ((!v1 || String(v1).trim() === '') && (!v2 || String(v2).trim() === '')) return '';
  const n1 = parseNum(v1);
  const n2 = parseNum(v2);
  const diff = n2 - n1;
  return formatNum(diff, 1);
};

const Cell = ({ value, onChange, onBlur, bold, colorKey, readonly, className = '' }: any) => {
  let bgStyle: React.CSSProperties | undefined;
  let textStyle: React.CSSProperties | undefined;

  if (colorKey && readonly && value !== undefined && value !== '') {
    const num = parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
    if (num > 0) {
      bgStyle = { backgroundColor: '#00b050' };
      textStyle = { color: '#000000' };
    } else if (num < 0) {
      bgStyle = { backgroundColor: '#ff0000' };
      textStyle = { color: '#000000' };
    } else {
      bgStyle = { backgroundColor: '#ffff00' };
      textStyle = { color: '#000000' };
    }
  }

  const inputRef = useRef<HTMLInputElement>(null);

  const inputBgFocus = 'focus:bg-blue-50';
  const inputRingFocus = 'focus:ring-blue-600';

  return (
    <td className={`border border-gray-400 p-0 relative ${className}`} style={bgStyle}>
      {readonly ? (
        <div className={`w-full h-full min-h-[32px] lg:min-h-[32px] px-1 text-center font-sans text-[12px] lg:text-sm flex items-center justify-center text-gray-900 ${bold ? 'font-bold' : ''}`} style={textStyle}>
          {value}
        </div>
      ) : (
        <input 
          ref={inputRef}
          type="text"
          className={`w-full h-full min-h-[32px] lg:min-h-[32px] px-1 text-center font-sans text-[12px] lg:text-sm outline-none focus:ring-2 ${inputRingFocus} ${inputBgFocus} focus:z-10 relative bg-transparent text-gray-900 ${bold ? 'font-bold' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.currentTarget.blur(); return; }
            const map: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
            const dir = map[e.key];
            if (!dir) return;
            e.preventDefault();
            const td = e.currentTarget.closest('td');
            const tr = td?.closest('tr');
            const tbody = tr?.closest('tbody');
            if (!td || !tr || !tbody) return;
            const allTds = Array.from(tr.querySelectorAll('td'));
            const ci = allTds.indexOf(td);
            if (dir === 'left' || dir === 'right') {
              const step = dir === 'left' ? -1 : 1;
              let i = ci + step;
              while (i >= 0 && i < allTds.length) {
                const inp = allTds[i].querySelector('input:not([readonly])') as HTMLInputElement | null;
                if (inp) { inp.focus(); inp.select(); return; }
                i += step;
              }
            } else {
              const step = dir === 'up' ? -1 : 1;
              let row: Element | null = tr;
              while (row) {
                const sib: Element | null = step === -1 ? row.previousElementSibling : row.nextElementSibling;
                if (!sib || sib.tagName !== 'TR') break;
                row = sib;
                const tds = Array.from(row.querySelectorAll('td'));
                if (ci < tds.length) {
                  const inp = tds[ci].querySelector('input:not([readonly])') as HTMLInputElement | null;
                  if (inp) { inp.focus(); inp.select(); return; }
                }
              }
            }
          }}
        />
      )}
    </td>
  );
}

export default function AnnualReportPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId');
  const [activeSheet, setActiveSheet] = useState<number>(2);

  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [editingMaxHeader, setEditingMaxHeader] = useState<{chorak: number, type: 'BSB' | 'CHSB', bsbIndex?: number} | null>(null);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState<{ id: string; name: string }[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<{ name: string; studentCount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>("uz");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    (async () => {
      try {
        const report = await getAnnualReportById(reportId);
        if (!report) return;
        const d = JSON.parse(report.data);
        if (d.sheets) setSheets(d.sheets);
        if (d.bsbMaxScores) setBsbMaxScores(d.bsbMaxScores);
        if (d.chsbMaxScores) setChsbMaxScores(d.chsbMaxScores);
        if (d.bsbCounts) setBsbCounts(d.bsbCounts);
        if (d.title1) {
          setTitle1(d.title1);
          const tumanMatch = d.title1.match(/^(.*?)\s+tumani/i);
          const maktabMatch = d.title1.match(/tumani\s+(.*?)\s+maktab/i);
          const fanMatch = d.title1.match(/"(.*?)"\s+fanidan/i);
          if (tumanMatch) setTumanInput(tumanMatch[1]);
          if (maktabMatch) setMaktabInput(maktabMatch[1]);
          if (fanMatch) setFanInput(fanMatch[1]);
        }
        if (d.titleYear) setTitleYear(d.titleYear);
        if (d.teacherName) setTeacherName(d.teacherName);
        if (report.subject) {
          setSelectedSubject(report.subject);
          setFanInput(report.subject);
        }
      } catch (e) {
        console.error("Yillik hisobotni yuklashda xatolik", e);
      }
    })();
  }, [reportId]);

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang | undefined;
    if (saved) setLang(saved);
    const handler = (e: CustomEvent) => setLang(e.detail as Lang);
    window.addEventListener('langchange', handler as EventListener);
    return () => window.removeEventListener('langchange', handler as EventListener);
  }, []);

  const [animPhase, setAnimPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [prevSheet, setPrevSheet] = useState<number | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const switchSheet = (sheet: number) => {
    if (sheet === activeSheet || animPhase !== 'idle') return;
    clearTimeout(animTimer.current);
    setPrevSheet(activeSheet);
    setAnimPhase('exit');
    animTimer.current = setTimeout(() => {
      setActiveSheet(sheet);
      setAnimPhase('enter');
      animTimer.current = setTimeout(() => {
        setAnimPhase('idle');
        setPrevSheet(null);
      }, 280);
    }, 150);
  };
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  useEffect(() => {
    const idx = activeSheet - 1;
    const tab = tabRefs.current[idx];
    const container = tabsContainerRef.current;
    if (tab && container) {
      requestAnimationFrame(() => {
        setIndicatorStyle({
          left: tab.offsetLeft,
          width: tab.offsetWidth,
        });
      });
    }
  }, [activeSheet]);
  useEffect(() => {
    requestAnimationFrame(() => {
      const idx = activeSheet - 1;
      const tab = tabRefs.current[idx];
      const container = tabsContainerRef.current;
      if (tab && container) {
        setIndicatorStyle({
          left: tab.offsetLeft,
          width: tab.offsetWidth,
        });
      }
    });
  }, []);
  const [bsbMaxScores, setBsbMaxScores] = useState<{[key: string]: string}>({});

  const safeLocal = (fn: () => string | null): string | null => {
    try { return fn(); } catch { return null; }
  };

  const getRawInputs = (): { tuman: string; maktab: string; fan: string } | null => {
    try {
      const raw = safeLocal(() => localStorage.getItem('excel-title-raw'));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const buildTitle = (template: string, raw: { tuman: string; maktab: string; fan: string }) =>
    template.replace("{district}", raw.tuman || "____").replace("{school}", raw.maktab || "____").replace("{subject}", raw.fan || "____");

  const [tumanInput, setTumanInput] = useState(() => getRawInputs()?.tuman || "");
  const [maktabInput, setMaktabInput] = useState(() => getRawInputs()?.maktab || "");
  const [fanInput, setFanInput] = useState(() => getRawInputs()?.fan || "");
  const [yilInput, setYilInput] = useState("");

  const safeCookie = (): Lang => {
    try {
      return (document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1] as Lang) || "uz";
    } catch { return "uz"; }
  };

  const [title1, setTitle1] = useState(() => {
    const raw = getRawInputs();
    if (raw) {
      return buildTitle(t("annual.title_template", safeCookie()), raw);
    }
    const saved = safeLocal(() => localStorage.getItem('excel-title1'));
    if (saved) {
      const tumanMatch = saved.match(/^(.*?)\s+tumani/i);
      const maktabMatch = saved.match(/tumani\s+(.*?)\s+maktab/i);
      const fanMatch = saved.match(/"(.*?)"\s+fanidan/i);
      if (tumanMatch && maktabMatch && fanMatch) {
        const raw = { tuman: tumanMatch[1], maktab: maktabMatch[1], fan: fanMatch[1] };
        safeLocal(() => { localStorage.setItem('excel-title-raw', JSON.stringify(raw)); return null; });
        return buildTitle(t("annual.title_template", safeCookie()), raw);
      }
      return saved;
    }
    return t("annual.title_template", safeCookie()).replace("{district}", "____").replace("{school}", "____").replace("{subject}", "____");
  });

  const [titleYear, setTitleYear] = useState(() => {
    const saved = safeLocal(() => localStorage.getItem('excel-title-year'));
    return saved || "____-____";
  });

  const [teacherName, setTeacherName] = useState(() => {
    const saved = safeLocal(() => localStorage.getItem('excel-teacherName'));
    return saved !== null ? saved : "";
  });

  useEffect(() => {
    localStorage.setItem('excel-title1', title1);
  }, [title1]);

  useEffect(() => {
    const raw = getRawInputs();
    if (raw) setTitle1(buildTitle(t("annual.title_template", lang), raw));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('excel-title-year', titleYear);
  }, [titleYear]);

  useEffect(() => {
    localStorage.setItem('excel-teacherName', teacherName);
  }, [teacherName]);

  const [chsbMaxScores, setChsbMaxScores] = useState<{[key: string]: string}>({});

  const [bsbCounts, setBsbCounts] = useState<{ [chorak: number]: number }>({ 1: 1, 2: 1, 3: 1, 4: 1 });

  const [sheets, setSheets] = useState<{ [key: number]: RowData[] }>({
    1: JSON.parse(JSON.stringify(initialData)),
    2: JSON.parse(JSON.stringify(initialData)),
    3: JSON.parse(JSON.stringify(initialData)),
    4: JSON.parse(JSON.stringify(initialData)),
  });

  useEffect(() => {
    localStorage.setItem('excel-bsb-maxs', JSON.stringify(bsbMaxScores));
  }, [bsbMaxScores]);

  useEffect(() => {
    localStorage.setItem('excel-chsb-maxs', JSON.stringify(chsbMaxScores));
  }, [chsbMaxScores]);

  useEffect(() => {
    localStorage.setItem('excel-sheets-data', JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    localStorage.setItem('excel-bsb-counts', JSON.stringify(bsbCounts));
  }, [bsbCounts]);

  useEffect(() => {
    if (reportId) return;
    (async () => {
      try {
        const res = await getTeacherData();
        if (res.data) {
          const d = res.data;
          const school = d.school;
          const subjects = (d.subjects || []).map((s: any) => ({ id: s.id, name: s.name }));
          const classes = (d.classes || []).map((c: any) => ({ name: c.name, studentCount: c._count?.students || 0 }));

          setTeacherSubjects(subjects);
          setTeacherClasses(classes);

          if (d.teacherName) {
            setTeacherName(d.teacherName);
          }

          if (subjects.length > 0) {
            setFanInput(subjects[0].name);
            setSelectedSubject(subjects[0].name);
          }

          if (school) {
            setTumanInput(school.district || "____");
            setMaktabInput(school.name || "____");
            setTitle1(`${school.district || "____"} tumani ${school.name || "____"} maktab o'quvchilarining "${subjects[0]?.name || "____"}" fanidan`);
          }

          if (classes.length > 0) {
            const newSheets: any = { 1: [], 2: [], 3: [], 4: [] };
            for (let sq = 1; sq <= 4; sq++) {
              newSheets[sq] = classes.map((cls: any, i: number) => ({
                id: `cls-${cls.name}-${sq}`,
                n: String(i + 1),
                sinf: cls.name,
                oquvchiSoni: cls.studentCount ? String(cls.studentCount) : '-',
              }));
            }
            setSheets(newSheets);
          }
        }
      } catch (e) {
        console.error("Ma'lumotlarni yuklashda xatolik", e);
      }
    })();
  }, [reportId]);

  useEffect(() => {
    if (!selectedSubject || reportId) return;
    setLoading(true);
    (async () => {
      try {
        const result = await getAnnualReportDataBySubject(selectedSubject);

        setFanInput(selectedSubject);
        setTitle1((prev) => {
          const base = prev.replace(/".*?"\s*fanidan/, `"${selectedSubject}" fanidan`);
          return base;
        });

        if (result.meta) {
          setBsbMaxScores((prev) => ({ ...prev, ...result.meta.maxScores }));
          setChsbMaxScores((prev) => ({ ...prev, ...result.meta.chsbMaxScores }));
        }


        if (result.data.length > 0) {
          const classList = result.classes.length > 0
            ? result.classes.map((c) => c.name)
            : [...new Set(result.data.map((d) => d.classLevel))];

          const sheetsData: any = { 1: [], 2: [], 3: [], 4: [] };
          const newBsbCounts: any = { 1: 1, 2: 1, 3: 1, 4: 1 };

          const sheetQuarters: [number, number][] = [[1, 0], [1, 2], [2, 3], [3, 4]];

          const quarterMaxBsbs: Record<number, number> = {};
          for (let q = 1; q <= 4; q++) {
            const items = result.data.filter((d) => d.quarter === q);
            let maxB = 1;
            for (const item of items) {
              for (const bsb of item.bsbReports) {
                if (bsb.index > maxB) maxB = bsb.index;
              }
            }
            quarterMaxBsbs[q] = maxB;
          }

          for (let s = 0; s < 4; s++) {
            const [c1, c2] = sheetQuarters[s];
            newBsbCounts[c1] = Math.max(newBsbCounts[c1] || 1, quarterMaxBsbs[c1] || 1);
            if (c2 > 0) newBsbCounts[c2] = Math.max(newBsbCounts[c2] || 1, quarterMaxBsbs[c2] || 1);

            sheetsData[s + 1] = classList.map((cls: string, i: number) => {
              const row: any = {
                id: `cl-${cls}-s${s + 1}`,
                n: String(i + 1),
                sinf: cls,
                oquvchiSoni: (() => {
                  const sc = result.classes.find((tc) => tc.name === cls)?.studentCount;
                  return sc ? String(sc) : '-';
                })(),
              };

              const c1Data = result.data.find((d) => d.classLevel === cls && d.quarter === c1);
              const c2Data = c2 > 0 ? result.data.find((d) => d.classLevel === cls && d.quarter === c2) : null;

              for (const dataSet of [c1Data, c2Data].filter(Boolean)) {
                const q = dataSet!.quarter;
                for (const bsb of dataSet!.bsbReports) {
                  row[`bsb_${q}_${bsb.index}_ball`] = formatNum(bsb.avgBall, 1);
                  row[`bsb_${q}_${bsb.index}_foiz`] = formatNum(bsb.avgFoiz, 1);
                }
                if (dataSet!.chsbReport) {
                  row[`chsb_${q}_ball`] = formatNum(dataSet!.chsbReport.avgBall, 1);
                  row[`chsb_${q}_foiz`] = formatNum(dataSet!.chsbReport.avgFoiz, 1);
                }
              }

              return row;
            });
          }

          const maxBsb = Math.max(newBsbCounts[1], newBsbCounts[2], newBsbCounts[3], newBsbCounts[4]);

          setSheets(sheetsData);
          setBsbCounts({ 1: maxBsb, 2: maxBsb, 3: maxBsb, 4: maxBsb });
        }
      } catch (e) {
        console.error("Hisobot ma'lumotlarini yuklashda xatolik", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSubject]);

  const addBsb = () => {
    setBsbCounts(prev => {
      const current = Math.max(prev[1] || 1, prev[2] || 1, prev[3] || 1, prev[4] || 1);
      const next = Math.min(10, current + 1);
      return { 1: next, 2: next, 3: next, 4: next };
    });
  };

  const removeBsb = () => {
    setBsbCounts(prev => {
      const current = Math.max(prev[1] || 1, prev[2] || 1, prev[3] || 1, prev[4] || 1);
      const next = Math.max(1, current - 1);
      return { 1: next, 2: next, 3: next, 4: next };
    });
  };

  const rows = sheets[activeSheet] || [];

  const updateRow = (id: string, key: string, value: string) => {
    setSheets(prev => {
      const currentSheet = prev[activeSheet] || [];
      const targetRow = currentSheet.find(r => r.id === id);
      if (!targetRow) return prev;

      if (key.startsWith('baho_')) {
        const targetSinf = targetRow.sinf;
        const next: typeof prev = {};
        for (const sheetKey in prev) {
          next[sheetKey] = prev[sheetKey].map(r => {
            if (r.sinf === targetSinf && targetSinf !== '') {
              return { ...r, [key]: value };
            }
            return r;
          });
        }
        return next;
      } else if (key === 'sinf' || key === 'n' || key === 'oquvchiSoni') {
        const next: typeof prev = {};
        for (const sheetKey in prev) {
          next[sheetKey] = prev[sheetKey].map(r => {
            if (r.id === id) {
              return { ...r, [key]: value };
            }
            return r;
          });
        }
        return next;
      } else {
        return {
          ...prev,
          [activeSheet]: prev[activeSheet].map(r => r.id === id ? { ...r, [key]: value } : r)
        };
      }
    });
  };

  const handleBsbBallChange = (id: string, chorak: number, bsbIndex: number, value: string) => {
    const maxString = bsbMaxScores[`${chorak}_${bsbIndex}`] || '';
    
    if (value && maxString) {
      const valNum = parseNum(value);
      const maxNum = parseNum(maxString);
      
      if (valNum > maxNum) {
        alert(`Kiritilgan ball maksimal balldan (${maxNum}) oshmasligi kerak!`);
        return;
      }
    }
    
    let foizStr = '';
    if (value && maxString) {
      const valNum = parseNum(value);
      const maxNum = parseNum(maxString);
      if (maxNum > 0) {
        foizStr = formatNum((valNum / maxNum) * 100, 1);
      } else {
        foizStr = '0,0';
      }
    }
    
    setSheets(prev => {
      const next = { ...prev };
      next[activeSheet] = next[activeSheet].map(r => {
        if (r.id === id) {
          if (value === '') {
            return { ...r, [`bsb_${chorak}_${bsbIndex}_ball`]: value, [`bsb_${chorak}_${bsbIndex}_foiz`]: '' };
          }
          return { ...r, [`bsb_${chorak}_${bsbIndex}_ball`]: value, ...(foizStr ? {[`bsb_${chorak}_${bsbIndex}_foiz`]: foizStr} : {}) };
        }
        return r;
      });
      return next;
    });
  };

  const handleMaxScoreBlur = (bsbKey: string) => {
    setEditingMaxHeader(null);
    const maxString = bsbMaxScores[bsbKey] || '';
    const maxNum = parseNum(maxString);
    
    setSheets(prev => {
      const newSheets = { ...prev };
      for (const sheetKey in newSheets) {
        newSheets[sheetKey] = newSheets[sheetKey].map(r => {
          if (r[`bsb_${bsbKey}_ball`] !== undefined && r[`bsb_${bsbKey}_ball`] !== '') {
             const valNum = parseNum(r[`bsb_${bsbKey}_ball`]);
             let foiz = r[`bsb_${bsbKey}_foiz`];
             if (maxNum > 0) {
               foiz = formatNum((valNum / maxNum) * 100, 1);
             }
             return { ...r, [`bsb_${bsbKey}_foiz`]: foiz };
          }
          return r;
        });
      }
      return newSheets;
    });
  };

  const handleChsbBallChange = (id: string, chorak: number, value: string) => {
    const maxString = chsbMaxScores[`${chorak}`] || '40';
    
    if (value && maxString) {
      const valNum = parseNum(value);
      const maxNum = parseNum(maxString);
      
      if (valNum > maxNum) {
        alert(`Kiritilgan ball maksimal balldan (${maxNum}) oshmasligi kerak!`);
        return;
      }
    }
    
    let foizStr = '';
    if (value && maxString) {
      const valNum = parseNum(value);
      const maxNum = parseNum(maxString);
      if (maxNum > 0) {
        foizStr = formatNum((valNum / maxNum) * 100, 1);
      } else {
        foizStr = '0,0';
      }
    }
    
    setSheets(prev => {
      const next = { ...prev };
      next[activeSheet] = next[activeSheet].map(r => {
        if (r.id === id) {
          if (value === '') {
            return { ...r, [`chsb_${chorak}_ball`]: value, [`chsb_${chorak}_foiz`]: '' };
          }
          return { ...r, [`chsb_${chorak}_ball`]: value, ...(foizStr ? {[`chsb_${chorak}_foiz`]: foizStr} : {}) };
        }
        return r;
      });
      return next;
    });
  };

  const handleChsbMaxScoreBlur = (chsbKey: string) => {
    setEditingMaxHeader(null);
    const maxString = chsbMaxScores[chsbKey] || '40';
    const maxNum = parseNum(maxString);
    
    setSheets(prev => {
      const newSheets = { ...prev };
      for (const sheetKey in newSheets) {
        newSheets[sheetKey] = newSheets[sheetKey].map(r => {
          if (r[`chsb_${chsbKey}_ball`] !== undefined && r[`chsb_${chsbKey}_ball`] !== '') {
             const valNum = parseNum(r[`chsb_${chsbKey}_ball`]);
             let foiz = r[`chsb_${chsbKey}_foiz`];
             if (maxNum > 0) {
               foiz = formatNum((valNum / maxNum) * 100, 1);
             }
             return { ...r, [`chsb_${chsbKey}_foiz`]: foiz };
          }
          return r;
        });
      }
      return newSheets;
    });
  };

  const removeRow = (id: string) => {
    setSheets(prev => {
      const currentSheet = prev[activeSheet] || [];
      const rowToDelete = currentSheet.find(r => r.id === id);
      const targetSinf = rowToDelete?.sinf;

      const next: typeof prev = {};
      for (const sheetKey in prev) {
        next[sheetKey] = prev[sheetKey].filter(r => {
          if (r.id === id) return false;
          if (targetSinf && targetSinf !== '' && r.sinf === targetSinf) return false;
          return true;
        });
      }
      return next;
    });
  };
  const colAverage = (key: string, _rows = rows) => {
    let sum = 0;
    let count = 0;
    _rows.forEach(r => {
      if (r[key] && String(r[key]).trim() !== '') {
        sum += parseNum(r[key]);
        count++;
      }
    });
    return count === 0 ? '' : formatNum(sum / count, 1);
  };

  const getOrtacha = (chorak: number, r: RowData) => {
    let sum = 0;
    let hasValue = false;
    
    const bsbCount = bsbCounts[chorak] || 1;
    for (let i = 1; i <= bsbCount; i++) {
      const val = r[`bsb_${chorak}_${i}_ball`];
      if (val && String(val).trim() !== '') {
        sum += parseNum(val);
        hasValue = true;
      }
    }
    
    const chsbVal = r[`chsb_${chorak}_ball`];
    if (chsbVal && String(chsbVal).trim() !== '') {
      sum += parseNum(chsbVal);
      hasValue = true;
    }
    
    return hasValue ? formatNum(sum, 1) : '';
  };

  const colOrtachaAverage = (chorak: number, _rows = rows) => {
    let sum = 0;
    let count = 0;
    _rows.forEach(r => {
      const val = getOrtacha(chorak, r);
      if (val !== '') {
        sum += parseNum(val);
        count++;
      }
    });
    return count === 0 ? '' : formatNum(sum / count, 1);
  };

  const colOrtachaDiffRowAverage = (chorak2: number, chorak1: number, _rows = rows) => {
    let sum = 0;
    let count = 0;
    _rows.forEach(r => {
      const v1 = getOrtacha(chorak1, r);
      const v2 = getOrtacha(chorak2, r);
      if (v1 !== '' || v2 !== '') {
        const diff = parseNum(v2 || '0') - parseNum(v1 || '0');
        sum += diff;
        count++;
      }
    });
    return count === 0 ? '' : formatNum(sum / count, 1);
  };

  const getDiffRowAverage = (key2: string, key1: string, _rows = rows) => {
    let sum = 0;
    let count = 0;
    _rows.forEach(r => {
      if ((r[key2] && String(r[key2]).trim() !== '') || (r[key1] && String(r[key1]).trim() !== '')) {
        const diff = parseNum(r[key2] || '0') - parseNum(r[key1] || '0');
        sum += diff;
        count++;
      }
    });
    return count === 0 ? '' : formatNum(sum / count, 1);
  };

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    [1, 2, 3, 4].forEach(sheetNum => {
      const tableId = activeSheet === sheetNum ? 'excel-table' : `export-table-${sheetNum}`;
      const table = document.getElementById(tableId);
      if (!table) return;
      
      const clone = table.cloneNode(true) as HTMLTableElement;
      
      const elementsToRemove = clone.querySelectorAll('.no-export');
      elementsToRemove.forEach(el => el.parentNode?.removeChild(el));

      const originalInputs = table.querySelectorAll('input');
      const cloneInputs = clone.querySelectorAll('input');
      originalInputs.forEach((input, i) => {
        if (cloneInputs[i] && cloneInputs[i].parentNode) {
          let val = input.value || '0';
          (cloneInputs[i].parentNode as HTMLElement).innerText = val;
        }
      });

      const allCells = clone.querySelectorAll('td');
      allCells.forEach(cell => {
        const tr = cell.closest('tr');
        const inTbody = tr && tr.closest('tbody');
        const isBorderNone = typeof cell.className === 'string' && cell.className.includes('border-none');
        if (!cell.textContent || cell.textContent.trim() === '') {
          if (inTbody && !isBorderNone) {
            (cell as HTMLElement).innerText = "0";
          } else {
            (cell as HTMLElement).innerText = " ";
          }
        } else if (cell.textContent.includes(',')) {
          cell.textContent = cell.textContent.replace(/(\d),(\d)/g, '$1.$2');
        }
      });

      const lastRow = clone.rows[clone.rows.length - 1];
      if (lastRow) {
        while (lastRow.cells.length > 0) lastRow.deleteCell(0);
        const tc = document.createElement('td');
        tc.colSpan = 7;
        tc.textContent = `${t("annual.teacher_sign", lang)} ${teacherName}`;
        tc.className = 'border-none';
        lastRow.appendChild(tc);
      }

      const { c1, c2 } = getQuarters(sheetNum);
      const chorakTitle = t("bsb_chsb.quarter_" + sheetNum, lang);
      const sheetName = chorakTitle;

      const thead = clone.querySelector('thead');
      if (thead && thead.rows.length > 0) {
        let colCount = 0;
        Array.from(thead.rows[0].cells).forEach(c => colCount += (c.colSpan || 1));
        
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.colSpan = colCount;
        th.className = "excel-main-title";
        th.style.height = "40px";
        const q1Label = t("bsb_chsb.quarter_" + c1, lang);
        const q2Label = c2 > 0 ? t("bsb_chsb.quarter_" + c2, lang) : '';
        const resultsLabel = t("common.results", lang);
        th.innerText = `${title1} ${titleYear}-${t("common.academic_year", lang)} ${q1Label}${c2 > 0 ? ` ${t("common.and", lang)} ${q2Label} ${resultsLabel}` : ` ${resultsLabel}`}`;
        tr.appendChild(th);
        thead.insertBefore(tr, thead.firstChild);
      }

      const ws = XLSX.utils.table_to_sheet(clone, { display: true });

      const grid: HTMLTableCellElement[][] = [];
      for (let r = 0; r < clone.rows.length; r++) {
        if (!grid[r]) grid[r] = [];
        const row = clone.rows[r];
        let c = 0;
        for (let i = 0; i < row.cells.length; i++) {
          const cell = row.cells[i];
          while (grid[r] && grid[r][c]) { c++; }
          for (let ri = 0; ri < (cell.rowSpan || 1); ri++) {
             for (let ci = 0; ci < (cell.colSpan || 1); ci++) {
                if (!grid[r+ri]) grid[r+ri] = [];
                grid[r+ri][c+ci] = cell as HTMLTableCellElement;
             }
          }
        }
      }

      const numRows = clone.rows.length;
      let numCols = 0;
      for (let r = 0; r < numRows; r++) {
        let colIdx = 0;
        for (let c = 0; c < clone.rows[r].cells.length; c++) {
          colIdx += clone.rows[r].cells[c].colSpan || 1;
        }
        if (colIdx > numCols) numCols = colIdx;
      }

      const existingMerges = ws['!merges'] || [];
      const newMerges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const fixedFarqiCols: number[] = [];
      for (const merge of existingMerges) {
        const { s, e } = merge;
        const cellR1 = grid[1]?.[s.c];
        const cellR2 = grid[2]?.[s.c];
        const isBadFarqi =
          s.r === 1 && e.r === 3 && s.c === e.c &&
          cellR1 && cellR2 && cellR1 === cellR2 &&
          cellR1.textContent?.trim() === t("annual.diff", lang);
        if (isBadFarqi) {
          fixedFarqiCols.push(s.c);
          newMerges.push({ s: { r: 2, c: s.c }, e: { r: 3, c: s.c } });
        } else {
          newMerges.push(merge);
        }
      }
      ws['!merges'] = newMerges;
      for (const c of fixedFarqiCols) {
        const addrR2 = XLSX.utils.encode_cell({ r: 2, c });
        if (!ws[addrR2]) ws[addrR2] = { t: 's', v: ' ' };
        ws[addrR2].v = '%';
        ws[addrR2].t = 's';
      }
      
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { t: 's', v: ' ' };
          
          ws[addr].s = ws[addr].s || {};
          ws[addr].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
          ws[addr].s.font = { name: "Times New Roman", sz: 12 };
          ws[addr].s.border = {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } }
          };

          const htmlCell = grid[r]?.[c];
          
          if (r === 0) {
             ws[addr].s.font.bold = true;
             ws[addr].s.font.sz = 14;
             ws[addr].s.fill = { fgColor: { rgb: "FFFFFFFF" } };
             delete ws[addr].s.border;
          } else if (htmlCell && typeof htmlCell.className === 'string' && htmlCell.className.includes('border-none')) {
             delete ws[addr].s.border;
          } else if (r < 4) {
             ws[addr].s.font.bold = true;
             ws[addr].s.font.sz = 9;
             ws[addr].s.fill = { fgColor: { rgb: "FFFFFFFF" } };
             if (c === 1 || c === 2) {
                ws[addr].s.alignment.textRotation = 90;
             }
          } else if (htmlCell) {
             const className = htmlCell.className || '';
             
             if (className.includes('bg-[#00b050]') || className.includes('bg-green-600') || className.includes('bg-[#ff0000]') || className.includes('bg-[#ffff00]')) {
               const val = ws[addr].v !== undefined ? parseFloat(String(ws[addr].v).replace(',', '.')) : NaN;
               if (!isNaN(val)) {
                   if (val > 0) {
                       ws[addr].s.fill = { fgColor: { rgb: "FF00B050" } };
                       ws[addr].s.font.color = { rgb: "FF000000" };
                   } else if (val < 0) {
                       ws[addr].s.fill = { fgColor: { rgb: "FFFF0000" } };
                       ws[addr].s.font.color = { rgb: "FF000000" };
                   } else {
                       ws[addr].s.fill = { fgColor: { rgb: "FFFFFF00" } };
                       ws[addr].s.font.color = { rgb: "FF000000" };
                   }
               }
             }
             
             if (className.includes('bg-[#fcfcff]') || className.includes('bg-slate-50')) {
                 ws[addr].s.fill = { fgColor: { rgb: "FFFFFFFF" } };
             }
             
             if (className.includes('font-bold')) {
                 ws[addr].s.font.bold = true;
             }
          }

          if (r >= 4 && htmlCell) {
            const cellVal = ws[addr].v !== undefined ? parseFloat(String(ws[addr].v).replace(',', '.')) : NaN;
            if (!isNaN(cellVal)) {
              let isFarqCol = false;
              for (let hr = 1; hr <= 3; hr++) {
                if (grid[hr]?.[c]?.textContent?.trim().includes(t("annual.diff", lang))) {
                  isFarqCol = true;
                  break;
                }
              }
              if (isFarqCol) {
                if (cellVal > 0) {
                  ws[addr].s.fill = { fgColor: { rgb: "FF00B050" } };
                  ws[addr].s.font.color = { rgb: "FF000000" };
                } else if (cellVal < 0) {
                  ws[addr].s.fill = { fgColor: { rgb: "FFFF0000" } };
                  ws[addr].s.font.color = { rgb: "FF000000" };
                } else {
                  ws[addr].s.fill = { fgColor: { rgb: "FFFFFF00" } };
                  ws[addr].s.font.color = { rgb: "FF000000" };
                }
              }
            }
          }
        }
      }

      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: numRows - 1, c: numCols - 1 } });

      const ref2 = XLSX.utils.decode_range(ws['!ref']);
      for (let r = ref2.s.r; r <= ref2.e.r; r++) {
        for (let c = ref2.s.c; c <= ref2.e.c; c++) {
          if (r === 0) continue;
          const htmlCell = grid[r]?.[c];
          if (htmlCell && typeof htmlCell.className === 'string' && htmlCell.className.includes('border-none')) continue;
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { t: 's', v: ' ' };
          ws[addr].s = ws[addr].s || {};
          ws[addr].s.border = {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } }
          };
        }
      }

      const trR2 = numRows - 1;
      for (let c = 0; c < numCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: trR2, c });
        if (ws[addr]) {
          if (c < 7) {
            ws[addr].s = ws[addr].s || {};
            ws[addr].s.border = { bottom: { style: "thin", color: { rgb: "FF000000" } } };
          } else {
            delete ws[addr].s.border;
          }
        }
      }

      ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 42 };
      ws['!rows'][1] = { hpt: 39 };
      ws['!rows'][2] = { hpt: 39 };
      ws['!rows'][3] = { hpt: 36 };
      for (let r = 4; r < trR2; r++) {
         ws['!rows'][r] = { hpt: 19 };
      }
      ws['!rows'][trR2] = { hpt: 28 };

      ws['!cols'] = [{wch: 4.5}, {wch: 8}, {wch: 6}];
      for(let c = 3; c < numCols; c++) {
         let headerText = '';
         if (grid[1] && grid[1][c]) headerText += grid[1][c].innerText + ' ';
         if (grid[2] && grid[2][c]) headerText += grid[2][c].innerText + ' ';
         if (grid[3] && grid[3][c]) headerText += grid[3][c].innerText + ' ';
         
         headerText = headerText.toLowerCase();

         if (headerText.includes("o'rtacha")) {
             ws['!cols'][c] = { wch: 10 };
         } else if (headerText.includes("%") || headerText.includes("farqi")) {
             ws['!cols'][c] = { wch: 5.5 };
         } else if (headerText.match(/\b5\b|\b4\b|\b3\b/)) {
             ws['!cols'][c] = { wch: 5 };
         } else {
             ws['!cols'][c] = { wch: 7 };
         }
      }

      ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape', fitToWidth: 1, fitToHeight: 1 };
      ws['!fitToPage'] = true;
      ws['!margins'] = { left: 0.1, right: 0.1, top: 0.2, bottom: 0.2, header: 0.0, footer: 0.0 };

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const yr = titleYear || "2024-2025";
    XLSX.writeFile(wb, `${t("annual.filename", lang)}.xlsx`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = JSON.stringify({
        sheets,
        bsbMaxScores,
        chsbMaxScores,
        bsbCounts,
        title1,
        titleYear,
        teacherName,
      });
      await saveAnnualReport(selectedSubject, title1, titleYear, teacherName, payload, reportId || undefined);
      alert(t("bsb_chsb.saved_msg", lang) || "Saqlab qo'yildi");
    } catch (err) {
      console.error("Save error:", err);
      alert(t("bsb_chsb.error_msg", lang) || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const getQuarters = (sheetNum?: number) => {
    const target = sheetNum || activeSheet;
    if (target === 1) return { c1: 1, c2: 0 };
    if (target === 2) return { c1: 1, c2: 2 };
    if (target === 3) return { c1: 2, c2: 3 };
    if (target === 4) return { c1: 3, c2: 4 };
    return { c1: 1, c2: 0 };
  };

  const { c1, c2 } = getQuarters();
  
  const c1Bsbs = Array.from({length: bsbCounts[c1] || 1}, (_, i) => i + 1);
  const c2Bsbs = c2 > 0 ? Array.from({length: bsbCounts[c2] || 1}, (_, i) => i + 1) : [];
  const diffBsbs = Array.from({length: Math.max(c1Bsbs.length, c2Bsbs.length)}, (_, i) => i + 1);

  const getGlobalBsbIndex = (chorak: number, localIndex: number) => {
    let startIndex = 0;
    for (let i = 1; i < chorak; i++) {
      startIndex += (bsbCounts[i] || 1);
    }
    return startIndex + localIndex;
  };

  const handleOpenTitleSettings = () => {
    const raw = getRawInputs();
    if (raw) {
      setTumanInput(raw.tuman);
      setMaktabInput(raw.maktab);
      setFanInput(raw.fan);
    } else {
      const tumanMatch = title1.match(/^(.*?)\s+tumani/i);
      const maktabMatch = title1.match(/tumani\s+(.*?)\s+maktab/i);
      const fanMatch = title1.match(/"(.*?)"\s+fanidan/i);
      setTumanInput(tumanMatch ? tumanMatch[1] : "____");
      setMaktabInput(maktabMatch ? maktabMatch[1] : "____");
      setFanInput(fanMatch ? fanMatch[1] : "____");
    }
    setYilInput(titleYear);
    setShowTitleSettings(true);
  };

  const handleSaveTitleSettings = () => {
    const raw = { tuman: tumanInput, maktab: maktabInput, fan: fanInput };
    localStorage.setItem('excel-title-raw', JSON.stringify(raw));
    setTitle1(buildTitle(t("annual.title_template", lang), raw));
    setTitleYear(yilInput);
    setShowTitleSettings(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/40 flex flex-col items-center p-2 sm:p-4 pt-3 sm:pt-4 pb-2 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="w-full xl:w-[98%] mb-4 flex flex-col gap-3 shrink-0">
        
        <div className="text-center space-y-2 bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-md border border-slate-200/70 ring-1 ring-indigo-900/5 relative group">
          <button onClick={handleOpenTitleSettings} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 bg-slate-50 hover:bg-indigo-50 rounded-xl drop-shadow-sm border border-transparent hover:border-indigo-200 hover:shadow-md">
             <Settings size={20} />
          </button>
           <h1 suppressHydrationWarning className="text-sm sm:text-base md:text-lg font-bold bg-transparent text-slate-800 focus-within:bg-indigo-50 outline-none transition-colors max-w-5xl mx-auto w-full inline-block px-3 py-1.5 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => { setTitle1(e.currentTarget.textContent || ''); localStorage.removeItem('excel-title-raw'); }}>
            {title1}
          </h1>
          <h1 suppressHydrationWarning className="text-xs sm:text-sm md:text-base font-semibold bg-transparent text-slate-500 focus-within:bg-indigo-50 outline-none transition-colors max-w-4xl mx-auto w-full inline-block px-3 py-1.5 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => { const m = (e.currentTarget.textContent || '').match(/(\d{4}-\d{4})/); setTitleYear(m ? m[1] : '2024-2025'); }}>
            {titleYear}-{t("common.academic_year", lang)} {t("bsb_chsb.quarter_" + c1, lang)}{c2 > 0 ? ` ${t("common.and", lang)} ${t("bsb_chsb.quarter_" + c2, lang)} ${t("common.results", lang)}` : ` ${t("common.results", lang)}`}
          </h1>
        </div>

        {/* Title Settings Modal */}
        {showTitleSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">{t("annual.edit_title", lang)}</h3>
                <button onClick={() => setShowTitleSettings(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">{t("annual.district", lang)}</label>
                  <input type="text" value={tumanInput} onChange={e => setTumanInput(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800" placeholder={t("annual.district_placeholder", lang)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">{t("annual.school", lang)}</label>
                  <input type="text" value={maktabInput} onChange={e => setMaktabInput(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800" placeholder={t("annual.school_placeholder", lang)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">{t("annual.subject_field", lang)}</label>
                  <input type="text" value={fanInput} onChange={e => setFanInput(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800" placeholder={t("annual.subject_placeholder", lang)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">{t("annual.year_field", lang)}</label>
                  <input type="text" value={yilInput} onChange={e => setYilInput(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800" placeholder={t("annual.year_placeholder", lang)} />
                </div>
              </div>
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowTitleSettings(false)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors shadow-sm focus:ring-2 focus:ring-slate-200 outline-none">
                  {t("bsb_chsb.cancel", lang)}
                </button>
                <button onClick={handleSaveTitleSettings} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 outline-none">
                  {t("bsb_chsb.save", lang)}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {teacherSubjects.length > 0 && (
              <div className="relative group">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="appearance-none px-10 py-2.5 min-h-[44px] bg-white/90 backdrop-blur-sm border-2 border-indigo-200 rounded-xl shadow-sm text-sm text-slate-700 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition-all duration-300 font-medium cursor-pointer hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50 focus:shadow-lg focus:shadow-indigo-200/50 pr-10"
                >
                  {teacherSubjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-400 group-hover:text-indigo-500 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                <Loader2 size={16} className="animate-spin" /> {t("common.loading", lang)}
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              <button onClick={handleSave} disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-2.5 min-h-[44px] rounded-xl shadow-md shadow-indigo-200 text-xs font-semibold hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-300/40 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t("common.saving", lang) : t("bsb_chsb.save", lang)}
              </button>
              <button onClick={handleDownload} className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2.5 min-h-[44px] rounded-xl shadow-md shadow-emerald-200 text-xs font-semibold hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-emerald-300/40 transition-all active:scale-[0.97]">
                <Download size={15} /> {t("bsb_chsb.export_excel", lang)}
              </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full xl:w-[98%] mx-auto shadow-md shadow-slate-300/30 border border-slate-300/80 bg-white relative overflow-hidden rounded-2xl rounded-b-xl flex-1 flex flex-col min-h-0">
        <div className="overflow-auto w-full pb-2 custom-scrollbar flex-1 relative min-h-0">
          {[1, 2, 3, 4].map(sheetNum => {
            const { c1, c2 } = getQuarters(sheetNum);
            const rows = sheets[sheetNum] || [];
            const c1Bsbs = Array.from({length: bsbCounts[c1] || 1}, (_, i) => i + 1);
            const c2Bsbs = c2 > 0 ? Array.from({length: bsbCounts[c2] || 1}, (_, i) => i + 1) : [];
            const diffBsbs = Array.from({length: Math.max(c1Bsbs.length, c2Bsbs.length)}, (_, i) => i + 1);
            const isHidden = activeSheet !== sheetNum;

            return (
          <table key={sheetNum} id={isHidden ? `export-table-${sheetNum}` : "excel-table"} style={isHidden ? {position: 'absolute', top: -9999, opacity: 0, pointerEvents: 'none'} : {}} className="border-collapse w-max text-[12px] lg:text-sm min-w-full font-sans select-none bg-white">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-center sticky top-0 z-30 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {/* Row 1 */}
              <tr>
                <th rowSpan={3} className="border border-slate-300 no-export w-8 p-0 bg-slate-200"></th>
                <th rowSpan={3} className="border border-slate-300 bg-slate-100 font-bold p-1 w-10">{t("annual.no", lang)}</th>
                <th rowSpan={3} className="border border-slate-300 bg-slate-100 font-bold p-1 w-16 text-[12px] align-bottom relative">
                   <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-32 mx-auto flex items-center justify-center font-bold tracking-wide">
                     {t("bsb_chsb.class", lang)}
                   </div>
                </th>
                <th rowSpan={3} className="border border-slate-300 bg-slate-100 font-bold p-1 w-14 text-[12px] align-bottom relative">
                   <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="h-32 mx-auto flex items-center justify-center font-bold tracking-wide">
                     {t("annual.student_count", lang)}
                   </div>
                </th>
                <th colSpan={c1Bsbs.length * 2} className="border border-gray-400 font-bold p-1 text-sm px-2 relative group">
                  <div className="flex items-center justify-center gap-2">
                    {t("bsb_chsb.quarter_" + c1, lang)}
                    <div className="flex gap-1 print:hidden">
                      {(bsbCounts[c1] || 1) < 10 && (
                        <button onClick={addBsb} className="text-green-600 hover:text-green-800 bg-white rounded-full" title={t("annual.add_bsb", lang)}><PlusCircle size={15} strokeWidth={2.5}/></button>
                      )}
                      {(bsbCounts[c1] || 1) > 1 && (
                        <button onClick={removeBsb} className="text-red-600 hover:text-red-800 bg-white rounded-full" title={t("annual.remove_bsb", lang)}><MinusCircle size={15} strokeWidth={2.5}/></button>
                      )}
                    </div>
                  </div>
                </th>
                
                {c2 > 0 && (
                  <>
                    <th colSpan={c2Bsbs.length * 2} className="border border-gray-400 font-bold p-1 text-sm px-2 relative group">
                      <div className="flex items-center justify-center gap-2">
                        {t("bsb_chsb.quarter_" + c2, lang)}
                        <div className="flex gap-1 print:hidden">
                          {(bsbCounts[c2] || 1) < 10 && (
                            <button onClick={addBsb} className="text-green-600 hover:text-green-800 bg-white rounded-full" title={t("annual.add_bsb", lang)}><PlusCircle size={15} strokeWidth={2.5}/></button>
                          )}
                          {(bsbCounts[c2] || 1) > 1 && (
                            <button onClick={removeBsb} className="text-red-600 hover:text-red-800 bg-white rounded-full" title={t("annual.remove_bsb", lang)}><MinusCircle size={15} strokeWidth={2.5}/></button>
                          )}
                        </div>
                      </div>
                    </th>
                    <th colSpan={diffBsbs.length} className="border border-gray-400 font-bold p-1 text-sm px-2">{t("annual.diff", lang)}</th>
                  </>
                )}
                
                <th colSpan={2} className="border border-gray-400 font-bold p-1 text-sm px-2">{t("bsb_chsb.quarter_" + c1, lang)}</th>
                {c2 > 0 && (
                  <>
                    <th colSpan={2} className="border border-gray-400 font-bold p-1 text-sm px-2">{t("bsb_chsb.quarter_" + c2, lang)}</th>
                    <th rowSpan={3} className="border border-gray-400 font-bold p-1 w-14 text-xs align-middle">{t("annual.diff", lang)}</th>
                  </>
                )}
                
                <th rowSpan={3} className="border border-gray-400 font-bold p-1 min-w-[90px] text-[11px] leading-tight px-2 align-middle">{c1}-chorak<br/>({t("annual.avg_ball", lang)})</th>
                {c2 > 0 && (
                  <>
                    <th rowSpan={3} className="border border-gray-400 font-bold p-1 min-w-[90px] text-[11px] leading-tight px-2 align-middle">{c2}-chorak<br/>({t("annual.avg_ball", lang)})</th>
                    <th rowSpan={3} className="border border-gray-400 font-bold p-1 w-14 text-xs align-middle">{t("annual.diff", lang)}</th>
                  </>
                )}
                
                <th colSpan={3} className="border border-gray-400 font-bold p-1 text-[13px] px-2">{t("bsb_chsb.quarter_" + c1, lang)}</th>
                {c2 > 0 && (
                  <>
                    <th colSpan={3} className="border border-gray-400 font-bold p-1 text-[13px] px-2">{t("bsb_chsb.quarter_" + c2, lang)}</th>
                    <th colSpan={3} className="border border-gray-400 font-bold p-1 text-[13px] px-2">{t("annual.diff", lang)}</th>
                  </>
                )}
              </tr>
              
              {/* Row 2 */}
              <tr>
                {c1Bsbs.map(i => {
                  const bsbKey = `${c1}_${i}`;
                  const isEditing = editingMaxHeader?.chorak === c1 && editingMaxHeader?.type === 'BSB' && editingMaxHeader?.bsbIndex === i;
                  return (
                  <React.Fragment key={`c1_bsb_${i}`}>
                    <th onDoubleClick={() => setEditingMaxHeader({ chorak: c1, type: 'BSB', bsbIndex: i })} rowSpan={2} className="border border-gray-400 p-1 text-[11px] leading-tight font-bold min-w-[90px] align-middle cursor-pointer hover:bg-slate-200" title={t("annual.double_click_tip", lang)}>
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-16 mx-auto px-1 text-center font-sans text-sm outline-none focus:ring-2 focus:ring-red-300 focus:bg-red-50 focus:z-10 bg-transparent text-red-600 font-bold"
                          value={bsbMaxScores[bsbKey] || ''}
                          onChange={(e) => setBsbMaxScores(prev => ({...prev, [bsbKey]: e.target.value}))}
                          onBlur={() => handleMaxScoreBlur(bsbKey)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        />
                      ) : (
                        <>BSB {getGlobalBsbIndex(c1, i)}<br/>(max: {bsbMaxScores[bsbKey] || '?'})</>
                      )}
                    </th>
                    <th rowSpan={2} className="border border-gray-400 p-1 text-sm font-bold w-14 align-middle">%</th>
                  </React.Fragment>
                )})}
                
                {c2 > 0 && c2Bsbs.map(i => {
                  const bsbKey = `${c2}_${i}`;
                  const isEditing = editingMaxHeader?.chorak === c2 && editingMaxHeader?.type === 'BSB' && editingMaxHeader?.bsbIndex === i;
                  return (
                  <React.Fragment key={`c2_bsb_${i}`}>
                    <th onDoubleClick={() => setEditingMaxHeader({ chorak: c2, type: 'BSB', bsbIndex: i })} rowSpan={2} className="border border-gray-400 p-1 text-[11px] leading-tight font-bold min-w-[90px] align-middle cursor-pointer hover:bg-slate-200" title={t("annual.double_click_tip", lang)}>
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-16 mx-auto px-1 text-center font-sans text-sm outline-none focus:ring-2 focus:ring-red-300 focus:bg-red-50 focus:z-10 bg-transparent text-red-600 font-bold"
                          value={bsbMaxScores[bsbKey] || ''}
                          onChange={(e) => setBsbMaxScores(prev => ({...prev, [bsbKey]: e.target.value}))}
                          onBlur={() => handleMaxScoreBlur(bsbKey)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        />
                      ) : (
                        <>BSB {getGlobalBsbIndex(c2, i)}<br/>(max: {bsbMaxScores[bsbKey] || '?'})</>
                      )}
                    </th>
                    <th rowSpan={2} className="border border-gray-400 p-1 text-sm font-bold w-14 align-middle">%</th>
                  </React.Fragment>
                )})}

                {c2 > 0 && diffBsbs.map(i => (
                   <th key={`diff_bsb_${i}`} rowSpan={2} className="border border-gray-400 p-1 text-[11px] leading-tight font-bold w-14 align-middle">{i}-BSB<br/>%</th>
                ))}
                
                {(() => {
                  const isEditing = editingMaxHeader?.chorak === c1 && editingMaxHeader?.type === 'CHSB';
                  const chsbKey = `${c1}`;
                  return (
                    <>
                      <th onDoubleClick={() => setEditingMaxHeader({ chorak: c1, type: 'CHSB' })} rowSpan={2} className="border border-gray-400 p-1 text-[11px] leading-tight font-bold min-w-[90px] align-middle cursor-pointer hover:bg-slate-200" title={t("annual.double_click_tip", lang)}>
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            className="w-16 mx-auto px-1 text-center font-sans text-sm outline-none focus:ring-2 focus:ring-red-300 focus:bg-red-50 focus:z-10 bg-transparent text-red-600 font-bold"
                            value={chsbMaxScores[chsbKey] || '40'}
                            onChange={(e) => setChsbMaxScores(prev => ({...prev, [chsbKey]: e.target.value}))}
                            onBlur={() => handleChsbMaxScoreBlur(chsbKey)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          />
                        ) : (
                          <>ChSB {c1}<br/>(max: {chsbMaxScores[chsbKey] || '40'})</>
                        )}
                      </th>
                      <th rowSpan={2} className="border border-gray-400 p-1 text-sm font-bold w-14 align-middle">%</th>
                    </>
                  );
                })()}
                
                {c2 > 0 && (() => {
                  const isEditing = editingMaxHeader?.chorak === c2 && editingMaxHeader?.type === 'CHSB';
                  const chsbKey = `${c2}`;
                  return (
                    <>
                      <th onDoubleClick={() => setEditingMaxHeader({ chorak: c2, type: 'CHSB' })} rowSpan={2} className="border border-gray-400 p-1 text-[11px] leading-tight font-bold min-w-[90px] align-middle cursor-pointer hover:bg-slate-200" title={t("annual.double_click_tip", lang)}>
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            className="w-16 mx-auto px-1 text-center font-sans text-sm outline-none focus:ring-2 focus:ring-red-300 focus:bg-red-50 focus:z-10 bg-transparent text-red-600 font-bold"
                            value={chsbMaxScores[chsbKey] || '40'}
                            onChange={(e) => setChsbMaxScores(prev => ({...prev, [chsbKey]: e.target.value}))}
                            onBlur={() => handleChsbMaxScoreBlur(chsbKey)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          />
                        ) : (
                          <>ChSB {c2}<br/>(max: {chsbMaxScores[chsbKey] || '40'})</>
                        )}
                      </th>
                      <th rowSpan={2} className="border border-gray-400 p-1 text-sm font-bold w-14 align-middle">%</th>
                    </>
                  );
                })()}
                
                <th colSpan={3} className="border border-gray-400 p-1 text-[12px] font-bold align-middle">{t("annual.grades", lang)}</th>
                {c2 > 0 && (
                  <>
                    <th colSpan={3} className="border border-gray-400 p-1 text-[12px] font-bold align-middle">{t("annual.grades", lang)}</th>
                    <th colSpan={3} className="border border-gray-400 p-1 text-[12px] font-bold align-middle">{t("annual.grades", lang)}</th>
                  </>
                )}
              </tr>
              {/* Row 3 */}
              <tr>
                <th className="border border-gray-400 p-1 text-xs w-8">5</th>
                <th className="border border-gray-400 p-1 text-xs w-8">4</th>
                <th className="border border-gray-400 p-1 text-xs w-8">3</th>
                
                {c2 > 0 && (
                  <>
                    <th className="border border-gray-400 p-1 text-xs w-8">5</th>
                    <th className="border border-gray-400 p-1 text-xs w-8">4</th>
                    <th className="border border-gray-400 p-1 text-xs w-8">3</th>
                    
                    <th className="border border-gray-400 p-1 text-xs w-8">5</th>
                    <th className="border border-gray-400 p-1 text-xs w-8">4</th>
                    <th className="border border-gray-400 p-1 text-xs w-8">3</th>
                  </>
                )}
              </tr>
            </thead>
            
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-row-type="student" className="hover:bg-indigo-50/60 transition-colors group bg-white border-b border-slate-200">
                  <td className="border border-slate-300 p-0 text-center bg-slate-50 no-export w-8 relative shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)]">
                    <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-500 transition-all mx-auto block cursor-pointer bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-200">
                      <Trash2 size={15} />
                    </button>
                    <div className="absolute inset-0 z-[-1] pointer-events-none group-hover:bg-slate-100 transition-colors"></div>
                  </td>
                  <Cell value={row.n || ''} onChange={(v: string) => updateRow(row.id, 'n', v)} className="bg-white" />
                  <Cell value={row.sinf || ''} onChange={(v: string) => updateRow(row.id, 'sinf', v)} className="text-left px-2 bg-white border-r focus-within:z-30 font-medium" />
                  <Cell value={row.oquvchiSoni || '-'} readonly />
                  
                  {/* BSB inputs */}
                  {c1Bsbs.map(i => {
                    const bsbKey = `${c1}_${i}`;
                    return (
                      <React.Fragment key={`cell_c1_bsb_${i}`}>
                        <Cell value={row[`bsb_${bsbKey}_ball`] || ''} readonly />
                        <Cell value={row[`bsb_${bsbKey}_foiz`] || ''} readonly />
                      </React.Fragment>
                    );
                  })}
                  
                  {c2 > 0 && c2Bsbs.map(i => {
                    const bsbKey = `${c2}_${i}`;
                    return (
                      <React.Fragment key={`cell_c2_bsb_${i}`}>
                        <Cell value={row[`bsb_${bsbKey}_ball`] || ''} readonly />
                        <Cell value={row[`bsb_${bsbKey}_foiz`] || ''} readonly />
                      </React.Fragment>
                    );
                  })}

                  {c2 > 0 && diffBsbs.map(i => (
                    <Cell key={`cell_diff_bsb_${i}`} value={getDiff(row[`bsb_${c2}_${i}_foiz`], row[`bsb_${c1}_${i}_foiz`])} readonly colorKey />
                  ))}
                  
                  {(() => {
                    return (
                      <React.Fragment key={`chsb_${c1}_${row.id}`}>
                        <Cell value={row[`chsb_${c1}_ball`] || ''} readonly />
                        <Cell value={row[`chsb_${c1}_foiz`] || ''} readonly />
                      </React.Fragment>
                    );
                  })()}
                  {c2 > 0 && (() => {
                    return (
                      <React.Fragment key={`chsb_${c2}_${row.id}`}>
                        <Cell value={row[`chsb_${c2}_ball`] || ''} readonly />
                        <Cell value={row[`chsb_${c2}_foiz`] || ''} readonly />
                        <Cell value={getDiff(row[`chsb_${c2}_foiz`], row[`chsb_${c1}_foiz`])} readonly colorKey />
                      </React.Fragment>
                    );
                  })()}
                  
                  <Cell value={getOrtacha(c1, row)} readonly className="bg-[#fcfcff] font-bold" />
                  {c2 > 0 && (
                    <>
                      <Cell value={getOrtacha(c2, row)} readonly className="bg-[#fcfcff] font-bold" />
                      <Cell value={getDiff(getOrtacha(c2, row), getOrtacha(c1, row))} readonly colorKey className="bg-[#fcfcff] font-bold" />
                    </>
                  )}
                  
                  <Cell value={row[`baho_${c1}_5`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c1}_5`, v)} />
                  <Cell value={row[`baho_${c1}_4`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c1}_4`, v)} />
                  <Cell value={row[`baho_${c1}_3`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c1}_3`, v)} />
                  
                  {c2 > 0 && (
                    <>
                      <Cell value={row[`baho_${c2}_5`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c2}_5`, v)} />
                      <Cell value={row[`baho_${c2}_4`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c2}_4`, v)} />
                      <Cell value={row[`baho_${c2}_3`] || ''} onChange={(v: string) => updateRow(row.id, `baho_${c2}_3`, v)} />
                      
                      <Cell value={getDiff(row[`baho_${c2}_5`], row[`baho_${c1}_5`])} readonly colorKey />
                      <Cell value={getDiff(row[`baho_${c2}_4`], row[`baho_${c1}_4`])} readonly colorKey />
                      <Cell value={getDiff(row[`baho_${c2}_3`], row[`baho_${c1}_3`])} readonly colorKey />
                    </>
                  )}
                </tr>
              ))}
              
              {/* Total Row */}
              {rows.length > 0 && (
                <tr className="bg-[#f0f0f4] shadow-[inset_0_1px_0_rgba(0,0,0,0.1)]">
                  <td className="no-export border border-gray-400 bg-gray-300"></td>
                  <td className="border border-gray-400" colSpan={3}>
                    <div className="flex items-center justify-end px-3 font-bold text-xs w-full h-full min-h-[30px] text-gray-800 tracking-wide">
                      {t("annual.total_avg", lang)}
                    </div>
                  </td>
                  
                  {c1Bsbs.map(i => (
                    <React.Fragment key={`avg_c1_bsb_${i}`}>
                      <Cell readonly value={colAverage(`bsb_${c1}_${i}_ball`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={colAverage(`bsb_${c1}_${i}_foiz`)} bold className="bg-[#fcfcff]" />
                    </React.Fragment>
                  ))}
                  
                  {c2 > 0 && c2Bsbs.map(i => (
                    <React.Fragment key={`avg_c2_bsb_${i}`}>
                      <Cell readonly value={colAverage(`bsb_${c2}_${i}_ball`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={colAverage(`bsb_${c2}_${i}_foiz`)} bold className="bg-[#fcfcff]" />
                    </React.Fragment>
                  ))}

                  {c2 > 0 && diffBsbs.map(i => (
                    <Cell key={`avg_diff_bsb_${i}`} readonly value={getDiff(colAverage(`bsb_${c2}_${i}_foiz`), colAverage(`bsb_${c1}_${i}_foiz`))} colorKey bold className="bg-[#fcfcff]" />
                  ))}
                  
                  <Cell readonly value={colAverage(`chsb_${c1}_ball`)} bold className="bg-[#fcfcff]" />
                  <Cell readonly value={colAverage(`chsb_${c1}_foiz`)} bold className="bg-[#fcfcff]" />
                  {c2 > 0 && (
                    <>
                      <Cell readonly value={colAverage(`chsb_${c2}_ball`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={colAverage(`chsb_${c2}_foiz`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={getDiff(colAverage(`chsb_${c2}_foiz`), colAverage(`chsb_${c1}_foiz`))} colorKey bold className="bg-[#fcfcff]" />
                    </>
                  )}
                  
                  <Cell readonly value={colOrtachaAverage(c1)} bold className="bg-[#fcfcff]" />
                  {c2 > 0 && (
                    <>
                      <Cell readonly value={colOrtachaAverage(c2)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={getDiff(colOrtachaAverage(c2), colOrtachaAverage(c1))} colorKey bold className="bg-[#fcfcff]" />
                    </>
                  )}
                  
                  <Cell readonly value={colAverage(`baho_${c1}_5`)} bold className="bg-[#fcfcff]" />
                  <Cell readonly value={colAverage(`baho_${c1}_4`)} bold className="bg-[#fcfcff]" />
                  <Cell readonly value={colAverage(`baho_${c1}_3`)} bold className="bg-[#fcfcff]" />
                  
                  {c2 > 0 && (
                    <>
                      <Cell readonly value={colAverage(`baho_${c2}_5`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={colAverage(`baho_${c2}_4`)} bold className="bg-[#fcfcff]" />
                      <Cell readonly value={colAverage(`baho_${c2}_3`)} bold className="bg-[#fcfcff]" />
                      
                      <Cell readonly value={getDiff(colAverage(`baho_${c2}_5`), colAverage(`baho_${c1}_5`))} colorKey bold className="bg-[#fcfcff]" />
                      <Cell readonly value={getDiff(colAverage(`baho_${c2}_4`), colAverage(`baho_${c1}_4`))} colorKey bold className="bg-[#fcfcff]" />
                      <Cell readonly value={getDiff(colAverage(`baho_${c2}_3`), colAverage(`baho_${c1}_3`))} colorKey bold className="bg-[#fcfcff]" />
                    </>
                  )}
                </tr>
              )}
              {(() => {
                    let cols = 3 + c1Bsbs.length * 2 + 2 + 1 + 3;
                    if (c2 > 0) {
                      cols += c2Bsbs.length * 2 + diffBsbs.length + 3 + 2 + 6;
                    }
                    return (
                      <React.Fragment key="footer_gap_rows">
                        <tr className="bg-white">
                          <td className="no-export border-none"></td>
                          <td colSpan={cols} className="h-6 border-none"></td>
                        </tr>
                        <tr className="bg-white">
                          <td className="no-export border-none"></td>
                          <td colSpan={Math.floor(cols / 2)} className="text-right pr-6 font-sans text-[15px] font-bold pb-4 border-none text-slate-700">
                            {t("annual.teacher_sign", lang)}
                          </td>
                          <td colSpan={Math.ceil(cols / 2)} className="text-left font-sans text-[15px] font-bold pb-4 border-none">
                            <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder={t("annual.teacher_placeholder", lang)} className="bg-transparent focus:border-b-2 border-slate-300 focus:border-indigo-500 outline-none w-64 transition-colors px-1 selection:bg-indigo-100 pb-1 text-slate-800" />
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })()}
            </tbody>
          </table>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Tabs */}
      <div className="w-full xl:w-[98%] mx-auto flex items-center bg-white/95 backdrop-blur-sm border border-slate-300/80 border-t-0 h-12 px-2 lg:px-3 text-sm font-sans rounded-b-2xl shadow-inner shadow-slate-100 overflow-x-auto">
        <div ref={tabsContainerRef} className="relative flex bg-slate-100 p-1 rounded-xl w-full min-w-fit lg:min-w-0">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-md shadow-slate-200/70 border border-slate-200/50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
          {[1, 2, 3, 4].map(sheet => {
            const title = t("bsb_chsb.quarter_" + sheet, lang);
            const isActive = activeSheet === sheet;
            return (
              <button
                key={sheet}
                ref={el => { tabRefs.current[sheet - 1] = el; }}
                onClick={() => switchSheet(sheet)}
                className={`relative z-10 flex-1 py-1.5 min-w-[80px] rounded-lg select-none font-medium transition-all duration-200 text-center text-xs lg:text-sm ${
                  isActive
                    ? 'text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
