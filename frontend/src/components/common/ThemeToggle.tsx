"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("techatlas-theme");
    const initialTheme: Theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  const updateTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("techatlas-theme", nextTheme);
  };

  return <div className="theme-surface pointer-events-auto inline-flex rounded-md border border-white/15 p-0.5 text-[10px] font-medium">
    <button type="button" aria-pressed={theme === "light"} onClick={() => updateTheme("light")} className={`rounded px-2.5 py-1.5 transition ${theme === "light" ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:text-white"}`}>Light</button>
    <button type="button" aria-pressed={theme === "dark"} onClick={() => updateTheme("dark")} className={`rounded px-2.5 py-1.5 transition ${theme === "dark" ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:text-white"}`}>Dark</button>
  </div>;
}
