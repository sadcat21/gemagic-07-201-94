import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2, Wand2, Download, Database, Save, Copy, Code } from 'lucide-react';
import { useImageProcessing, fileToBase64 } from '@/hooks/use-image-processing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const APIImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<string>('realistic');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { isProcessing, editImage } = useImageProcessing();
  const { toast } = useToast();

  const imageStyles = [
    { value: 'realistic', label: 'واقعية' },
    { value: 'cartoon', label: 'كرتونية' },
    { value: 'anime', label: 'أنمي' },
    { value: 'oil-painting', label: 'رسم زيتي' },
    { value: 'watercolor', label: 'ألوان مائية' },
    { value: 'sketch', label: 'رسم تخطيطي' },
    { value: 'digital-art', label: 'فن رقمي' },
    { value: 'vintage', label: 'كلاسيكي' },
    { value: 'modern', label: 'عصري' },
    { value: 'minimalist', label: 'بسيط' }
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setGeneratedImage(null);
  };

  const handleEditImage = async () => {
    if (!selectedFile || !prompt.trim()) {
      return;
    }

    try {
      // تحويل الملف إلى base64
      const imageBase64 = await fileToBase64(selectedFile);
      
      // استدعاء API
      const result = await editImage(
        imageBase64,
        prompt,
        imageStyle,
        projectTitle || `تحرير صورة - ${new Date().toLocaleString('ar')}`
      );

      if (result.success && result.result?.imageUrl) {
        setGeneratedImage(result.result.imageUrl);
      }

    } catch (error) {
      console.error('Error processing image:', error);
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

  // حفظ الصورة في التخزين
  const saveImageToStorage = async () => {
    if (!generatedImage) return;
    
    setIsSaving(true);
    try {
      // تحويل data URL إلى blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // إنشاء اسم فريد للملف
      const fileName = `edited-image-${Date.now()}.png`;
      
      // رفع الصورة إلى التخزين
      const { data, error } = await supabase.storage
        .from('images') // تأكد من وجود bucket يسمى 'images'
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        // إذا لم يكن bucket موجود، نحاول إنشاءه
        if (error.message.includes('Bucket not found')) {
          toast({
            title: "تنبيه",
            description: "سيتم حفظ الصورة محلياً. لحفظها في التخزين السحابي، يرجى إنشاء bucket للصور",
            variant: "default",
          });
          downloadImage();
          return;
        }
        throw error;
      }

      toast({
        title: "تم الحفظ بنجاح!",
        description: `تم حفظ الصورة في التخزين السحابي: ${fileName}`,
      });

    } catch (error: any) {
      console.error('Error saving image:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "سيتم تحميل الصورة محلياً بدلاً من ذلك",
        variant: "destructive",
      });
      downloadImage();
    } finally {
      setIsSaving(false);
    }
  };

  // إنشاء ونسخ CURL command (بدون تسجيل دخول)
  const copyCurlCommand = async () => {
    try {
      const curlCommand = `curl -X POST 'https://jevzzasfjwrcekqghnic.supabase.co/functions/v1/image-processing' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impldnp6YXNmandyY2VrcWdobmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzkwNDcsImV4cCI6MjA3MjA1NTA0N30.CIJldRfN9RD251QrZZ1HV4F6kWo6jk22YVTC8vVlN-s' \\
  -d '{
    "operationType": "image-editing",
    "images": ["<BASE64_IMAGE_HERE>"],
    "prompt": "غير لون الخلفية إلى أزرق",
    "projectTitle": "تحرير صورة من Postman",
    "imageStyle": "realistic"
  }'

# لرفع صورة من الجهاز، استبدل <BASE64_IMAGE_HERE> بمحتوى الصورة المشفر بـ base64
# يمكنك استخدام هذا الأمر لتحويل الصورة إلى base64:
# base64 -i path/to/your/image.jpg | tr -d '\\n'

# أو استخدم هذا الكود JavaScript في المتصفح:
# const fileInput = document.createElement('input');
# fileInput.type = 'file';
# fileInput.accept = 'image/*';
# fileInput.onchange = (e) => {
#   const file = e.target.files[0];
#   const reader = new FileReader();
#   reader.onload = () => {
#     const base64 = reader.result.split(',')[1];
#     console.log(base64);
#   };
#   reader.readAsDataURL(file);
# };
# fileInput.click();

# ملاحظة: API يعمل الآن بدون تسجيل دخول!`;

      await navigator.clipboard.writeText(curlCommand);
      
      toast({
        title: "تم النسخ!",
        description: "تم نسخ أمر CURL إلى الحافظة. يمكنك استخدامه في Postman",
      });

    } catch (error) {
      console.error('Error copying CURL command:', error);
      toast({
        title: "خطأ في النسخ",
        description: "فشل في نسخ أمر CURL",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-elegant">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Database className="w-5 h-5" />
            تحرير الصور باستخدام API
          </CardTitle>
          <p className="text-sm text-muted-foreground arabic-text">
            يعمل بدون تسجيل دخول - يتم حفظ العمليات مع نظام تدوير المفاتيح
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* زر نسخ CURL */}
          <div className="border-b pb-4">
            <Button
              onClick={copyCurlCommand}
              variant="outline"
              className="w-full bg-gradient-secondary hover:shadow-glow transition-smooth arabic-text"
            >
              <Code className="w-4 h-4 mr-2" />
              نسخ CURL للاستخدام مع Postman
            </Button>
            <p className="text-xs text-muted-foreground mt-2 arabic-text">
              انسخ أمر CURL واستخدمه في Postman - يعمل بدون تسجيل دخول!
            </p>
          </div>

          <div className="space-y-2">
            <Label className="arabic-text">عنوان المشروع (اختياري)</Label>
            <Textarea
              placeholder="اكتب عنوان للمشروع..."
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="min-h-20 arabic-text resize-none"
              dir="rtl"
            />
          </div>

          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          <div className="space-y-2">
            <Label className="arabic-text">نمط الصورة</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger className="arabic-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value} className="arabic-text">
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="arabic-text">وصف التحرير المطلوب</Label>
            <Textarea
              placeholder="اكتب هنا ما تريد تحريره في الصورة... مثل: غير لون الخلفية إلى أزرق، أضف نظارات شمسية للشخص، اجعل الصورة أكثر إشراقاً..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 arabic-text resize-none"
              dir="rtl"
            />
          </div>

          <Button
            onClick={handleEditImage}
            disabled={!selectedFile || !prompt.trim() || isProcessing}
            className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التحرير والحفظ...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                تحرير الصورة مع الحفظ
              </>
            )}
          </Button>

          {generatedImage && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-auto"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={downloadImage}
                  className="bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحميل محلي
                </Button>
                
                <Button
                  onClick={saveImageToStorage}
                  disabled={isSaving}
                  className="bg-gradient-secondary hover:shadow-glow transition-smooth arabic-text"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      حفظ في التخزين
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                onClick={copyCurlCommand}
                variant="outline"
                className="w-full arabic-text"
              >
                <Copy className="w-4 h-4 mr-2" />
                نسخ CURL لهذه العملية
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};