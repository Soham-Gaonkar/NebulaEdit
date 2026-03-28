import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Upload, Image, Download, Trash2, FolderOpen, Grid, List } from 'lucide-react';
import { fileToBase64 } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string;
  createdAt: Date;
}

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const base64 = await fileToBase64(file);
      const newAsset: Asset = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        url: base64,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        createdAt: new Date(),
      };
      setAssets(prev => [newAsset, ...prev]);
    }
    toast.success('Files uploaded successfully');
  };

  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAsset === id) setSelectedAsset(null);
    toast.success('Asset deleted');
  };

  const handleDownload = (asset: Asset) => {
    const link = document.createElement('a');
    link.download = asset.name;
    link.href = asset.url;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">
                <span className="gradient-text">Asset Manager</span>
              </h1>
              <p className="text-muted-foreground">
                Manage your uploaded images and saved edits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label>
                <Button variant="glow">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {assets.length === 0 ? (
            <div className="glass-panel p-16 text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">No assets yet</h2>
              <p className="text-muted-foreground mb-6">
                Upload images to start building your asset library
              </p>
              <label>
                <Button variant="cosmic">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Image
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    'glass-panel p-2 cursor-pointer transition-all group',
                    selectedAsset === asset.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedAsset(asset.id)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.size}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel divide-y divide-border/50">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    'flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                    selectedAsset === asset.id && 'bg-primary/10'
                  )}
                  onClick={() => setSelectedAsset(asset.id)}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.size} • {asset.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assets;
