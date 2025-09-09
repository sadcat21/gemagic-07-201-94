import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Combine, Download, RefreshCw, Languages, Lightbulb, Plus, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI, Modality } from '@google/genai';
import { SmartSuggestions } from './smart-suggestions';

export const ImageMerger: React.FC = () => {
  const [firstImage, setFirstImage] = useState<File | null>(null);
  const [secondImage, setSecondImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
  const { toast } = useToast();

  // وظيفة ترجمة النص إلى الإنجليزية
  const translatePrompt = async (arabicPrompt: string): Promise<string> => {
    try {
      setIsTranslating(true);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following Arabic text to English for image merging purposes. Only return the English translation without any additional text or explanation: "${arabicPrompt}"`
            }]
          }]
        })
      });

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || arabicPrompt;
      
      console.log('ترجمة النص:', { original: arabicPrompt, translated: translatedText });
      return translatedText;
    } catch (error) {
      console.error('خطأ في ترجمة النص:', error);
      return arabicPrompt;
    } finally {
      setIsTranslating(false);
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

  // وظيفة الحصول على اقتراحات الدمج من Gemini
  const getSuggestions = async () => {
    if (!firstImage || !secondImage) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورتين للحصول على الاقتراحات",
        variant: "destructive",
      });
      return;
    }

    setIsGettingSuggestions(true);
    
    try {
      console.log('بدء الحصول على اقتراحات الدمج...');

      // تحويل الصورتين إلى base64
      const [firstImageBase64, secondImageBase64] = await Promise.all([
        fileToBase64(firstImage),
        fileToBase64(secondImage)
      ]);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze these two images and provide 5 creative merging suggestions in Arabic. Each suggestion should be a short phrase describing how to combine the images (like 'place the person from first image in the background of second image', 'blend both images to create a surreal scene', etc.). Return only the suggestions, one per line, without numbers or additional text."
              },
              {
                inlineData: {
                  mimeType: firstImage.type,
                  data: firstImageBase64,
                },
              },
              {
                inlineData: {
                  mimeType: secondImage.type,
                  data: secondImageBase64,
                },
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const suggestionsText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (suggestionsText) {
        const suggestionsList = suggestionsText.split('\n').filter(s => s.trim()).slice(0, 5);
        setSuggestions(suggestionsList);
        console.log('تم الحصول على الاقتراحات:', suggestionsList);
        
        toast({
          title: "تم الحصول على الاقتراحات!",
          description: "اختر أحد الاقتراحات أو اكتب وصفك الخاص",
        });
      }

    } catch (error) {
      console.error('خطأ في الحصول على الاقتراحات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحصول على الاقتراحات",
        variant: "destructive",
      });
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  // وظيفة إضافة الاقتراح إلى حقل النص
  const addSuggestionToPrompt = (suggestion: string) => {
    if (prompt.trim()) {
      setPrompt(prompt + ' ' + suggestion);
    } else {
      setPrompt(suggestion);
    }
  };

  // وظيفة إضافة prompt احترافي لدمج اللوغو
  const addLogoMergePrompt = () => {
    const logoPrompt = "قم بدمج اللوغو من الصورة الثانية مع الصورة الأولى بطريقة احترافية وإبداعية. يجب المحافظة التامة على جودة ووضوح اللوغو مع عدم تغيير أي نص أو عنصر فيه. ضع اللوغو في موقع استراتيجي مناسب دون حجب أو إخفاء العناصر المهمة في الصورة الأساسية. تأكد من التكامل المثالي بين الصورتين مع إضافة تأثيرات بصرية لجعل اللوغو يبدو جزءاً طبيعياً من التصميم. ممنوع كتابة أي نص إضافي على الصورة";
    
    if (prompt.trim()) {
      setPrompt(prompt + " " + logoPrompt);
    } else {
      setPrompt(logoPrompt);
    }
    
    toast({
      title: "تم إضافة نص احترافي محسن!",
      description: "تم إضافة وصف احترافي متقدم لدمج اللوغو مع ضمانات أقوى للجودة",
    });
  };

  const mergeImages = async () => {
    if (!firstImage || !secondImage || !prompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورتين وإدخال وصف الدمج",
        variant: "destructive",
      });
      return;
    }

    // Check file sizes (max 4MB each)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (firstImage.size > maxSize || secondImage.size > maxSize) {
      toast({
        title: "خطأ",
        description: "حجم إحدى الصور كبير جداً. يرجى استخدام صور أصغر من 4 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // ترجمة النص إلى الإنجليزية أولاً
      const translatedPrompt = await translatePrompt(prompt);
      
      console.log('بدء عملية دمج الصور...', {
        firstImage: firstImage.name,
        secondImage: secondImage.name,
        originalPrompt: prompt,
        translatedPrompt: translatedPrompt
      });

      const ai = new GoogleGenAI({
        apiKey: apiKey
      });

      // تحويل الصورتين إلى base64
      const [firstImageBase64, secondImageBase64] = await Promise.all([
        fileToBase64(firstImage),
        fileToBase64(secondImage)
      ]);

      console.log('تم تحويل الصورتين إلى base64 بنجاح');

      // إعداد المحتوى للدمج
      const contents = [
        { text: `IMPORTANT: Do not write any text or explanations on the generated image. Simply perform the requested image merging task. Merge these two images based on the following description: ${translatedPrompt}. Create a seamless, professional blend or composition of both images. Focus on visual integration without adding any textual descriptions to the final image.` },
        {
          inlineData: {
            mimeType: firstImage.type,
            data: firstImageBase64,
          },
        },
        {
          inlineData: {
            mimeType: secondImage.type,
            data: secondImageBase64,
          },
        },
      ];

      console.log('إرسال الطلب إلى Gemini API للدمج...');
      console.log('تفاصيل الطلب:', {
        model: "gemini-2.0-flash-preview-image-generation",
        contentsLength: contents.length,
        firstImageType: firstImage.type,
        secondImageType: secondImage.type
      });

      // استخدام نموذج توليد الصور مع التكوين المناسب
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      console.log('تم استلام الرد من Gemini API');
      console.log('تفاصيل الرد:', {
        candidatesLength: response.candidates?.length,
        partsLength: response.candidates?.[0]?.content?.parts?.length
      });

      // معالجة الاستجابة لاستخراج الصورة
      let imageGenerated = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // جزء الصورة - تحويل base64 إلى blob URL
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
          imageGenerated = true;
          
          toast({
            title: "نجح الدمج!",
            description: "تم دمج الصورتين بنجاح باستخدام Gemini AI",
          });
          
          console.log('تم دمج الصور بنجاح');
        } else if (part.text) {
          console.log('نص الرد:', part.text);
        }
      }

      if (!imageGenerated) {
        toast({
          title: "تنبيه",
          description: "لم يتم إنشاء صورة مدموجة. يرجى تجربة وصف مختلف للدمج",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('خطأ في دمج الصور:', error);
      
      let errorMessage = "حدث خطأ أثناء دمج الصور";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = "مفتاح API غير صحيح. يرجى التحقق من المفتاح";
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = "تم تجاوز حد الاستخدام لـ API";
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج";
      } else if (error.message?.includes('SAFETY')) {
        errorMessage = "المحتوى لا يتوافق مع سياسات الأمان";
      } else if (error.message) {
        errorMessage = `خطأ: ${error.message}`;
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
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

  const resetMerger = () => {
    setFirstImage(null);
    setSecondImage(null);
    setPrompt('');
    setMergedImage(null);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      {/* Translation Status */}
      <Card className="bg-gradient-card shadow-elegant">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground arabic-text">
            <Languages className="w-4 h-4" />
            سيتم ترجمة أوامر الدمج العربية تلقائياً إلى الإنجليزية لضمان أفضل النتائج
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Input */}
        <div className="space-y-6">
          {/* First Image Upload */}
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text">الصورة الأولى</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={setFirstImage}
                selectedFile={firstImage}
              />
            </CardContent>
          </Card>

          {/* Second Image Upload */}
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text">الصورة الثانية</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={setSecondImage}
                selectedFile={secondImage}
              />
            </CardContent>
          </Card>

          {/* Smart Suggestions using shared component */}
          <SmartSuggestions
            title="اقتراحات الدمج الذكية"
            suggestionsPrompt={firstImage && secondImage 
              ? "قم بتحليل هاتين الصورتين وأعط 5 اقتراحات إبداعية لدمجهما باللغة العربية. كل اقتراح يجب أن يكون عبارة قصيرة تصف كيفية دمج الصورتين (مثل 'ادمج الشخص من الصورة الأولى مع خلفية الصورة الثانية'، 'امزج الصورتين لتكوين مشهد سريالي'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
              : "قم بإنشاء 5 اقتراحات إبداعية لدمج الصور باللغة العربية. كل اقتراح يجب أن يكون عبارة قصيرة تصف كيفية دمج صورتين (مثل 'ادمج الصورتين في مشهد واحد'، 'ضع الشخص من الصورة الأولى في خلفية الصورة الثانية'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
            }
            onSuggestionClick={addSuggestionToPrompt}
            isEnabled={!!firstImage && !!secondImage}
            context="دمج الصور"
          />

          {/* Merge Prompt Input */}
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text">وصف طريقة الدمج</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب هنا كيف تريد دمج الصورتين... مثل: ادمج الصورتين في مشهد واحد، ضع الشخص من الصورة الأولى في خلفية الصورة الثانية، اجعل وجه الشخص من الصورة الأولى يحل محل وجه الشخص في الصورة الثانية..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 arabic-text resize-none"
                dir="rtl"
              />
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={addLogoMergePrompt}
                  variant="secondary"
                  size="sm"
                  className="arabic-text flex-1"
                >
                  <FileImage className="w-4 h-4 mr-1" />
                  دمج لوغو احترافي
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={mergeImages}
                  disabled={!firstImage || !secondImage || !prompt.trim() || isGenerating || isTranslating}
                  className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الترجمة...
                    </>
                  ) : isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الدمج...
                    </>
                  ) : (
                    <>
                      <Combine className="w-4 h-4 mr-2" />
                      ادمج الصورتين
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetMerger}
                  variant="outline"
                  className="arabic-text"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Output */}
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text">الصورة المدموجة</CardTitle>
            </CardHeader>
            <CardContent>
              {mergedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={mergedImage}
                      alt="الصورة المدموجة"
                      className="w-full h-auto rounded-lg shadow-elegant animate-float"
                    />
                  </div>
                  <Button
                    onClick={downloadImage}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تحميل الصورة المدموجة
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-6 rounded-full bg-gradient-primary/10 mb-4">
                    <Combine className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 arabic-text">
                    في انتظار الدمج
                  </h3>
                  <p className="text-muted-foreground arabic-text">
                    اختر صورتين واكتب وصف طريقة الدمج لبدء عملية الدمج بالذكاء الاصطناعي
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};