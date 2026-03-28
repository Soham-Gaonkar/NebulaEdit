import { 
  MousePointer2, 
  Crop, 
  RotateCw, 
  Paintbrush, 
  Eraser, 
  Type, 
  Square, 
  Move,
  ZoomIn,
  Undo2,
  Redo2,
  Download,
  FlipHorizontal,
  FlipVertical,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/store/editorStore';
import type { EditorTool } from '@/types/editor';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  tool: EditorTool;
  icon: React.ElementType;
  label: string;
}

function ToolButton({ tool, icon: Icon, label }: ToolButtonProps) {
  const { selectedTool, setTool } = useEditorStore();
  const isActive = selectedTool === tool;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setTool(tool)}
          className={cn(
            'relative',
            isActive && 'glow-border'
          )}
        >
          <Icon className="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface EditorToolbarProps {
  onExport: () => void;
  onMagicQuill?: () => void;
}

export function EditorToolbar({ onExport, onMagicQuill }: EditorToolbarProps) {
  const { 
    undo, 
    redo, 
    history, 
    historyIndex,
    rotation,
    setRotation,
    flipH,
    flipV,
    setFlipH,
    setFlipV
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const tools: ToolButtonProps[] = [
    { tool: 'select', icon: MousePointer2, label: 'Select' },
    { tool: 'move', icon: Move, label: 'Move' },
    { tool: 'crop', icon: Crop, label: 'Crop' },
    { tool: 'rotate', icon: RotateCw, label: 'Rotate' },
    { tool: 'brush', icon: Paintbrush, label: 'Brush' },
    { tool: 'eraser', icon: Eraser, label: 'Eraser' },
    { tool: 'text', icon: Type, label: 'Text' },
    { tool: 'shape', icon: Square, label: 'Shapes' },
    { tool: 'zoom', icon: ZoomIn, label: 'Zoom' },
  ];

  return (
    <div className="glass-panel p-2 flex flex-col gap-2">
      {/* Main Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <ToolButton key={tool.tool} {...tool} />
        ))}
      </div>

      <div className="h-px bg-border/50 my-2" />

      {/* AI Tools */}
      {onMagicQuill && (
        <>
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="glow"
                  size="icon"
                  onClick={onMagicQuill}
                  className="relative"
                >
                  <Wand2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>MagicQuill AI</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="h-px bg-border/50 my-2" />
        </>
      )}

      {/* Transform Actions */}
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRotation(rotation + 90)}
            >
              <RotateCw className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Rotate 90°</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={flipH ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setFlipH(!flipH)}
            >
              <FlipHorizontal className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Flip Horizontal</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={flipV ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setFlipV(!flipV)}
            >
              <FlipVertical className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Flip Vertical</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-px bg-border/50 my-2" />

      {/* History Actions */}
      <div className="flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Redo</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-px bg-border/50 my-2" />

      {/* Export */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="accent"
            size="icon"
            onClick={onExport}
          >
            <Download className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Export</TooltipContent>
      </Tooltip>
    </div>
  );
}
