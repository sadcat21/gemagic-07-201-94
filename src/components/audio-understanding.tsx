import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2, AudioLines, FileAudio, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button as SecretButton } from '@/components/ui/button';

const AudioUnderstanding = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();

  const handleAnalyzeAudio = async () => {
    if (!audioFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صوتي أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "خطأ", 
        description: "يرجى إدخال السؤال أو الطلب",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح Google AI API أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert file to base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioFile);
      });

      // Call Google AI API directly with fetch
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: audioFile.type,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم العثور على نتيجة';

      setResult(result);
      toast({
        title: "تم بنجاح",
        description: "تم تحليل الملف الصوتي",
      });
    } catch (error) {
      console.error('Error analyzing audio:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحليل الملف الصوتي",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-card border-accent shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <AudioLines className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl arabic-text">فهم الصوت بالذكاء الاصطناعي</CardTitle>
          <CardDescription className="arabic-text">
            قم برفع ملف صوتي واحصل على وصف أو ملخص أو نسخة نصية من المحتوى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Input */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold arabic-text">مفتاح Google AI API</h3>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="أدخل مفتاح Google AI API الخاص بك"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-background text-foreground arabic-text"
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground arabic-text">
                احصل على مفتاح API مجاني من: ai.google.dev
              </p>
            </div>
          </div>
          {/* File Upload */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold arabic-text flex items-center gap-2">
              <FileAudio className="w-5 h-5" />
              رفع الملف الصوتي
            </h3>
            <FileUpload
              onFileSelect={setAudioFile}
              selectedFile={audioFile}
              className="w-full"
              accept="audio"
            />
          </div>

          {/* Quick Prompts */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold arabic-text">طلبات سريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('قم بتحويل هذا الملف الصوتي إلى نص مكتوب')}
              >
                تحويل إلى نص
              </Button>
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('قم بتلخيص محتوى هذا الملف الصوتي')}
              >
                تلخيص المحتوى
              </Button>
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('صف محتوى هذا الملف الصوتي بالتفصيل')}
              >
                وصف مفصل
              </Button>
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('ما هي النقاط الرئيسية في هذا الصوت؟')}
              >
                النقاط الرئيسية
              </Button>
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('ما هو نوع الموسيقى أو الأصوات في هذا الملف؟')}
              >
                تحليل الأصوات
              </Button>
              <Button
                variant="outline"
                className="arabic-text text-sm h-auto py-3 px-4"
                onClick={() => handleQuickPrompt('هل يمكنك استخراج الأرقام أو التواريخ المذكورة؟')}
              >
                استخراج البيانات
              </Button>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold arabic-text">طلب مخصص</h3>
            <Textarea
              placeholder="اكتب سؤالك أو طلبك حول الملف الصوتي... (مثال: قم بتحويل الجزء من 1:30 إلى 2:45 إلى نص)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] arabic-text"
              dir="rtl"
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyzeAudio}
            disabled={isLoading || !audioFile || !prompt.trim() || !apiKey.trim()}
            className="w-full arabic-text py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جارٍ التحليل...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 ml-2" />
                تحليل الملف الصوتي
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold arabic-text">النتيجة</h3>
              <Card className="bg-gradient-subtle border-accent">
                <CardContent className="p-6">
                  <div className="whitespace-pre-wrap arabic-text leading-relaxed" dir="rtl">
                    {result}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Supported Formats */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-4">
              <h4 className="font-semibold arabic-text mb-2">الصيغ المدعومة:</h4>
              <p className="text-sm text-muted-foreground arabic-text">
                WAV, MP3, AIFF, AAC, OGG Vorbis, FLAC
              </p>
              <p className="text-xs text-muted-foreground arabic-text mt-2">
                الحد الأقصى لطول الملف الصوتي: 9.5 ساعات | الحد الأقصى لحجم الطلب: 20 ميجابايت
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioUnderstanding;