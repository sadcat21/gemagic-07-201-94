-- دالة لحفظ كود محرر الصور العامل
CREATE OR REPLACE FUNCTION public.get_working_image_editor_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN '
import React, { useState, useRef, useEffect } from ''react'';
import { FileUpload } from ''./ui/file-upload'';
import { Button } from ''./ui/button'';
import { Textarea } from ''./ui/textarea'';
import { Card, CardContent, CardHeader, CardTitle } from ''./ui/card'';
import { Tabs, TabsContent, TabsList, TabsTrigger } from ''./ui/tabs'';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from ''./ui/select'';
import { Label } from ''./ui/label'';
import { Loader2, Wand2, Download, RefreshCw, Languages, Search, Type, Plus, Palette, Eye, Target, Scissors, Grid3X3, Copy, Square, Edit, Check, X } from ''lucide-react'';
import { useToast } from ''@/hooks/use-toast'';
import { GoogleGenAI, Modality } from ''@google/genai'';
import { BackgroundRemover } from ''./background-remover'';
import { ImageMerger } from ''./image-merger'';
import { FurnitureEditor } from ''./furniture-editor'';
import { VideoGenerator } from ''./video-generator'';
import { SmartSuggestions } from ''./smart-suggestions'';
import { SpeechGenerator } from ''./speech-generator'';

