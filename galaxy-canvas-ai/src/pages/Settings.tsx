import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Server, Key, Palette, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [apiSettings, setApiSettings] = useState({
    comfyuiEndpoint: '',
    magicQuillEndpoint: 'https://ai4editing-magicquill.hf.space/api/predict',
    upscaleEndpoint: '',
    relightEndpoint: '',
  });

  const [preferences, setPreferences] = useState({
    autoSave: true,
    showTips: true,
    highQualityPreview: true,
  });

  const handleSaveApi = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('nebula_api_settings', JSON.stringify(apiSettings));
    toast.success('API settings saved');
  };

  const handleSavePreferences = () => {
    localStorage.setItem('nebula_preferences', JSON.stringify(preferences));
    toast.success('Preferences saved');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Configure your API endpoints and application preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* API Configuration */}
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Server className="w-5 h-5 text-primary" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Connect your custom AI endpoints for full functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comfyui">ComfyUI Endpoint</Label>
                  <Input
                    id="comfyui"
                    placeholder="http://localhost:8188/api"
                    value={apiSettings.comfyuiEndpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, comfyuiEndpoint: e.target.value })}
                    className="bg-input border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your ComfyUI server for image editing and generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="magicquill">MagicQuill Endpoint</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="magicquill"
                      placeholder="https://ai4editing-magicquill.hf.space/api/predict"
                      value={apiSettings.magicQuillEndpoint}
                      onChange={(e) => setApiSettings({ ...apiSettings, magicQuillEndpoint: e.target.value })}
                      className="bg-input border-border/50"
                    />
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Text-guided brush editing API (default: Hugging Face Spaces)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upscale">Upscale API Endpoint</Label>
                  <Input
                    id="upscale"
                    placeholder="http://your-api/upscale"
                    value={apiSettings.upscaleEndpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, upscaleEndpoint: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relight">Relighting API Endpoint</Label>
                  <Input
                    id="relight"
                    placeholder="http://your-api/relight"
                    value={apiSettings.relightEndpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, relightEndpoint: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>

                <Button variant="glow" className="w-full mt-4" onClick={handleSaveApi}>
                  <Save className="w-4 h-4 mr-2" />
                  Save API Settings
                </Button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Palette className="w-5 h-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your editing experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Auto-save edits</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically save your work to history
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Show tips & hints</Label>
                    <p className="text-xs text-muted-foreground">
                      Display helpful tooltips while editing
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showTips}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, showTips: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">High-quality preview</Label>
                    <p className="text-xs text-muted-foreground">
                      Use full resolution for canvas preview
                    </p>
                  </div>
                  <Switch
                    checked={preferences.highQualityPreview}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, highQualityPreview: checked })}
                  />
                </div>

                <Button variant="cosmic" className="w-full" onClick={handleSavePreferences}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Key className="w-5 h-5 text-primary" />
                  About NebulaEdit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  NebulaEdit is an AI-powered image editor that combines traditional editing tools 
                  with cutting-edge AI capabilities. Built with React, TypeScript, and Tailwind CSS.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Version 1.0.0 • Dark Galaxy Theme
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
