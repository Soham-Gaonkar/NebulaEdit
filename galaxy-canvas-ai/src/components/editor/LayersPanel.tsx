import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, Image, Type, Square, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import type { Layer } from '@/types/editor';

const layerIcons: Record<Layer['type'], React.ElementType> = {
  image: Image,
  text: Type,
  shape: Square,
  drawing: Pencil,
};

export function LayersPanel() {
  const { layers, addLayer, updateLayer, deleteLayer } = useEditorStore();

  const handleAddLayer = (type: Layer['type']) => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substring(2, 9),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${layers.length + 1}`,
      type,
      visible: true,
      locked: false,
      opacity: 100,
      data: null,
    };
    addLayer(newLayer);
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Layers</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleAddLayer('text')}
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleAddLayer('shape')}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleAddLayer('drawing')}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {layers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No layers yet. Add an image or create a new layer.
          </div>
        ) : (
          layers.map((layer, index) => {
            const Icon = layerIcons[layer.type];
            return (
              <div
                key={layer.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg',
                  'bg-muted/50 hover:bg-muted transition-colors',
                  'border border-transparent hover:border-border/50'
                )}
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                
                <span className="flex-1 text-sm text-foreground truncate">
                  {layer.name}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                >
                  {layer.locked ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => deleteLayer(layer.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