export const ImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('''');
  const [textToWrite, setTextToWrite] = useState('''');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedElements, setDetectedElements] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>('''');
  const [showElementInput, setShowElementInput] = useState(false);
  const [elementModification, setElementModification] = useState('''');
  const [imageStyle, setImageStyle] = useState<string>(''realistic'');
  const [objectDetections, setObjectDetections] = useState<any[]>([]);
  const [segmentationMasks, setSegmentationMasks] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hoveredObject, setHoveredObject] = useState<number | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);
  const [analysisType, setAnalysisType] = useState<string>(''object-detection'');
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [tempModification, setTempModification] = useState('''');
  const [selectedForEdit, setSelectedForEdit] = useState<Set<string>>(new Set());
  // استخدم مفتاح API ثابت
  const apiKey = ''AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4'';
  const { toast } = useToast();

  const imageStyles = [
    { value: ''realistic'', label: ''واقعية'' },
    { value: ''cartoon'', label: ''كرتونية'' },
    { value: ''anime'', label: ''أنمي'' },
    { value: ''oil-painting'', label: ''رسم زيتي'' },
    { value: ''watercolor'', label: ''ألوان مائية'' },
    { value: ''sketch'', label: ''رسم تخطيطي'' },
    { value: ''digital-art'', label: ''فن رقمي'' },
    { value: ''vintage'', label: ''كلاسيكي'' },
    { value: ''modern'', label: ''عصري'' },
    { value: ''minimalist'', label: ''بسيط'' }
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setGeneratedImage(null);
    
    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
    
    // إعادة تعيين النتائج
    setObjectDetections([]);
    setSegmentationMasks([]);
    setSelectedObjects([]);
    setHoveredObject(null);
  };

  // وظيفة ترجمة النص إلى الإنجليزية
  const translatePrompt = async (arabicPrompt: string): Promise<string> => {
    try {
      setIsTranslating(true);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: ''POST'',
        headers: {
          ''Content-Type'': ''application/json'',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following Arabic text to English for image editing purposes. Only return the English translation without any additional text or explanation: "${arabicPrompt}"`
            }]
          }]
        })
      });

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || arabicPrompt;
      
      console.log(''ترجمة النص:'', { original: arabicPrompt, translated: translatedText });
      return translatedText;
    } catch (error) {
      console.error(''خطأ في ترجمة النص:'', error);
      // في حالة فشل الترجمة، استخدم النص الأصلي
      return arabicPrompt;
    } finally {
      setIsTranslating(false);
    }
  };

  const generateImage = async () => {
    if (!selectedFile || !prompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة وإدخال النص",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "خطأ",
        description: "حجم الصورة كبير جداً. يرجى استخدام صورة أصغر من 4 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // ترجمة النص إلى الإنجليزية أولاً
      const translatedPrompt = await translatePrompt(prompt);
      
      console.log(''بدء عملية تحرير الصورة...'', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        originalPrompt: prompt,
        translatedPrompt: translatedPrompt
      });

      const ai = new GoogleGenAI({
        apiKey: apiKey
      });

      // Convert file to base64 using FileReader (more efficient for large files)
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (data:image/png;base64,)
          const base64 = result.split('','')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log(''تم تحويل الصورة إلى base64 بنجاح'');

      // إضافة معلومات النمط المختار للبرومت
      const styleText = getStyleText(imageStyle);
      const enhancedPrompt = `${translatedPrompt}. ${styleText}`;

      // Prepare the content parts with translated prompt
      const contents = [
        { text: `Edit this image based on the following description: ${enhancedPrompt}` },
        {
          inlineData: {
            mimeType: selectedFile.type,
            data: base64String,
          },
        },
      ];

      console.log(''إرسال الطلب إلى Gemini API...'');

      // Use the new image generation model with proper configuration
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      console.log(''تم استلام الرد من Gemini API'');

      // Process the response to extract both text and image
      let imageGenerated = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Image part - convert base64 to blob URL
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || ''image/png'';
          const byteCharacters = atob(imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const imageUrl = URL.createObjectURL(blob);
          
          setGeneratedImage(imageUrl);
          imageGenerated = true;
          
          toast({
            title: "نجح التحرير!",
            description: "تم تحرير الصورة بنجاح باستخدام Gemini AI",
          });
          
          console.log(''تم إنشاء الصورة بنجاح'');
        } else if (part.text) {
          console.log(''نص الرد:'', part.text);
        }
      }

      if (!imageGenerated) {
        toast({
          title: "تنبيه",
          description: "لم يتم إنشاء صورة. يرجى تجربة وصف مختلف للتحرير",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error(''خطأ في تحرير الصورة:'', error);
      
      let errorMessage = "حدث خطأ أثناء تحرير الصورة";
      
      if (error.message?.includes(''API_KEY_INVALID'')) {
        errorMessage = "مفتاح API غير صحيح. يرجى التحقق من المفتاح";
      } else if (error.message?.includes(''QUOTA_EXCEEDED'')) {
        errorMessage = "تم تجاوز حد الاستخدام لـ API";
      } else if (error.message?.includes(''PERMISSION_DENIED'')) {
        errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج";
      } else if (error.message?.includes(''SAFETY'')) {
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
    if (!generatedImage) return;
    
    const link = document.createElement(''a'');
    link.href = generatedImage;
    link.download = ''edited-image.png'';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // باقي الكود...
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative">
      {/* AI Matrix Background */}
      <div className="matrix-bg"></div>
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold holographic-text arabic-text">
          محرر الصور بالذكاء الاصطناعي
        </h1>
        <p className="text-lg text-muted-foreground arabic-text max-w-2xl mx-auto">
          قم بتحرير وتحسين صورك باستخدام قوة الذكاء الاصطناعي مع ترجمة تلقائية للأوامر
        </p>
      </div>

      <Card className="ai-card cyber-border">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            📁 اختر الصورة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </CardContent>
      </Card>

      {/* Prompt Input */}
      <Card className="ai-card cyber-border">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            وصف التحرير المطلوب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="اكتب وصفاً دقيقاً للتعديل المطلوب على الصورة..."
            className="min-h-[120px] bg-muted/50 border-accent text-right"
            dir="rtl"
          />
          
          <div className="space-y-2">
            <Label className="arabic-text">نمط الصورة</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger className="bg-gradient-card border-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <span className="arabic-text">{style.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateImage}
            disabled={isGenerating || !selectedFile || !prompt.trim()}
            className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isTranslating ? ''جاري الترجمة...'' : ''جاري التحرير...''}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                تحرير الصورة
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Image */}
      {generatedImage && (
        <Card className="bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              ✨ النتيجة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative group">
              <img
                src={generatedImage}
                alt="Edited"
                className="w-full h-auto rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
              />
            </div>
            
            <Button
              onClick={downloadImage}
              className="w-full bg-gradient-secondary hover:shadow-glow transition-smooth arabic-text"
            >
              <Download className="w-4 h-4 mr-2" />
              تحميل الصورة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
';
END;
$function$;