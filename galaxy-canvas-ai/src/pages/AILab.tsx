import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { PromptEditForm } from '@/components/ai/PromptEditForm';
import { ImageFusionForm } from '@/components/ai/ImageFusionForm';
import { RelightingForm } from '@/components/ai/RelightingForm';
import { UpscaleForm } from '@/components/ai/UpscaleForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Layers, Sun, ZoomIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { editImage, fuseImages, relightImage, upscaleImage, formatBase64Image } from '@/lib/api';

const AILab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Real API handlers
  const setFormattedResult = (image?: string | null) => {
    if (!image) {
      throw new Error('No image data returned from workflow');
    }

    const formatted = formatBase64Image(image);
    if (!formatted) {
      throw new Error('Invalid image data received');
    }

    setResult(formatted);
  };

  const handlePromptEdit = async (image: string, prompt: string) => {
    setIsLoading(true);
    try {
      toast.info('Processing edit...');
      const response = await editImage({
        image,
        prompt,
        seed: Math.floor(Math.random() * 1000), // Random seed for now
        steps: 4
      });

      if (response.success && response.data) {
        toast.success('Edit complete!');
        setFormattedResult(response.data.image);
      } else {
        throw new Error(response.error || 'Failed to process edit');
      }
    } catch (error) {
      console.error('❌ Error in handlePromptEdit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process edit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFusion = async (images: string[], prompt: string) => {
    if (images.length !== 2) {
      toast.error('Need exactly 2 images for fusion');
      return;
    }

    setIsLoading(true);
    try {
      toast.info('Fusing images...');
      const response = await fuseImages({
        targetImage: images[0],
        referenceImage: images[1],
        prompt,
        seed: Math.floor(Math.random() * 1000)
      });

      if (response.success && response.data) {
        toast.success('Fusion complete!');
        setFormattedResult(response.data.image);
      } else {
        throw new Error(response.error || 'Failed to fuse images');
      }
    } catch (error) {
      console.error('❌ Error in handleImageFusion:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fuse images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelight = async (image: string, params: { direction: number; intensity: number; color: string }) => {
    setIsLoading(true);
    try {
      toast.info('Applying lighting...');
      // Convert params to a descriptive prompt for the AI
      const lightingPrompt = `lighting from direction ${params.direction} degrees, intensity ${params.intensity}, color ${params.color}`;

      const response = await relightImage({
        image,
        prompt: lightingPrompt,
        seed: Math.floor(Math.random() * 1000)
      });

      if (response.success && response.data) {
        toast.success('Relighting complete!');
        setFormattedResult(response.data.image);
      } else {
        throw new Error(response.error || 'Failed to apply lighting');
      }
    } catch (error) {
      console.error('❌ Error in handleRelight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply lighting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async (image: string, scale: number) => {
    setIsLoading(true);
    try {
      toast.info(`Upscaling ${scale}x...`);
      const response = await upscaleImage({
        image,
        scaleBy: scale,
        positivePrompt: "high quality, detailed, sharp",
        negativePrompt: "blur, low quality, artifacts",
        seed: Math.floor(Math.random() * 1000)
      });

      if (response.success && response.data) {
        toast.success('Upscaling complete!');
        setFormattedResult(response.data.image);
      } else {
        throw new Error(response.error || 'Failed to upscale');
      }
    } catch (error) {
      console.error('❌ Error in handleUpscale:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upscale');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 mb-4">
              <Sparkles className="w-4 h-4 text-star-cyan" />
              <span className="text-sm text-muted-foreground">AI-Powered Features</span>
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">
              <span className="gradient-text">AI Lab</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore cutting-edge AI features to transform your images. Each tool is powered by
              advanced models for professional-quality results.
            </p>
          </div>

          {/* AI Tools */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Tool Selection */}
            <div>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="w-full grid grid-cols-4 bg-muted/50 mb-4">
                  <TabsTrigger value="edit" className="flex items-center gap-1">
                    <Wand2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </TabsTrigger>
                  <TabsTrigger value="fusion" className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Fusion</span>
                  </TabsTrigger>
                  <TabsTrigger value="relight" className="flex items-center gap-1">
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline">Relight</span>
                  </TabsTrigger>
                  <TabsTrigger value="upscale" className="flex items-center gap-1">
                    <ZoomIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Upscale</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit">
                  <PromptEditForm onSubmit={handlePromptEdit} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="fusion">
                  <ImageFusionForm onSubmit={handleImageFusion} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="relight">
                  <RelightingForm onSubmit={handleRelight} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="upscale">
                  <UpscaleForm onSubmit={handleUpscale} isLoading={isLoading} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Result Preview */}
            <div className="glass-panel p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Result Preview</h3>
              {result ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={result} alt="Result" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Your AI-generated result will appear here</p>
                  </div>
                </div>
              )}

              {/* API Status Info */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="text-sm font-medium text-foreground mb-2">API Integration</h4>
                <p className="text-xs text-muted-foreground">
                  Connect your ComfyUI endpoints and MagicQuill API in the Settings page to enable
                  full AI functionality. Currently running in demo mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AILab;
