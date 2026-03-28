import { Plus, X, Crop, Palette, Sun, Pen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolType = 'geometry' | 'filters' | 'adjustments' | 'draw' | 'ai' | null;

interface ActionOrbProps {
  isExpanded: boolean;
  onToggle: () => void;
  onToolSelect: (tool: ToolType) => void;
  selectedTool: string | null;
}

const tools = [
  { id: 'geometry' as ToolType, icon: Crop, label: 'Geometry', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'filters' as ToolType, icon: Palette, label: 'Filters', gradient: 'from-purple-500 to-pink-500' },
  { id: 'adjustments' as ToolType, icon: Sun, label: 'Adjust', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'draw' as ToolType, icon: Pen, label: 'Draw', gradient: 'from-green-500 to-emerald-500' },
  { id: 'ai' as ToolType, icon: Sparkles, label: 'AI Tools', gradient: 'from-violet-500 to-fuchsia-500' },
];

export function ActionOrb({ isExpanded, onToggle, onToolSelect, selectedTool }: ActionOrbProps) {
  return (
    <div className="relative">
      {/* Orbit Rings */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          "transition-opacity duration-500",
          isExpanded ? "opacity-30" : "opacity-100"
        )}
      >
        <div className="absolute w-32 h-32 rounded-full border border-primary/20" />
        <div className="absolute w-40 h-40 rounded-full border border-nebula-pink/20" />
        <div className="absolute w-48 h-48 rounded-full border border-star-cyan/20" />
      </div>

      {/* Pulsing Glow */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500',
          isExpanded ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="w-32 h-32 rounded-full bg-primary/30 blur-3xl animate-pulse" />
      </div>

      {/* Rotating Orbital Container - No Spin */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "transition-opacity duration-300", // Faster transition
          isExpanded ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Icons positioned in semi-circle arch */}
        {tools.map((tool, index) => {
          // Calculate angle for semi-circle (arch)
          // Start from -PI (left) to 0 (right), centered at -PI/2 (top)
          const totalAngle = Math.PI; // 180 degrees
          const startAngle = Math.PI; // Start at 180 (left)
          const step = totalAngle / (tools.length - 1);
          const angle = startAngle + (index * step);

          const radius = 110; // Distance from center
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <div
              key={tool.id}
              className={cn(
                'absolute w-14 h-14',
                'flex items-center justify-center',
                'transition-all duration-300 ease-out', // Faster transition
                isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
                'left-1/2 top-1/2 -ml-7 -mt-7'
              )}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                transitionDelay: `${index * 30}ms`, // Faster stagger
              }}
            >
              <button
                onClick={() => onToolSelect(tool.id)}
                className={cn(
                  'w-full h-full rounded-full',
                  'flex items-center justify-center',
                  'transition-transform duration-200 ease-out', // Independent hover transition
                  'hover:scale-125 active:scale-95', // Larger hover scale
                  'border-2',
                  `bg-gradient-to-br ${tool.gradient}`,
                  isSelected
                    ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.6)] scale-110'
                    : 'border-white/30 shadow-[0_0_20px_rgba(139,92,246,0.4)]',
                  'backdrop-blur-sm'
                )}
              >
                <Icon className="w-6 h-6 text-white" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main Orb */}
      <button
        onClick={onToggle}
        className={cn(
          "relative z-10 w-20 h-20 rounded-full",
          "bg-gradient-to-br from-primary via-nebula-pink to-primary",
          "hover:scale-110 active:scale-95",
          "transition-all duration-300",
          "shadow-[0_0_50px_rgba(139,92,246,0.5)]",
          "flex items-center justify-center",
          "border-2 border-primary/50",
          isExpanded && "rotate-180 scale-90"
        )}
      >
        {isExpanded ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <Plus className="w-8 h-8 text-white" />
        )}
      </button>
    </div>
  );
}
