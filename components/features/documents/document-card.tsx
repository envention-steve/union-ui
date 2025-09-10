'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  description: string;
  fileSize: string;
  icon: React.ReactNode;
  iconColor: string;
}

export function DocumentCard({ title, description, fileSize, icon, iconColor }: DocumentCardProps) {
  return (
    <Card className="bg-union-800 border-union-700 hover:bg-union-750 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${iconColor} flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <p className="text-union-200 text-sm mb-1">{description}</p>
            <p className="text-union-300 text-xs">{fileSize}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button 
            className="w-full bg-union-600 hover:bg-union-500 text-white"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
