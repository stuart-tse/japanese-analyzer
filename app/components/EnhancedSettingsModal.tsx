'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Globe, Eye, Palette, Download, Upload, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '@/app/lib/utils';

interface EnhancedSettingsModalProps {
  userApiKey: string;
  userApiUrl: string;
  defaultApiUrl: string;
  useStream: boolean;
  onSaveSettings: (apiKey: string, apiUrl: string, useStream: boolean) => void;
  isModalOpen: boolean;
  onModalClose: () => void;
}

export default function EnhancedSettingsModal({
  userApiKey,
  userApiUrl,
  defaultApiUrl,
  useStream,
  onSaveSettings,
  isModalOpen,
  onModalClose
}: EnhancedSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'preferences' | 'accessibility' | 'data'>('api');
  const [apiKey, setApiKey] = useState(userApiKey);
  const [apiUrl, setApiUrl] = useState(userApiUrl === defaultApiUrl ? '' : userApiUrl);
  const [streamEnabled, setStreamEnabled] = useState(useStream);
  const [status, setStatus] = useState('');
  const [statusClass, setStatusClass] = useState('');

  // Preferences state
  const [defaultAnalysisMode, setDefaultAnalysisMode] = useState<'tokens' | 'grammar' | 'translation' | 'pronunciation'>('tokens');
  const [showFuriganaByDefault, setShowFuriganaByDefault] = useState(true);
  const [defaultLearningMode, setDefaultLearningMode] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Accessibility state
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      // Load preferences from localStorage
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setDefaultAnalysisMode(prefs.defaultAnalysisMode || 'tokens');
        setShowFuriganaByDefault(prefs.showFuriganaByDefault !== false);
        setDefaultLearningMode(prefs.defaultLearningMode || 'intermediate');
        setAutoTranslate(prefs.autoTranslate || false);
        setHighContrast(prefs.highContrast || false);
        setReducedMotion(prefs.reducedMotion || false);
        setFontSize(prefs.fontSize || 'normal');
        setScreenReaderOptimized(prefs.screenReaderOptimized || false);
      }
    }

    setApiKey(userApiKey);
    setApiUrl(userApiUrl === defaultApiUrl ? '' : userApiUrl);
    setStreamEnabled(useStream);
  }, [userApiKey, userApiUrl, defaultApiUrl, useStream, isModalOpen]);

  const handleSaveSettings = () => {
    const trimmedApiKey = apiKey.trim();
    const trimmedApiUrl = apiUrl.trim();
    
    // Save API settings
    onSaveSettings(
      trimmedApiKey,
      trimmedApiUrl || defaultApiUrl,
      streamEnabled
    );

    // Save user preferences
    const preferences = {
      defaultAnalysisMode,
      showFuriganaByDefault,
      defaultLearningMode,
      autoTranslate,
      highContrast,
      reducedMotion,
      fontSize,
      screenReaderOptimized
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));

    setStatus('Settings saved successfully!');
    setStatusClass('text-green-600');
    
    setTimeout(() => {
      setStatus('');
      onModalClose();
    }, 1500);
  };

  const handleExportSettings = () => {
    const settings = {
      apiKey: apiKey.trim(),
      apiUrl: apiUrl.trim() || defaultApiUrl,
      useStream: streamEnabled,
      preferences: {
        defaultAnalysisMode,
        showFuriganaByDefault,
        defaultLearningMode,
        autoTranslate,
        highContrast,
        reducedMotion,
        fontSize,
        screenReaderOptimized
      }
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'japanese-analyzer-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          if (settings.apiKey) setApiKey(settings.apiKey);
          if (settings.apiUrl) setApiUrl(settings.apiUrl === defaultApiUrl ? '' : settings.apiUrl);
          if (typeof settings.useStream === 'boolean') setStreamEnabled(settings.useStream);
          
          if (settings.preferences) {
            const prefs = settings.preferences;
            if (prefs.defaultAnalysisMode) setDefaultAnalysisMode(prefs.defaultAnalysisMode);
            if (typeof prefs.showFuriganaByDefault === 'boolean') setShowFuriganaByDefault(prefs.showFuriganaByDefault);
            if (prefs.defaultLearningMode) setDefaultLearningMode(prefs.defaultLearningMode);
            if (typeof prefs.autoTranslate === 'boolean') setAutoTranslate(prefs.autoTranslate);
            if (typeof prefs.highContrast === 'boolean') setHighContrast(prefs.highContrast);
            if (typeof prefs.reducedMotion === 'boolean') setReducedMotion(prefs.reducedMotion);
            if (prefs.fontSize) setFontSize(prefs.fontSize);
            if (typeof prefs.screenReaderOptimized === 'boolean') setScreenReaderOptimized(prefs.screenReaderOptimized);
          }

          setStatus('Settings imported successfully!');
          setStatusClass('text-green-600');
        } catch {
          setStatus('Error importing settings file');
          setStatusClass('text-red-600');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isModalOpen) return null;

  const tabs = [
    { id: 'api' as const, label: 'API Configuration', icon: Key },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'accessibility' as const, label: 'Accessibility', icon: Eye },
    { id: 'data' as const, label: 'Data Management', icon: Download }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onModalClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "bg-card rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col",
            "animate-in zoom-in-95 slide-in-from-bottom-2 duration-200",
            "border border-border"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-semibold text-foreground">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onModalClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-border bg-japanese-beige-light/30 dark:bg-japanese-beige-light/5 flex-shrink-0">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "bg-japanese-red-primary text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-japanese-beige-light/50 dark:hover:bg-japanese-beige-light/10"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 flex-1 min-h-0">
                {/* API Configuration Tab */}
                {activeTab === 'api' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">API Configuration</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Configure your AI API settings for Japanese text analysis
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key"
                            className={cn(
                              "w-full pl-10 pr-3 py-2 border rounded-md bg-background text-foreground",
                              "focus:outline-none focus:ring-2 focus:ring-japanese-red-primary focus:border-transparent",
                              "border-border"
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for AI-powered analysis. Get your key from Google AI Studio.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Custom API URL (Optional)
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <input
                            type="url"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://custom-api-endpoint.com/v1"
                            className={cn(
                              "w-full pl-10 pr-3 py-2 border rounded-md bg-background text-foreground",
                              "focus:outline-none focus:ring-2 focus:ring-japanese-red-primary focus:border-transparent",
                              "border-border"
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to use the default Google Gemini API endpoint.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="streamEnabled"
                          checked={streamEnabled}
                          onChange={(e) => setStreamEnabled(e.target.checked)}
                          className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                        />
                        <label htmlFor="streamEnabled" className="text-sm font-medium text-foreground">
                          Enable Streaming Responses
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Show analysis results in real-time as they&apos;re generated (recommended).
                      </p>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Analysis Preferences</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Customize your Japanese learning experience
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Default Analysis Mode
                        </label>
                        <select
                          value={defaultAnalysisMode}
                          onChange={(e) => setDefaultAnalysisMode(e.target.value as 'tokens' | 'grammar' | 'translation' | 'pronunciation')}
                          className={cn(
                            "w-full px-3 py-2 border rounded-md bg-background text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-japanese-red-primary focus:border-transparent",
                            "border-border"
                          )}
                        >
                          <option value="tokens">Tokens - Word breakdown</option>
                          <option value="grammar">Grammar - Sentence structure</option>
                          <option value="translation">Translation - Chinese meaning</option>
                          <option value="pronunciation">Pronunciation - Phonetic guide</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Default Learning Level
                        </label>
                        <select
                          value={defaultLearningMode}
                          onChange={(e) => setDefaultLearningMode(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                          className={cn(
                            "w-full px-3 py-2 border rounded-md bg-background text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-japanese-red-primary focus:border-transparent",
                            "border-border"
                          )}
                        >
                          <option value="beginner">Beginner - Full guidance</option>
                          <option value="intermediate">Intermediate - Balanced support</option>
                          <option value="advanced">Advanced - Minimal assistance</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="showFuriganaByDefault"
                            checked={showFuriganaByDefault}
                            onChange={(e) => setShowFuriganaByDefault(e.target.checked)}
                            className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                          />
                          <label htmlFor="showFuriganaByDefault" className="text-sm font-medium text-foreground">
                            Show Furigana by Default
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="autoTranslate"
                            checked={autoTranslate}
                            onChange={(e) => setAutoTranslate(e.target.checked)}
                            className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                          />
                          <label htmlFor="autoTranslate" className="text-sm font-medium text-foreground">
                            Auto-translate after Analysis
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Accessibility Options</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Customize the interface for better accessibility
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Font Size
                        </label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 border rounded-md bg-background text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-japanese-red-primary focus:border-transparent",
                            "border-border"
                          )}
                        >
                          <option value="small">Small</option>
                          <option value="normal">Normal</option>
                          <option value="large">Large</option>
                          <option value="extra-large">Extra Large</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="highContrast"
                            checked={highContrast}
                            onChange={(e) => setHighContrast(e.target.checked)}
                            className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                          />
                          <label htmlFor="highContrast" className="text-sm font-medium text-foreground">
                            High Contrast Mode
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="reducedMotion"
                            checked={reducedMotion}
                            onChange={(e) => setReducedMotion(e.target.checked)}
                            className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                          />
                          <label htmlFor="reducedMotion" className="text-sm font-medium text-foreground">
                            Reduce Motion and Animations
                          </label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="screenReaderOptimized"
                            checked={screenReaderOptimized}
                            onChange={(e) => setScreenReaderOptimized(e.target.checked)}
                            className="rounded border-border text-japanese-red-primary focus:ring-japanese-red-primary"
                          />
                          <label htmlFor="screenReaderOptimized" className="text-sm font-medium text-foreground">
                            Screen Reader Optimizations
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Management Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Data Management</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Export, import, and manage your settings and data
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Button onClick={handleExportSettings} variant="outline" className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Export Settings</span>
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Download your current settings as a JSON file
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <label htmlFor="import-settings" className="cursor-pointer">
                          <Button asChild variant="outline" className="flex items-center space-x-2">
                            <span>
                              <Upload className="w-4 h-4" />
                              <span>Import Settings</span>
                            </span>
                          </Button>
                        </label>
                        <input
                          id="import-settings"
                          type="file"
                          accept=".json"
                          onChange={handleImportSettings}
                          className="hidden"
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload a previously exported settings file
                        </p>
                      </div>

                      <div className="bg-japanese-beige-light/30 dark:bg-japanese-beige-light/10 p-4 rounded-lg border border-border">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-japanese-red-primary mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Privacy Notice</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              All your data is stored locally in your browser. We don&apos;t collect or store any personal information on our servers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border flex-shrink-0">
            <div>
              {status && (
                <p className={cn("text-sm", statusClass)}>
                  {status}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onModalClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings}
                className="bg-japanese-red-primary hover:bg-japanese-red-primary/90 text-white"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}