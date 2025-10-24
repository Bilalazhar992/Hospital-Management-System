"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useThemeStore } from "../../store/theme-store";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync Zustand store with next-themes
  useEffect(() => {
    if (mounted) {
      if (theme === "dark" && !isDarkMode) {
        useThemeStore.setState({ isDarkMode: true });
      } else if (theme === "light" && isDarkMode) {
        useThemeStore.setState({ isDarkMode: false });
      }
    }
  }, [theme, isDarkMode, mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const handleToggleTheme = () => {
    toggleTheme();
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleToggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}