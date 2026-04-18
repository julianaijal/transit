'use client';

import React from 'react';
import { IconRhythm, IconPulse, IconJourney, IconSearch } from './icons/Icons';

type Tab = 'rhythm' | 'pulse' | 'journey' | 'search';

interface TabBarProps {
  tab: Tab;
  hasJourney: boolean;
  onTabChange: (tab: Tab) => void;
}

export default function TabBar({ tab, hasJourney, onTabChange }: TabBarProps) {
  return (
    <nav className="tabbar">
      <button data-active={tab === 'rhythm'} onClick={() => onTabChange('rhythm')}>
        <IconRhythm /><span>Rhythm</span>
      </button>
      <button data-active={tab === 'pulse'} onClick={() => onTabChange('pulse')}>
        <IconPulse /><span>Pulse</span>
      </button>
      <button
        data-active={tab === 'journey'}
        onClick={() => onTabChange(hasJourney ? 'journey' : 'rhythm')}
      >
        <IconJourney /><span>Journey</span>
      </button>
      <button data-active={tab === 'search'} onClick={() => onTabChange('search')}>
        <IconSearch /><span>Search</span>
      </button>
    </nav>
  );
}
