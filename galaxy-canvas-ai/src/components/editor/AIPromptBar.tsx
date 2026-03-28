import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Plus, Wand2, Layers, Sun, ZoomIn, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editorStore';
import { improvePrompt } from '@/lib/api';

interface AIPromptBarProps {
  isExpanded: boolean;
  onPromptSubmit: (prompt: string, mode: AIMode, options?: { scale?: number }) => void;
  onMicClick?: () => void;
  onAddImage?: () => void;
  placeholder?: string;
}

export type AIMode = 'edit' | 'fusion' | 'relight' | 'upscale' | 'magicquill';

export function AIPromptBar({ 
  isExpanded, 
  onPromptSubmit, 
  onMicClick,
  onAddImage,
  placeholder = "Describe changes to your image in natural language"
}: AIPromptBarProps) {
  const { secondImage } = useEditorStore();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<AIMode>('edit');
  const [isFocused, setIsFocused] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [upscaleScale, setUpscaleScale] = useState<number>(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  
  const canAddImage = !secondImage;

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    // For most modes require a prompt, but allow empty prompt for Upscale
    if (!trimmed && mode !== 'upscale') return;

    const options = mode === 'upscale' ? { scale: upscaleScale } : undefined;
    onPromptSubmit(trimmed, mode, options);
    setPrompt('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToolSelect = (newMode: AIMode) => {
    setMode(newMode);
    setShowModeMenu(false);
  };

  const getPlaceholder = () => {
    if (mode === 'magicquill') return 'Brush the area first, then describe what to add';
    if (mode === 'fusion') return 'Describe how to blend the two images together';
    if (mode === 'relight') return 'Describe the lighting you want (e.g., warm sunset)';
    if (mode === 'upscale') return 'Optionally describe style/quality changes while upscaling';
    return placeholder;
  };

  const handleImprove = async () => {
    if (!prompt.trim() || isImproving) return;
    setIsImproving(true);
    try {
      const result = await improvePrompt(prompt);
      if (result.improved && result.improved.trim()) {
        setPrompt(result.improved.trim());
      }
    } catch (error) {
      console.error('Improve prompt error:', error);
    } finally {
      setIsImproving(false);
    }
  };

  // Close the AI options toolbox when clicking outside of it
  useEffect(() => {
    if (!showModeMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!plusMenuRef.current) return;
      if (!plusMenuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModeMenu]);

  return (
    <div 
      className={cn(
        'w-full flex flex-col items-center px-4',
        'transition-all duration-500 ease-out',
        !isExpanded && 'translate-y-32 opacity-0 pointer-events-none'
      )}
    >
      {/* Container with Input and Tools */}
      <div 
        className={cn(
          'w-full max-w-4xl relative',
          'bg-background/95 backdrop-blur-xl',
          'border border-border/50 rounded-[2rem]',
          'shadow-2xl',
          'transition-all duration-300',
          // Increased padding for uniform breathing room
          'p-4',
          isFocused && 'border-primary/40 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
        )}
      >
        {/* Close handled by parent panel for consistent layout */}
        {/* Main Input Bar */}
        <div className="flex items-center gap-3">
          {/* Plus button (Add Image) */}
          <div ref={plusMenuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowModeMenu((open) => !open)}
              title="AI options"
              className={cn(
                'w-10 h-10 rounded-full',
                'flex items-center justify-center',
                'transition-colors duration-200',
                'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Plus menu: add image + modes, opens upwards */}
            {showModeMenu && (
              <div className="absolute bottom-12 left-0 z-20 min-w-[200px] rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-xl p-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!canAddImage || !onAddImage) return;
                    onAddImage();
                    setShowModeMenu(false);
                  }}
                  disabled={!canAddImage}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium mb-1',
                    canAddImage
                      ? 'text-foreground hover:bg-muted/80 transition-colors'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Add image</span>
                  </span>
                  {!canAddImage && <span className="text-[10px]">Already added</span>}
                </button>

                <div className="my-1 h-px bg-border/60" />

                <div className="px-2 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                  AI options
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleToolSelect('edit')}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                      mode === 'edit'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToolSelect('fusion')}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                      mode === 'fusion'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Fusion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToolSelect('relight')}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                      mode === 'relight'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Relight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToolSelect('upscale')}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                      mode === 'upscale'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Upscale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToolSelect('magicquill')}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                      mode === 'magicquill'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>MagicQuill</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input field */}
          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                setIsFocused(true);
                setShowModeMenu(false);
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={getPlaceholder()}
              className={cn(
                'w-full px-2 py-2 bg-transparent',
                'text-base text-foreground placeholder:text-muted-foreground/60',
                'focus:outline-none',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* Improve prompt button */}
          <button
            type="button"
            onClick={handleImprove}
            disabled={isImproving || !prompt.trim()}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs',
              'border border-border/60 bg-card/80 text-foreground/90 hover:border-primary/60 hover:bg-primary/10',
              (isImproving || !prompt.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{isImproving ? 'Improving…' : 'Improve'}</span>
          </button>

          {/* Mic/Send button */}
          <button
            onClick={prompt.trim() || mode === 'upscale' ? handleSubmit : onMicClick}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full',
              'flex items-center justify-center',
              'transition-all duration-200',
              (prompt.trim() || mode === 'upscale')
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
                : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            )}
          >
            {prompt.trim() || mode === 'upscale' ? (
              <Send className="w-5 h-5 ml-0.5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Tools / mode display row */}
        <div className="mt-3 flex items-center gap-2">
          {/* Show selected tool chip to the right if not AI Edit (default) */}
          {mode !== 'edit' && (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full',
                  'text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  'bg-primary/10 text-primary hover:bg-primary/15'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {mode === 'fusion' && (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Fusion</span>
                    </>
                  )}
                  {mode === 'relight' && (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>Relight</span>
                    </>
                  )}
                  {mode === 'upscale' && (
                    <>
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Upscale</span>
                    </>
                  )}
                  {mode === 'magicquill' && (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>MagicQuill</span>
                    </>
                  )}
                </span>
                {/* Close button to revert to AI Edit */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolSelect('edit');
                  }}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span className="text-xs">×</span>
                </button>
              </div>

              {/* Inline upscale factors when Upscale is selected */}
              {mode === 'upscale' && (
                <div className="flex items-center gap-1 overflow-hidden transition-all duration-300">
                  {[2, 4, 8].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUpscaleScale(value)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-medium border',
                        upscaleScale === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 bg-card/60 text-foreground/80 hover:border-primary/60 hover:bg-primary/5'
                      )}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}