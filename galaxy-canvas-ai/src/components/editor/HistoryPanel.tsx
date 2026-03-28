import { Clock, RotateCcw } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

export function HistoryPanel() {
  const { history, historyIndex } = useEditorStore();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-display font-semibold text-foreground">History</h3>
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No history yet. Start editing to see your changes here.
          </div>
        ) : (
          history.map((state, index) => (
            <div
              key={state.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'transition-colors cursor-pointer',
                index === historyIndex
                  ? 'bg-primary/20 text-foreground border border-primary/30'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 truncate">{state.action}</span>
              <span className="text-xs opacity-60">{formatTime(state.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
