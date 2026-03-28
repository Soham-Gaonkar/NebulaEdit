import { useState } from 'react';
import { 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  Maximize2,
  Sparkles,
  Sliders,
  Wand2,
  Layers2,
  Sun,
  ZoomIn,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditorTool } from '@/types/editor';

interface ToolGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  tools?: { id: EditorTool | string; name: string; icon: React.ElementType }[];
}

const toolGroups: ToolGroup[] = [
  {
    id: 'geometry',
    name: 'Geometry',
    icon: Maximize2,
    color: 'from-blue-500 to-cyan-500',
    tools: [
      { id: 'crop', name: 'Crop', icon: Crop },
      { id: 'rotate', name: 'Rotate', icon: RotateCw },
      { id: 'flip', name: 'Flip', icon: FlipHorizontal },
      { id: 'scale', name: 'Scale', icon: Maximize2 },
    ],
  },
  {
    id: 'filters',
    name: 'Filters',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'adjustments',
    name: 'Adjustments',
    icon: Sliders,
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'ai-tools',
    name: 'AI Tools',
    icon: Wand2,
    color: 'from-nebula-purple to-nebula-pink',
    tools: [
      { id: 'ai-edit', name: 'Edit with AI', icon: Wand2 },
      { id: 'ai-merge', name: 'Multi-Image Edit', icon: Layers2 },
      { id: 'relight', name: 'Relighting', icon: Sun },
      { id: 'magicquill', name: 'MagicQuill', icon: Sparkles },
      { id: 'upscale', name: 'Upscale', icon: ZoomIn },
      { id: 'denoise', name: 'Denoise', icon: Volume2 },
    ],
  },
];

interface RadialToolMenuProps {
  isOpen: boolean;
  onToolSelect: (toolId: string) => void;
  onGroupSelect: (groupId: string) => void;
}

export function RadialToolMenu({ isOpen, onToolSelect, onGroupSelect }: RadialToolMenuProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGroupClick = (group: ToolGroup) => {
    if (group.tools) {
      setSelectedGroup(selectedGroup === group.id ? null : group.id);
    } else {
      onGroupSelect(group.id);
    }
  };

  const radius = 120;
  const angleStep = (2 * Math.PI) / toolGroups.length;

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-24 pointer-events-auto">
      {/* Main tool groups in circular layout */}
      {toolGroups.map((group, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <div
            key={group.id}
            className={cn(
              'absolute transition-all duration-500 ease-out',
              'opacity-0 scale-0',
              isOpen && 'opacity-100 scale-100'
            )}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <button
              onClick={() => handleGroupClick(group)}
              className={cn(
                'group relative -translate-x-1/2 -translate-y-1/2',
                'w-14 h-14 rounded-full flex items-center justify-center',
                'bg-gradient-to-br backdrop-blur-xl',
                group.color,
                'shadow-lg hover:shadow-2xl',
                'transition-all duration-300',
                'hover:scale-110 active:scale-95',
                'border border-white/20',
                selectedGroup === group.id && 'scale-110 ring-2 ring-primary'
              )}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Icon */}
              <group.icon className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
              
              {/* Label */}
              <div className={cn(
                'absolute top-full mt-2 px-2 py-1 rounded-lg',
                'bg-background/90 backdrop-blur-sm border border-border/50',
                'text-xs font-medium text-foreground whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'pointer-events-none'
              )}>
                {group.name}
              </div>
            </button>

            {/* Sub-tools for groups with tools */}
            {selectedGroup === group.id && group.tools && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {group.tools.map((tool, toolIndex) => {
                  const subRadius = 80;
                  const subAngleStep = (2 * Math.PI) / group.tools!.length;
                  const subAngle = toolIndex * subAngleStep - Math.PI / 2;
                  const subX = Math.cos(subAngle) * subRadius;
                  const subY = Math.sin(subAngle) * subRadius;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => onToolSelect(tool.id)}
                      className={cn(
                        'absolute w-10 h-10 rounded-full',
                        'bg-card/90 backdrop-blur-xl border border-border/50',
                        'flex items-center justify-center',
                        'hover:bg-primary/20 hover:border-primary/50',
                        'transition-all duration-300',
                        'hover:scale-110 active:scale-95',
                        'shadow-lg',
                        'animate-scale-in'
                      )}
                      style={{
                        left: subX,
                        top: subY,
                        animationDelay: `${toolIndex * 50}ms`,
                      }}
                    >
                      <tool.icon className="w-5 h-5 text-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Central connecting lines */}
      {isOpen && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          {toolGroups.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <line
                key={index}
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${x}px)`}
                y2={`calc(50% + ${y}px)`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                opacity="0.3"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              />
            );
          })}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  );
}
