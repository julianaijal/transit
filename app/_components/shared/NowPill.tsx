'use client';

import React, { useState, useEffect } from 'react';

interface NowPillProps {
  label?: string;
}

export default function NowPill({ label }: NowPillProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="now-pill">
      <span className="dot live" /> {label ?? time}
    </span>
  );
}
