import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ImageCanvas } from '@/components/editor/ImageCanvas';
import { AdjustmentsPanel } from '@/components/editor/AdjustmentsPanel';
import { FiltersPanel } from '@/components/editor/FiltersPanel';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { HistoryPanel } from '@/components/editor/HistoryPanel';
import { ExportModal } from '@/components/editor/ExportModal';
import { MagicQuillEditor } from '@/components/editor/MagicQuillEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SplitSquareHorizontal, Menu } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const Editor = () => {
  const [showExport, setShowExport] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [showMobilePanels, setShowMobilePanels] = useState(false);
  const [showMagicQuill, setShowMagicQuill] = useState(false);
  const { currentImage, setTool, setImage } = useEditorStore();

  const handleMagicQuill = () => {
    if (!currentImage) return;
    setShowMagicQuill(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16 flex flex-col md:flex-row">
        {/* Left Toolbar - Hidden on mobile, shown as floating button */}
        <div className="hidden md:block p-3">
          <EditorToolbar 
            onExport={() => setShowExport(true)}
            onMagicQuill={handleMagicQuill}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col p-3 gap-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <h1 className="font-display font-semibold text-lg text-foreground">
              Editor Workspace
            </h1>
            <div className="flex items-center gap-2">
              {currentImage && (
                <Button
                  variant={compareMode ? 'default' : 'cosmic'}
                  size="sm"
                  onClick={() => setCompareMode(!compareMode)}
                >
                  <SplitSquareHorizontal className="w-4 h-4 md:mr-2" />
                  <span className="hidden sm:inline">{compareMode ? 'Exit Compare' : 'Before/After'}</span>
                </Button>
              )}
              {/* Mobile panels toggle */}
              <Sheet open={showMobilePanels} onOpenChange={setShowMobilePanels}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-y-auto">
                  <div className="p-4 space-y-3">
                    <Tabs defaultValue="adjust" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 bg-muted/50">
                        <TabsTrigger value="adjust">Adjust</TabsTrigger>
                        <TabsTrigger value="filters">Filters</TabsTrigger>
                      </TabsList>
                      <TabsContent value="adjust" className="mt-3">
                        <AdjustmentsPanel />
                      </TabsContent>
                      <TabsContent value="filters" className="mt-3">
                        <FiltersPanel />
                      </TabsContent>
                    </Tabs>
                    <LayersPanel />
                    <HistoryPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Canvas */}
          <ImageCanvas onCompare={compareMode} />

          {/* Mobile Toolbar */}
          <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
            <div className="glass-panel p-2 flex gap-2">
              <EditorToolbar 
                onExport={() => setShowExport(true)}
                onMagicQuill={handleMagicQuill}
              />
            </div>
          </div>
        </div>

        {/* Right Panels - Desktop only */}
        <div className="hidden md:block w-80 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50">
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            <TabsContent value="adjust" className="mt-3">
              <AdjustmentsPanel />
            </TabsContent>
            <TabsContent value="filters" className="mt-3">
              <FiltersPanel />
            </TabsContent>
          </Tabs>

          <LayersPanel />
          <HistoryPanel />
        </div>
      </main>

      {/* MagicQuill Editor */}
      {showMagicQuill && currentImage && (
        <div className="fixed inset-0 z-50">
          <MagicQuillEditor
            imageUrl={currentImage}
            onComplete={(editedImage) => {
              setImage(editedImage, 'AI edit applied');
              setShowMagicQuill(false);
            }}
            onCancel={() => setShowMagicQuill(false)}
          />
        </div>
      )}

      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
};

export default Editor;
