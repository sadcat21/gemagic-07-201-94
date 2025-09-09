import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Video, Download, RefreshCw, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VideoRequirementNotice } from './video-requirement-notice';
import { SmartSuggestions } from './smart-suggestions';
import { makeAPICallWithRotation } from '@/lib/api-key-rotation';

export const VideoGenerator: React.FC = () => {
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [operationId, setOperationId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setGeneratedVideo(null);
  };

  const generateVideoFromText = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وصف للفيديو",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('بدء إنشاء فيديو من النص...', { prompt: textPrompt });

      // استخدام نظام تدوير المفاتيح
      const result = await makeAPICallWithRotation(async (apiKey) => {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a video based on this prompt: ${textPrompt}`
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      });

      console.log('API Response:', result);
      
      // For now, show that the API connection works but video generation is still in development
      toast({
        title: "تم الاتصال بـ Vertex AI",
        description: "الاتصال ناجح، ولكن توليد الفيديو الفعلي يتطلب إعداد إضافي في Google Cloud Console",
        variant: "default",
      });

      // Simulate for now until Veo 3 endpoint is properly configured
      await simulateVideoGeneration();

    } catch (error: any) {
      console.error('خطأ في إنشاء الفيديو من النص:', error);
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateVideoGeneration = async () => {
    // محاكاة عملية إنشاء الفيديو للتجربة
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // إنشاء فيديو تجريبي (placeholder)
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // رسم خلفية بسيطة
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // إضافة نص
      ctx.fillStyle = 'white';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('فيديو تجريبي', canvas.width / 2, canvas.height / 2);
      ctx.font = '16px Arial';
      ctx.fillText('يتطلب Google Cloud Platform للعمل الفعلي', canvas.width / 2, canvas.height / 2 + 50);
    }
    
    // تحويل إلى blob وإنشاء URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        // هذا مجرد صورة ثابتة للتوضيح
        console.log('تم إنشاء فيديو تجريبي');
        
        toast({
          title: "فيديو تجريبي",
          description: "هذا مثال توضيحي. للحصول على فيديو حقيقي، يرجى إعداد Google Cloud Platform",
        });
      }
    }, 'image/png');
  };

  const generateVideoFromImage = async () => {
    if (!selectedImage || !textPrompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة وإدخال وصف للفيديو",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (selectedImage.size > maxSize) {
      toast({
        title: "خطأ",
        description: "حجم الصورة كبير جداً. يرجى استخدام صورة أصغر من 4 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('بدء إنشاء فيديو من الصورة...', {
        fileName: selectedImage.name,
        fileSize: selectedImage.size,
        prompt: textPrompt
      });

      // Convert image to base64 for API call
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          // استخدام نظام تدوير المفاتيح مع الصور
          const result = await makeAPICallWithRotation(async (apiKey) => {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      text: `Create a video from this image with the following motion: ${textPrompt}`
                    },
                    {
                      inline_data: {
                        mime_type: selectedImage.type,
                        data: base64String.split(',')[1]
                      }
                    }
                  ]
                }]
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('API Error:', errorText);
              throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
          });

          console.log('API Response:', result);
          
          toast({
            title: "تم الاتصال بـ Vertex AI",
            description: "الاتصال ناجح مع الصورة، ولكن توليد الفيديو يتطلب إعداد Veo 3 في Google Cloud Console",
            variant: "default",
          });

        } catch (apiError) {
          console.error('API Error:', apiError);
        }
        
        // محاكاة عملية التحويل للآن
        await simulateVideoGeneration();
      };
      
      reader.readAsDataURL(selectedImage);

    } catch (error: any) {
      console.error('خطأ في إنشاء الفيديو من الصورة:', error);
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function for future implementation when GCP billing is setup
  const pollOperationStatus = async (operation: any) => {
    // This would be implemented when Google Cloud Platform billing is enabled
    console.log("سيتم تنفيذ تتبع العملية عند إعداد Google Cloud Platform");
  };

  const handleError = (error: any) => {
    let errorMessage = "حدث خطأ أثناء إنشاء الفيديو";
    
    if (error.message?.includes('SERVICE_DISABLED') || error.message?.includes('403')) {
      errorMessage = "يجب تفعيل Generative Language API في Google Cloud Console. يرجى زيارة: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=535337312520";
    } else if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = "مفتاح API غير صحيح";
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = "تم تجاوز حد الاستخدام لـ API";
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج. تأكد من تفعيل الخدمة في Google Cloud Console";
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = "المحتوى لا يتوافق مع سياسات الأمان";
    } else if (error.message) {
      errorMessage = `خطأ: ${error.message}`;
    }

    toast({
      title: "خطأ في الاتصال",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = 'generated-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetGenerator = () => {
    setTextPrompt('');
    setSelectedImage(null);
    setGeneratedVideo(null);
    setOperationId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent arabic-text">
          مولد الفيديو بالذكاء الاصطناعي
        </h2>
        <p className="text-muted-foreground arabic-text">
          أنشئ فيديوهات عالية الجودة من النص أو الصور باستخدام نموذج Veo 3 من Google
        </p>
      </div>

      {/* Requirement Notice */}
      <VideoRequirementNotice />

      <Tabs defaultValue="text-to-video" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-video" className="arabic-text">
            نص إلى فيديو
          </TabsTrigger>
          <TabsTrigger value="image-to-video" className="arabic-text">
            صورة إلى فيديو
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text-to-video" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Text Input */}
            <div className="space-y-6">
              {/* Smart Suggestions */}
              <SmartSuggestions
                title="اقتراحات الفيديو الذكية"
                suggestionsPrompt="قم بإنشاء 5 اقتراحات إبداعية لإنشاء فيديوهات باللغة العربية. كل اقتراح يجب أن يكون وصف قصير لمشهد فيديو (مثل 'طائر يطير في سماء غروب الشمس'، 'قطة تلعب في حديقة مليئة بالورود'، 'موجات البحر تضرب الصخور'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
                onSuggestionClick={(suggestion) => {
                  if (textPrompt.trim()) {
                    setTextPrompt(textPrompt + ' ' + suggestion);
                  } else {
                    setTextPrompt(suggestion);
                  }
                }}
                isEnabled={true}
                context="إنشاء الفيديو"
              />

              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">وصف الفيديو</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="اكتب وصفاً مفصلاً للفيديو المطلوب... مثل: رجل يمشي في شارع مضاء بضوء القمر، يسمع صوت خطوات خلفه..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="min-h-32 arabic-text resize-none"
                    dir="rtl"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={generateVideoFromText}
                      disabled={!textPrompt.trim() || isGenerating}
                      className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          إنشاء فيديو
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetGenerator}
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

            {/* Video Output */}
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">الفيديو المُنشأ</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedVideo ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-auto rounded-lg shadow-elegant"
                          poster=""
                        />
                      </div>
                      <Button
                        onClick={downloadVideo}
                        className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تحميل الفيديو
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-6 rounded-full bg-gradient-primary/10 mb-4">
                        <Video className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 arabic-text">
                        في انتظار إنشاء الفيديو
                      </h3>
                      <p className="text-muted-foreground arabic-text">
                        اكتب وصفاً للفيديو المطلوب لبدء الإنشاء
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="image-to-video" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Image Input */}
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">اختر الصورة</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFileSelect={handleImageSelect}
                    selectedFile={selectedImage}
                  />
                </CardContent>
              </Card>

              {/* Smart Suggestions for Image-to-Video */}
              <SmartSuggestions
                title="اقتراحات الحركة الذكية"
                suggestionsPrompt="قم بإنشاء 5 اقتراحات إبداعية لإضافة الحركة للصور باللغة العربية. كل اقتراح يجب أن يصف نوع الحركة المطلوبة (مثل 'تحريك الأوراق بلطف في النسيم'، 'إضافة حركة تموج للمياه'، 'تحريك الغيوم ببطء'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
                onSuggestionClick={(suggestion) => {
                  if (textPrompt.trim()) {
                    setTextPrompt(textPrompt + ' ' + suggestion);
                  } else {
                    setTextPrompt(suggestion);
                  }
                }}
                isEnabled={!!selectedImage}
                context="إضافة الحركة للصور"
              />

              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">وصف الحركة المطلوبة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="اكتب وصفاً للحركة أو التحريك المطلوب في الفيديو..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="min-h-32 arabic-text resize-none"
                    dir="rtl"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={generateVideoFromImage}
                      disabled={!selectedImage || !textPrompt.trim() || isGenerating}
                      className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          تحريك الصورة
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetGenerator}
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

            {/* Video Output */}
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">الفيديو المُنشأ</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedVideo ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-auto rounded-lg shadow-elegant"
                          poster=""
                        />
                      </div>
                      <Button
                        onClick={downloadVideo}
                        className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تحميل الفيديو
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-6 rounded-full bg-gradient-primary/10 mb-4">
                        <Play className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 arabic-text">
                        في انتظار تحريك الصورة
                      </h3>
                      <p className="text-muted-foreground arabic-text">
                        اختر صورة واكتب وصف الحركة المطلوبة لإنشاء فيديو
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};