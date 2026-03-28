import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onActivate: () => void;
  isLoading?: boolean;
}

export function AIFeatureCard({
  icon: Icon,
  title,
  description,
  color,
  onActivate,
  isLoading = false,
}: AIFeatureCardProps) {
  return (
    <div className="glass-panel p-6 group hover:border-primary/30 transition-all duration-300">
      <div className={cn(
        'w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4',
        'group-hover:scale-110 transition-transform duration-300',
        color
      )}>
        <Icon className="w-7 h-7" />
      </div>
      
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      
      <Button 
        variant="cosmic" 
        className="w-full"
        onClick={onActivate}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Try It'}
      </Button>
    </div>
  );
}
