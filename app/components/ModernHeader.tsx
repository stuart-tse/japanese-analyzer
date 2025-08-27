'use client';

import React from 'react';
import { UserCircle, LogIn, Settings, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '@/app/lib/utils';
import { useTheme } from 'next-themes';

interface ModernHeaderProps {
  onMemberClick?: () => void;
  onLoginClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export default function ModernHeader({
  onMemberClick,
  onLoginClick,
  onSettingsClick,
  className
}: ModernHeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to Dark Mode';
      case 'dark':
        return 'Switch to System Theme';
      default:
        return 'Switch to Light Mode';
    }
  };

  return (
    <TooltipProvider>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "bg-japanese-beige-light/95 dark:bg-[var(--surface)]/95",
          "border-japanese-blue-gray-cool/20 dark:border-[var(--outline)]/40",
          className
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - Logo/Title */}
          <div className="flex items-center space-x-2">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--grammar-verb)' }}>
              日本語
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-base font-medium" style={{ color: 'var(--on-surface)' }}>
                Japanese Sentence Analyzer
              </h1>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                AI-powered analysis for Chinese learners
              </p>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Member Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMemberClick}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10",
                    "transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95"
                  )}
                  style={{ 
                    color: 'var(--on-surface)',
                  }}
                  aria-label="Member profile and progress"
                >
                  <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Member Profile</p>
                <p className="text-xs text-muted-foreground">View progress & achievements</p>
              </TooltipContent>
            </Tooltip>

            {/* Login Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLoginClick}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10",
                    "transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95"
                  )}
                  style={{ 
                    color: 'var(--on-surface)',
                  }}
                  aria-label="Login or register"
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign In</p>
                <p className="text-xs text-muted-foreground">Access your account</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsClick}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10",
                    "transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95"
                  )}
                  style={{ 
                    color: 'var(--grammar-verb)',
                  }}
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
                <p className="text-xs text-muted-foreground">API keys & preferences</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10",
                    "transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95"
                  )}
                  style={{ 
                    color: 'var(--on-surface)',
                  }}
                  aria-label={getThemeLabel()}
                >
                  {getThemeIcon()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Theme</p>
                <p className="text-xs text-muted-foreground">{getThemeLabel()}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile subtitle */}
        <div className="sm:hidden border-t" style={{ borderColor: 'var(--outline)' }}>
          <div className="container px-4 py-2">
            <p className="text-xs text-center" style={{ color: 'var(--on-surface-variant)' }}>
              AI-powered Japanese analysis for Chinese learners
            </p>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}