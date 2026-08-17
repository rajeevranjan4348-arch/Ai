import { useState, useEffect, useCallback } from 'react';
import {
  globalDreamEngine,
  globalUndercoverSanitizer,
  globalKairosAssistant,
  globalTeamSwarmOrchestrator,
  rollCompanion,
  renderCompanionSprite,
  formatSpeechBubble,
  CompanionBones,
  DreamSession,
  SwarmTeam,
  KairosTrigger,
  CLAW_SYSTEM_TOOLS,
} from '@/lib/claw';

export function useClawSystem() {
  const [companion, setCompanion] = useState<CompanionBones | null>(null);
  const [companionSpriteFrame, setCompanionSpriteFrame] = useState(0);
  const [dreamSessions, setDreamSessions] = useState<DreamSession[]>([]);
  const [isDreaming, setIsDreaming] = useState(false);
  const [teams, setTeams] = useState<SwarmTeam[]>([]);
  const [triggers, setTriggers] = useState<KairosTrigger[]>([]);
  const [undercoverActive, setUndercoverActive] = useState(true);

  // Initialize companion on mount
  useEffect(() => {
    const rolled = rollCompanion('user-primary');
    setCompanion(rolled);
  }, []);

  // Sprite animation tick loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCompanionSpriteFrame((f) => (f + 1) % 2);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial system states
  const refreshSystemStates = useCallback(() => {
    setDreamSessions(globalDreamEngine.getDreamHistory());
    setTeams(globalTeamSwarmOrchestrator.getTeams());
    setTriggers(globalKairosAssistant.getTriggers());
    setUndercoverActive(globalUndercoverSanitizer.getIsUndercoverActive());
  }, []);

  useEffect(() => {
    refreshSystemStates();
  }, [refreshSystemStates]);

  // Execute Dream Mode Memory Consolidation
  const runDreamConsolidation = useCallback(async () => {
    setIsDreaming(true);
    try {
      await globalDreamEngine.executeDreamCycle();
      setDreamSessions(globalDreamEngine.getDreamHistory());
    } finally {
      setIsDreaming(false);
    }
  }, []);

  // Sanitize outgoing message using Undercover Mode
  const sanitizeMessage = useCallback((text: string) => {
    return globalUndercoverSanitizer.sanitizeOutput(text);
  }, []);

  // Render Companion ASCII lines
  const companionLines = companion ? renderCompanionSprite(companion, companionSpriteFrame) : [];

  return {
    companion,
    companionLines,
    formatSpeechBubble,
    dreamSessions,
    isDreaming,
    runDreamConsolidation,
    teams,
    triggers,
    undercoverActive,
    setUndercoverActive: (val: boolean) => {
      globalUndercoverSanitizer.setUndercoverActive(val);
      setUndercoverActive(val);
    },
    sanitizeMessage,
    tools: CLAW_SYSTEM_TOOLS,
    refreshSystemStates,
  };
}
