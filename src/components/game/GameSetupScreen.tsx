import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Volume2, VolumeX } from "lucide-react";
import { AdaptiveDifficultyToggle } from "@/components/ui/AdaptiveDifficultyToggle";
export type GameMode = "single-visual" | "single-audio" | "dual";

interface GameSetupScreenProps {
  onBack: () => void; gameMode: GameMode; setGameMode: (mode: GameMode) => void;
  nLevel: number; setNLevel: (updater: number | ((prev: number) => number)) => void;
  numTrials: number; setNumTrials: (updater: number | ((prev: number) => number)) => void;
  stimulusDurationMs: number; setStimulusDurationMs: (updater: number | ((prev: number) => number)) => void;
  audioEnabled: boolean; setAudioEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  onStartGame: () => void; isPracticeMode?: boolean;
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  onBack, gameMode, setGameMode, nLevel, setNLevel, numTrials, setNumTrials,
  stimulusDurationMs, setStimulusDurationMs, audioEnabled, setAudioEnabled,
  onStartGame, isPracticeMode,
}) => {
  if (isPracticeMode) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          <h1 className="text-3xl font-bold text-gray-900">N-Back Training Setup</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Select Training Mode</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { mode: "single-visual" as const, title: "Single N-Back (Visual)", desc: "Remember visual positions only" },
                { mode: "single-audio" as const, title: "Single N-Back (Audio)", desc: "Remember audio letters only" },
                { mode: "dual" as const, title: "Dual N-Back", desc: "Remember both visual and audio stimuli" }
              ].map(({ mode: m, title, desc }) => (
                <div key={m} className={`p-4 border-2 rounded-lg transition-all ${ gameMode === m ? "border-blue-500 bg-blue-50" : "border-gray-200" } ${isPracticeMode ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-gray-300"}`}
                  onClick={() => { if (!isPracticeMode) setGameMode(m); }}>
                  <div className="font-semibold">{title}</div><div className="text-sm text-gray-600">{desc}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Training Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div><label className="block text-sm font-medium mb-2">N-Level</label><div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setNLevel(prev => Math.max(1, prev - 1))} disabled={isPracticeMode || nLevel <= 1}>-</Button>
                <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">{nLevel}-Back</Badge>
                <Button variant="outline" size="sm" onClick={() => setNLevel(prev => Math.min(8, prev + 1))} disabled={isPracticeMode || nLevel >= 8}>+</Button>
              </div></div>
              <div><label className="block text-sm font-medium mb-2">Number of Trials</label><div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setNumTrials(prev => Math.max(10, prev - 5))} disabled={isPracticeMode || numTrials <= 10}>-</Button>
                <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">{numTrials}</Badge>
                <Button variant="outline" size="sm" onClick={() => setNumTrials(prev => Math.min(50, prev + 5))} disabled={isPracticeMode || numTrials >= 50}>+</Button>
              </div></div>
              <div><label className="block text-sm font-medium mb-2">Stimulus Duration</label><div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setStimulusDurationMs(prev => Math.max(2000, prev - 500))} disabled={isPracticeMode || stimulusDurationMs <= 2000}>-</Button>
                <Badge variant="secondary" className="px-4 py-2 text-lg font-bold">{(stimulusDurationMs / 1000).toFixed(1)}s</Badge>
                <Button variant="outline" size="sm" onClick={() => setStimulusDurationMs(prev => Math.min(4000, prev + 500))} disabled={isPracticeMode || stimulusDurationMs >= 4000}>+</Button>
              </div></div>
              <div><label className="block text-sm font-medium mb-2">Audio Settings</label>
                <Button variant="outline" onClick={() => setAudioEnabled(prev => !prev)} className="gap-2">
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{audioEnabled ? "Audio On" : "Audio Off"}
                </Button>
              </div>
              <div className="pt-4 border-t"><div className="text-sm text-gray-600 space-y-1">
                <div>• Trials: {numTrials}</div>
                <div>• Duration: ~{Math.ceil(numTrials * (stimulusDurationMs / 1000 + 1) / 60)} minutes</div>
                <div>• Mode: {gameMode.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
              </div></div>
              {!isPracticeMode && (<div className="pt-4"><AdaptiveDifficultyToggle /><p className="text-xs text-gray-500 mt-1 pl-1">N-Level adjusts based on performance.</p></div>)}
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-center mt-8">
          <Button size="lg" onClick={onStartGame} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg gap-2">
            <Play className="h-5 w-5" /> Start Training Session</Button>
        </div>
      </div>
    </div>
  );
};
