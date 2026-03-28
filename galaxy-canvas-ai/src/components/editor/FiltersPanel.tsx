import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const filters = [
  { name: 'Original', adjustments: {} },
  { name: 'Vivid', adjustments: { saturation: 20, contrast: 10 } },
  { name: 'Dramatic', adjustments: { contrast: 30, shadows: -20, highlights: 20 } },
  { name: 'Mono', adjustments: { saturation: -100 } },
  { name: 'Warm', adjustments: { temperature: 20, saturation: 10 } },
  { name: 'Cool', adjustments: { temperature: -20, saturation: 10 } },
  { name: 'Bright', adjustments: { brightness: 20, exposure: 10 } },
  { name: 'Fade', adjustments: { contrast: -15, brightness: 10 } },
];

export function FiltersPanel() {
  const { applyFilter, currentImage } = useEditorStore();

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {/* Add new filter button */}
        <button className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center border-2 border-white/20">
          <Plus className="w-8 h-8 text-white" />
        </button>

        {/* Filter thumbnails */}
        {filters.map((filter, index) => (
          <div key={filter.name} className="flex flex-col items-center gap-2">
            <button
              onClick={() => applyFilter(filter.adjustments)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all",
                index === 0 ? "border-white" : "border-white/20 hover:border-white/50"
              )}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{
                    filter: Object.entries(filter.adjustments)
                      .map(([key, value]) => {
                        if (key === 'brightness') return `brightness(${100 + value}%)`;
                        if (key === 'contrast') return `contrast(${100 + value}%)`;
                        if (key === 'saturation') return `saturate(${100 + value}%)`;
                        return '';
                      })
                      .join(' ')
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
              )}
            </button>
            <span className="text-xs text-muted-foreground">{filter.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
