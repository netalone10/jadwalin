"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/constants/lang";

const LangContext = createContext<[Lang, (l: Lang) => void]>(["id", () => {}]);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("id");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "en" || stored === "id") setLang(stored);
  }, []);

  const onChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  return <LangContext.Provider value={[lang, onChange]}>{children}</LangContext.Provider>;
}

export function useLang(): [Lang, (l: Lang) => void] {
  return useContext(LangContext);
}

interface LangToggleProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

export function LangToggle({ lang, onChange }: LangToggleProps) {
  return (
    <button
      onClick={() => onChange(lang === "id" ? "en" : "id")}
      className="text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle language"
    >
      {lang === "id" ? "EN" : "ID"}
    </button>
  );
}
