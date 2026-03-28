import { useState, useRef } from 'react';
import { ImageCanvas } from '@/components/editor/ImageCanvas';
import { ActionOrb, type ToolType } from '@/components/editor/ActionOrb';
import { AIPromptBar, type AIMode } from '@/components/editor/AIPromptBar';
import { AdjustmentsPanel } from '@/components/editor/AdjustmentsPanel';
import { FiltersPanel } from '@/components/editor/FiltersPanel';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { GeometryPanel } from '@/components/editor/GeometryPanel';
import { DrawPanel } from '@/components/editor/DrawPanel';
import { ExportModal } from '@/components/editor/ExportModal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, Download, Layers } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { editImage, fuseImages, relightImage, upscaleImage, formatBase64Image, stripBase64Prefix } from '@/lib/api';
import { toast } from 'sonner';

const Editor = () => {
  const navigate = useNavigate();
  const { currentImage, secondImage, setSecondImage, removeSecondImage, resetEditor, undo, redo, historyIndex, history, selectedTool, setTool } = useEditorStore();
  const [isOrbExpanded, setIsOrbExpanded] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiProcessingText, setAIProcessingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    if (currentImage) {
      setShowBackConfirm(true);
    } else {
      navigate('/');
    }
  };

  const confirmBack = () => {
    resetEditor();
    navigate('/');
  };

  const handleAddImage = () => {
    if (secondImage) {
      toast.error('Only one additional image allowed');
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (secondImage) {
      toast.error('Second image already loaded');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSecondImage(base64);
        toast.success('Second image added for AI merge');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to load image');
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Hidden file input for adding images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      {/* Cosmic background */}
      <div className="absolute inset-0 star-field opacity-20" />
      <div className="absolute inset-0 nebula-bg opacity-40" />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-nebula-purple/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-star-cyan/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '2s' }} />

      {/* Top bar - minimal */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="glass-panel px-4 h-10 border border-border/30 hover:border-primary/50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back</span>
          </Button>
          {/* Undo/Redo buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="glass-panel w-10 h-10 border border-border/30 hover:border-primary/50"
            title="Undo"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 17C7 17 3 13.5 3 10C3 6.5 7 3 10 3C13 3 17 6.5 17 10C17 13.5 13 17 10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 13V17H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="glass-panel w-10 h-10 border border-border/30 hover:border-primary/50"
            title="Redo"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 3C13 3 17 6.5 17 10C17 13.5 13 17 10 17C7 17 3 13.5 3 10C3 6.5 7 3 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13 7V3H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLayersPanel(true)}
            className="glass-panel w-10 h-10 border border-border/30 hover:border-primary/50"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowExport(true)}
            className="glass-panel w-10 h-10 border border-border/30 hover:border-primary/50"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main canvas area - centered with dynamic bottom padding */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center px-4 pt-24 transition-all duration-500 ease-out",
        // Adjusted padding for the more compact bottom panel
        selectedTool !== 'select' && selectedTool === 'ai' ? "pb-48" : selectedTool !== 'select' ? "pb-52" : "pb-32"
      )}>
        <div className="relative w-full h-full max-w-5xl">
          {secondImage ? (
            // Side-by-side preview for two images
            <div className="flex items-center justify-center h-full gap-6 px-4 py-4">
              <div className="flex-1 flex items-center justify-center h-full max-w-[45%]">
                <div className="relative w-full h-full max-h-[60vh] flex items-center justify-center bg-muted/10 rounded-lg border border-border/30 overflow-hidden">
                  {currentImage && (
                    <img 
                      src={currentImage} 
                      alt="Main image" 
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center h-full max-w-[45%]">
                <div className="relative w-full h-full max-h-[60vh] flex items-center justify-center bg-muted/10 rounded-lg border border-border/30 overflow-hidden">
                  <img 
                    src={secondImage} 
                    alt="Second image" 
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Single image view
            <ImageCanvas onCompare={false} />
          )}
          
          {/* AI Processing Overlay */}
          {isAIProcessing && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 rounded-lg">
              <div className="text-center max-w-md px-8">
                {/* Animated AI Icon with Multiple Layers */}
                <div className="relative mb-6">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-purple-500 border-r-cyan-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                  
                  {/* Middle pulsing ring */}
                  <div className="absolute inset-2 w-16 h-16 mx-auto border-2 border-transparent border-b-purple-400 border-l-cyan-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                  
                  {/* Inner core */}
                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/50">
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" className="animate-ping"/>
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  {/* Floating particles */}
                  <div className="absolute -inset-4">
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute top-1/2 right-0 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-0 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
                
                {/* Processing Text with Gradient */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {aiProcessingText || 'AI is working its magic'}
                  </h3>
                  <p className="text-sm text-muted-foreground/80">
                    Please wait while we transform your image
                  </p>
                  
                  {/* Animated Progress Bar */}
                  <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  
                  {/* Animated Dots */}
                  <div className="flex justify-center space-x-2 mt-4">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Orb (bottom center) - only show when image is loaded and no tool selected */}
      {currentImage && (
        <div className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-out",
          selectedTool !== 'select'
            ? "bottom-0 rotate-180 scale-0 opacity-0 pointer-events-none"
            : "bottom-8 rotate-0 scale-100 opacity-100"
        )}>
          <ActionOrb
            isExpanded={isOrbExpanded}
            onToggle={() => {
              setIsOrbExpanded(!isOrbExpanded);
              if (isOrbExpanded) {
                setTool('select');
                if (secondImage) removeSecondImage();
              }
            }}
            onToolSelect={(tool) => {
              setTool(tool || 'select');
              setIsOrbExpanded(false);
              if (secondImage) removeSecondImage();
            }}
            selectedTool={selectedTool}
          />
        </div>
      )}

      {/* Bottom panels - highly compact */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "glass-panel border-t border-border/50",
        "transform transition-all duration-500 ease-out",
        // Changed to h-auto to fit content tightly instead of fixed height
        "h-auto max-h-[40vh] overflow-visible",
        selectedTool !== 'select' ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="relative w-full">
          {/* Close button - compacted */}
          {selectedTool !== 'select' && (
            <button
              onClick={() => {
                setTool('select');
                if (secondImage) removeSecondImage();
              }}
              className="absolute top-3 right-4 z-20 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 hover:text-foreground transition-colors bg-background/20 backdrop-blur-md px-2 py-1 rounded-md"
            >
              Close
            </button>
          )}

          {/* Tool panels - Reduced padding for compactness */}
          {selectedTool === 'geometry' && (
             <div className="p-4 pt-5 pb-6">
                <GeometryPanel onClose={() => {
                  setTool('select');
                  if (secondImage) removeSecondImage();
                }} />
             </div>
          )}
          
          {selectedTool === 'filters' && (
            <div className="w-full py-4 px-4 flex items-center justify-center">
              <FiltersPanel />
            </div>
          )}
          
          {selectedTool === 'adjustments' && (
            <div className="w-full py-4 px-4 flex items-center justify-center">
              <AdjustmentsPanel />
            </div>
          )}
          
          {selectedTool === 'draw' && (
            <div className="p-4 pt-5 pb-6">
              <DrawPanel onClose={() => {
                setTool('select');
                if (secondImage) removeSecondImage();
              }} />
            </div>
          )}
          
          {selectedTool === 'ai' && (
            <div className="w-full py-3">
              {/* AI Prompt Bar - Integrated SINGLE_EDIT functionality */}
              <AIPromptBar
                isExpanded={true}
                onPromptSubmit={async (prompt, mode: AIMode, options?: { scale?: number }) => {
                  console.log('AI prompt:', prompt, mode);
                  if (!currentImage) {
                    toast.error('Please load an image first');
                    return;
                  }

                  try {
                    const modeTextMap: Record<AIMode, string> = {
                      edit: 'AI edit',
                      fusion: 'Fusion',
                      relight: 'Relight',
                      upscale: 'Upscale',
                      magicquill: 'MagicQuill'
                    };

                    const modeText = modeTextMap[mode] ?? 'AI edit';
                    
                    // Start loading animation
                    setIsAIProcessing(true);
                    setAIProcessingText(`Processing ${modeText.toLowerCase()}...`);
                    
                    // Strip data URL prefix for backend (backend expects raw base64)
                    const imageBase64 = stripBase64Prefix(currentImage);
                    
                    // Validate the base64 string before sending
                    if (!imageBase64 || imageBase64.includes('data:')) {
                      throw new Error('Failed to strip base64 prefix from image data');
                    }
                    
                    console.log('📤 Sending to API:', {
                      originalLength: currentImage.length,
                      strippedLength: imageBase64.length,
                      originalPrefix: currentImage.substring(0, 50) + '...',
                      strippedPrefix: imageBase64.substring(0, 50) + '...',
                      strippedSuffix: imageBase64.substring(imageBase64.length - 20),
                      hasDataPrefix: imageBase64.includes('data:'),
                      isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(imageBase64)
                    });
                    
                    let response;

                    if (mode === 'fusion') {
                      if (!secondImage) {
                        toast.error('Please add a second image for fusion');
                        return;
                      }

                      const targetBase64 = imageBase64;
                      const referenceBase64 = stripBase64Prefix(secondImage);

                      console.log('Fusion target length:', targetBase64.length);
                      console.log('Fusion reference length:', referenceBase64.length);

                      response = await fuseImages({
                        targetImage: targetBase64,
                        referenceImage: referenceBase64,
                        prompt,
                        seed: Math.floor(Math.random() * 1000)
                      });
                    } else if (mode === 'relight') {
                      response = await relightImage({
                        image: imageBase64,
                        prompt,
                        seed: Math.floor(Math.random() * 1000)
                      });
                    } else if (mode === 'upscale') {
                      const trimmedPrompt = prompt.trim();
                      const useDefaultPrompts = !trimmedPrompt;
                      response = await upscaleImage({
                        image: imageBase64,
                        scaleBy: options?.scale ?? 2,
                        positivePrompt: useDefaultPrompts
                          ? 'high quality, detailed, sharp'
                          : trimmedPrompt,
                        negativePrompt: 'blur, low quality, artifacts',
                        seed: Math.floor(Math.random() * 1000)
                      });
                    } else {
                      // Default to single-image edit for edit and magicquill modes
                      response = await editImage({
                        image: imageBase64,
                        prompt,
                        seed: Math.floor(Math.random() * 1000),
                        steps: 4
                      });
                    }

                    if (response && response.success && response.data) {
                      console.log('API Response successful:', {
                        hasImage: !!response.data.image,
                        imageType: typeof response.data.image,
                        imageLength: response.data.image?.length,
                        imagePrefix: response.data.image?.substring(0, 50) + '...'
                      });
                      
                      toast.success(`${modeText} completed successfully!`);
                      
                      // Handle base64 response - ensure proper data URL format
                      const imageData = formatBase64Image(response.data.image);
                      console.log('Formatted image data prefix:', imageData.substring(0, 50) + '...');
                      
                      // Validate image data before setting
                      if (imageData && imageData.startsWith('data:image/')) {
                        useEditorStore.getState().setImage(imageData, `${modeText}: ${prompt}`);
                        if (mode === 'fusion') {
                          useEditorStore.getState().removeSecondImage();
                        }
                      } else {
                        console.error('❌ Invalid image data format:', imageData?.substring(0, 100));
                        toast.error('Invalid image format received from server');
                      }
                    } else {
                      throw new Error(response?.error || `Failed to process ${modeText.toLowerCase()}`);
                    }
                  } catch (error) {
                    console.error('❌ Error in AI processing:', error);
                    
                    // Handle specific backend errors
                    const errorMessage = error instanceof Error ? error.message : 'Failed to process AI request';
                    console.log('🔍 Error details:', {
                      errorType: typeof error,
                      errorMessage,
                      errorString: String(error),
                      hasFileNameError: errorMessage.includes('File name too long'),
                      hasInvalidImageError: errorMessage.includes('Invalid image data')
                    });
                    
                    if (errorMessage.includes('File name too long')) {
                      // This suggests the backend is receiving the full data URL instead of raw base64
                      console.error('💀 CRITICAL: Backend received data URL as filename - check stripBase64Prefix implementation');
                      toast.error('Image processing failed: Invalid data format. Please try a different image.');
                    } else if (errorMessage.includes('Invalid image data')) {
                      toast.error('Invalid image format. Please try uploading a different image.');
                    } else {
                      toast.error(`AI processing failed: ${errorMessage}`);
                    }
                  } finally {
                    // Stop loading animation
                    setIsAIProcessing(false);
                    setAIProcessingText('');
                  }
                }}
                onMicClick={() => {
                  toast.info('Voice input feature coming soon!');
                }}
                onAddImage={handleAddImage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Layers Panel (right edge) */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-80 z-40',
        'transform transition-transform duration-500 ease-out',
        showLayersPanel ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Panel content */}
        <div className="h-full glass-panel border-l border-border/50 p-4 space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg gradient-text">Layers</h3>
            <button
              onClick={() => setShowLayersPanel(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Close
            </button>
          </div>
          <LayersPanel />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              All your edits will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBack}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Editor;