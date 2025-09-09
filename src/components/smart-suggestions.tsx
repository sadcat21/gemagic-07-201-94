import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { makeAPICallWithRotation } from '@/lib/api-key-rotation';

interface SmartSuggestionsProps {
  title?: string;
  suggestionsPrompt: string;
  onSuggestionClick: (suggestion: string) => void;
  isEnabled?: boolean;
  context?: string;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  title = "اقتراحات الدمج الذكية",
  suggestionsPrompt,
  onSuggestionClick,
  isEnabled = true,
  context = "عام"
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const { toast } = useToast();

  const getSuggestions = async () => {
    if (!isEnabled) {
      toast({
        title: "خطأ",
        description: "يرجى استيفاء المتطلبات المطلوبة أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsGettingSuggestions(true);
    
    try {
      console.log('بدء الحصول على الاقتراحات الذكية...');

      // استخدام نظام تدوير المفاتيح
      const data = await makeAPICallWithRotation(async (apiKey) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: suggestionsPrompt
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      });
      const suggestionsText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (suggestionsText) {
        const suggestionsList = suggestionsText.split('\n').filter(s => s.trim()).slice(0, 5);
        setSuggestions(suggestionsList);
        console.log('تم الحصول على الاقتراحات:', suggestionsList);
        
        toast({
          title: "تم الحصول على الاقتراحات!",
          description: `تم إنشاء ${suggestionsList.length} اقتراح ذكي جديد`,
        });
      }

    } catch (error) {
      console.error('خطأ في الحصول على الاقتراحات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحصول على الاقتراحات الذكية",
        variant: "destructive",
      });
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  return (
    <Card className="bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-text">
          <Lightbulb className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={getSuggestions}
          disabled={!isEnabled || isGettingSuggestions}
          variant="outline"
          className="w-full arabic-text"
        >
          {isGettingSuggestions ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الحصول على اقتراحات جديدة...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              احصل على اقتراحات ذكية جديدة
            </>
          )}
        </Button>
        
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground arabic-text">
              انقر على أي اقتراح لإضافته:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth arabic-text p-2 text-xs border border-border/20 hover:border-primary/50"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <Plus className="w-3 h-3 ml-1" />
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};