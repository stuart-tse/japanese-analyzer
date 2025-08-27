'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Trophy, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '@/app/lib/utils';

interface UserProfile {
  name: string;
  email: string;
  joinDate: string;
  learningStreak: number;
  totalAnalyses: number;
  wordsLearned: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedDate: string;
    icon: string;
  }>;
}

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberProfileModal({ isOpen, onClose }: MemberProfileModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        // Create default profile for demo
        const defaultProfile: UserProfile = {
          name: 'Japanese Learner',
          email: 'learner@example.com',
          joinDate: new Date().toLocaleDateString(),
          learningStreak: 5,
          totalAnalyses: 47,
          wordsLearned: 312,
          currentLevel: 'intermediate',
          achievements: [
            {
              id: '1',
              title: 'First Analysis',
              description: 'Completed your first sentence analysis',
              earnedDate: new Date().toLocaleDateString(),
              icon: '🎯'
            },
            {
              id: '2',
              title: 'Grammar Explorer',
              description: 'Used grammar analysis 10 times',
              earnedDate: new Date().toLocaleDateString(),
              icon: '📚'
            },
            {
              id: '3',
              title: 'Consistent Learner',
              description: '5-day learning streak',
              earnedDate: new Date().toLocaleDateString(),
              icon: '🔥'
            }
          ]
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
      }
    }
  }, [isOpen]);

  if (!isOpen || !userProfile) return null;

  const levelColors = {
    beginner: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    intermediate: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    advanced: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto",
            "animate-in zoom-in-95 slide-in-from-bottom-2 duration-200",
            "border border-border"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-japanese-red-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-japanese-red-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{userProfile.name}</h2>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Level and Join Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Level:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", levelColors[userProfile.currentLevel])}>
                  {userProfile.currentLevel}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {userProfile.joinDate}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-japanese-beige-light/50 dark:bg-japanese-beige-light/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{userProfile.learningStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>

              <div className="bg-japanese-beige-light/50 dark:bg-japanese-beige-light/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 mx-auto mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{userProfile.totalAnalyses}</div>
                <div className="text-sm text-muted-foreground">Analyses</div>
              </div>

              <div className="bg-japanese-beige-light/50 dark:bg-japanese-beige-light/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto mb-2">
                  <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-foreground">{userProfile.wordsLearned}</div>
                <div className="text-sm text-muted-foreground">Words Learned</div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-japanese-red-primary" />
                Achievements
              </h3>
              <div className="space-y-3">
                {userProfile.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 rounded-lg bg-japanese-beige-light/30 dark:bg-japanese-beige-light/5 border border-border">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{achievement.earnedDate}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Progress */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Learning Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Grammar Understanding</span>
                    <span className="text-foreground">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-japanese-red-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Vocabulary</span>
                    <span className="text-foreground">60%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-japanese-blue-gray-cool h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Reading Comprehension</span>
                    <span className="text-foreground">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-japanese-brown-warm h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              className="bg-japanese-red-primary hover:bg-japanese-red-primary/90 text-white"
              onClick={() => {
                // TODO: Implement profile edit functionality
                console.log('Edit profile clicked');
              }}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}