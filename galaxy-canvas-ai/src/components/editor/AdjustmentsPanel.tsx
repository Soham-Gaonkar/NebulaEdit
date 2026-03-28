import { useEditorStore } from '@/store/editorStore';
import { Lightbulb, Sun, Droplets, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type AdjustmentKey = 'brightness' | 'contrast' | 'saturation' | 'exposure';

interface Adjustment {
  key: AdjustmentKey;
  label: string;
  icon: any;
}

const adjustments: Adjustment[] = [
  { key: 'brightness', label: 'Light balance', icon: Lightbulb },
  { key: 'exposure', label: 'Exposure', icon: Sun },
  { key: 'contrast', label: 'Contrast', icon: Droplets },
  { key: 'saturation', label: 'Saturation', icon: Palette },
];

export function AdjustmentsPanel() {
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentKey>('brightness');
  const { adjustments: values } = useEditorStore();

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {/* Auto button */}
        <button 
          onClick={() => console.log('Auto adjust')}
          className="flex-shrink-0 px-6 py-3 rounded-2xl bg-card/50 border border-border/30 hover:bg-card transition-all"
        >
          <span className="text-sm font-medium">Auto</span>
        </button>

        {/* Adjustment buttons */}
        {adjustments.map((adjustment) => {
          const Icon = adjustment.icon;
          const isSelected = selectedAdjustment === adjustment.key;
          
          return (
            <button
              key={adjustment.key}
              onClick={() => setSelectedAdjustment(adjustment.key)}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-white text-black scale-110" 
                  : "bg-card/50 border border-border/30 text-foreground hover:bg-card"
              )}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
