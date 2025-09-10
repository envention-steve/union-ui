'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UpdateCardProps {
  title: string;
  description: string;
  date: string;
  category: string;
  categoryColor: string;
  icon: React.ReactNode;
}

export function UpdateCard({ title, description, date, category, categoryColor, icon }: UpdateCardProps) {
  return (
    <Card className="bg-union-800 border-union-700 hover:bg-union-750 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-union-700 flex-shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-union-300 text-sm">{date}</p>
            </div>
          </div>
        </div>
        <p className="text-union-200 text-sm mb-4">{description}</p>
        <Badge className={`${categoryColor} text-white text-xs`}>
          {category}
        </Badge>
      </CardContent>
    </Card>
  );
}
