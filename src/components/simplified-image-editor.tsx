import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Download, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI, Modality } from '@google/genai';

// مكون تحرير الصور المبسط
const SimpleImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
  const { toast } = useToast();

  // ترجمة النص
  const translatePrompt = async (arabicPrompt: string): Promise<string> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate to English: "${arabicPrompt}"`
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || arabicPrompt;
    } catch (error) {
      return arabicPrompt;
    }
  };

  // تحرير الصورة
  const generateImage = async () => {
    if (!selectedFile || !prompt.trim()) {
      toast({ title: "خطأ", description: "يرجى اختيار صورة وإدخال النص", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const translatedPrompt = await translatePrompt(prompt);
      const ai = new GoogleGenAI({ apiKey });

      // تحويل الصورة إلى base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const contents = [
        { text: `Edit this image: ${translatedPrompt}` },
        {
          inlineData: {
            mimeType: selectedFile.type,
            data: base64String,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });

      // استخراج الصورة
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const byteCharacters = atob(imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const imageUrl = URL.createObjectURL(blob);
          
          setGeneratedImage(imageUrl);
          toast({ title: "نجح التحرير!", description: "تم تحرير الصورة بنجاح" });
          break;
        }
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التحرير", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>رفع الصورة</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>وصف التحرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب هنا كيف تريد تحرير الصورة..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-20"
            dir="rtl"
          />
          <Button onClick={generateImage} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التحرير...
              </>
            ) : (
              'تحرير الصورة'
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>الصورة المحررة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img src={generatedImage} alt="Generated" className="w-full rounded-lg" />
            <Button onClick={downloadImage} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              تحميل الصورة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// مكون دمج الصور المبسط
const SimpleImageMerger: React.FC = () => {
  const [firstImage, setFirstImage] = useState<File | null>(null);
  const [secondImage, setSecondImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
  const { toast } = useToast();

  // ترجمة النص
  const translatePrompt = async (arabicPrompt: string): Promise<string> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate to English: "${arabicPrompt}"`
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || arabicPrompt;
    } catch (error) {
      return arabicPrompt;
    }
  };

  // تحويل الملف إلى base64
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // دمج الصور
  const mergeImages = async () => {
    if (!firstImage || !secondImage || !prompt.trim()) {
      toast({ title: "خطأ", description: "يرجى اختيار صورتين وإدخال وصف الدمج", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const translatedPrompt = await translatePrompt(prompt);
      const ai = new GoogleGenAI({ apiKey });

      const [firstImageBase64, secondImageBase64] = await Promise.all([
        fileToBase64(firstImage),
        fileToBase64(secondImage)
      ]);

      const contents = [
        { text: `Merge these images: ${translatedPrompt}` },
        { inlineData: { mimeType: firstImage.type, data: firstImageBase64 } },
        { inlineData: { mimeType: secondImage.type, data: secondImageBase64 } },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });

      // استخراج الصورة
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const byteCharacters = atob(imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const imageUrl = URL.createObjectURL(blob);
          
          setMergedImage(imageUrl);
          toast({ title: "نجح الدمج!", description: "تم دمج الصورتين بنجاح" });
          break;
        }
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الدمج", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!mergedImage) return;
    const link = document.createElement('a');
    link.href = mergedImage;
    link.download = 'merged-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الصورة الأولى</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={setFirstImage} selectedFile={firstImage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الصورة الثانية</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={setSecondImage} selectedFile={secondImage} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>وصف الدمج</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب هنا كيف تريد دمج الصورتين..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-20"
            dir="rtl"
          />
          <Button onClick={mergeImages} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الدمج...
              </>
            ) : (
              'دمج الصور'
            )}
          </Button>
        </CardContent>
      </Card>

      {mergedImage && (
        <Card>
          <CardHeader>
            <CardTitle>الصورة المدموجة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img src={mergedImage} alt="Merged" className="w-full rounded-lg" />
            <Button onClick={downloadImage} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              تحميل الصورة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// المكون الرئيسي المبسط
export const SimplifiedImageEditor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Languages className="w-4 h-4" />
          سيتم ترجمة النصوص العربية تلقائياً لضمان أفضل النتائج
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">تحرير الصور</TabsTrigger>
          <TabsTrigger value="merger">دمج الصور</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <SimpleImageEditor />
        </TabsContent>
        
        <TabsContent value="merger" className="space-y-6">
          <SimpleImageMerger />
        </TabsContent>
      </Tabs>
    </div>
  );
};