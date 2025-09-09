import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Scissors, Download, Search, Plus, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI, Modality } from '@google/genai';
import { SmartSuggestions } from './smart-suggestions';
import { Textarea } from './ui/textarea';

const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';

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

const removeBackground = async (file: File): Promise<Blob> => {
  try {
    console.log('بدء عملية إزالة الخلفية باستخدام Gemini...');
    
    // Check file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      throw new Error('حجم الصورة كبير جداً. يرجى استخدام صورة أصغر من 4 ميجابايت');
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // تحويل الصورة إلى base64
    const imageBase64 = await fileToBase64(file);
    console.log('تم تحويل الصورة إلى base64 بنجاح');

    // إعداد المحتوى لإزالة الخلفية
    const contents = [
      { text: "Remove the background from this image completely, keeping only the main subject. Make the background transparent." },
      {
        inlineData: {
          mimeType: file.type,
          data: imageBase64,
        },
      },
    ];

    console.log('إرسال الطلب إلى Gemini API لإزالة الخلفية...');

    // استخدام نموذج توليد الصور
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log('تم استلام الرد من Gemini API');

    // معالجة الاستجابة لاستخراج الصورة
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // جزء الصورة - تحويل base64 إلى blob
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        const byteCharacters = atob(imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        console.log('تم إزالة الخلفية بنجاح باستخدام Gemini');
        return blob;
      }
    }

    throw new Error('لم يتم إنشاء صورة بدون خلفية');
    
  } catch (error: any) {
    console.error('خطأ في إزالة الخلفية:', error);
    
    let errorMessage = "حدث خطأ أثناء إزالة الخلفية";
    
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = "مفتاح API غير صحيح";
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = "تم تجاوز حد الاستخدام لـ API";
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج";
    } else if (error.message?.includes('SAFETY')) {
      errorMessage = "المحتوى لا يتوافق مع سياسات الأمان";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const BackgroundRemover: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedElements, setDetectedElements] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [showElementInput, setShowElementInput] = useState(false);
  const [elementModification, setElementModification] = useState('');
  const [textToWrite, setTextToWrite] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const { toast } = useToast();

  // وظيفة تحليل العناصر في الصورة
  const analyzeImageElements = async () => {
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const base64String = await fileToBase64(selectedFile);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "حلل هذه الصورة واستخرج العناصر والمكونات الموجودة فيها. أرجع قائمة بالعناصر المختلفة (مثل: الخلفية، الأشخاص، الأشياء، الألوان، الإضاءة، إلخ). أرجع كل عنصر في سطر منفصل باللغة العربية، بدون أرقام أو نقاط."
              },
              {
                inlineData: {
                  mimeType: selectedFile.type,
                  data: base64String,
                },
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const elementsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (elementsText) {
        const elements = elementsText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/));
        
        setDetectedElements(elements);
        
        toast({
          title: "تم التحليل!",
          description: `تم استخراج ${elements.length} عنصر من الصورة`,
        });
      }

    } catch (error) {
      console.error('خطأ في تحليل الصورة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل الصورة",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // وظيفة إضافة تعديل العنصر إلى البرومت
  const addElementModification = () => {
    if (!selectedElement || !elementModification.trim()) return;
    
    const modification = `قم بتعديل ${selectedElement}: ${elementModification}`;
    
    if (customPrompt.trim()) {
      setCustomPrompt(customPrompt + '. ' + modification);
    } else {
      setCustomPrompt(modification);
    }
    
    // إعادة تعيين الحقول
    setSelectedElement('');
    setElementModification('');
    setShowElementInput(false);
    
    toast({
      title: "تم الإضافة!",
      description: "تم إضافة التعديل إلى حقل البرومت",
    });
  };

  // وظيفة إضافة النص إلى البرومت
  const addTextToPrompt = () => {
    if (!textToWrite.trim()) return;
    
    const textInstruction = `اكتب النص التالي على الصورة: "${textToWrite}"`;
    
    if (customPrompt.trim()) {
      setCustomPrompt(customPrompt + '. ' + textInstruction);
    } else {
      setCustomPrompt(textInstruction);
    }
    
    setTextToWrite('');
    
    toast({
      title: "تم الإضافة!",
      description: "تم إضافة النص إلى حقل البرومت",
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setProcessedImage(null);
    setDetectedElements([]);
    setSelectedElement('');
    setShowElementInput(false);
    setElementModification('');
    setTextToWrite('');
    setCustomPrompt('');
  };

  const processImage = async () => {
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('بدء معالجة الصورة:', selectedFile.name);
      
      const resultBlob = await removeBackground(selectedFile);
      
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
      
      toast({
        title: "نجح!",
        description: "تم إزالة الخلفية بنجاح باستخدام Gemini AI",
      });
      
    } catch (error: any) {
      console.error('خطأ في المعالجة:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إزالة الخلفية",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'no-background.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      <SmartSuggestions
        title="اقتراحات إزالة الخلفية الذكية"
        suggestionsPrompt="قم بإنشاء 5 نصائح مفيدة لإزالة الخلفية من الصور باللغة العربية. كل اقتراح يجب أن يكون نصيحة قصيرة ومفيدة (مثل 'استخدم صور عالية الجودة للحصول على أفضل النتائج'، 'تأكد من وضوح حدود الكائن المراد إزالة خلفيته'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
        onSuggestionClick={(suggestion) => {
          // عرض النصيحة كتوست
          toast({
            title: "نصيحة مفيدة",
            description: suggestion,
          });
        }}
        isEnabled={true}
        context="إزالة الخلفية"
      />

      <Card className="bg-gradient-card shadow-elegant">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            إزالة الخلفية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          {/* Image Analysis */}
          {selectedFile && (
            <>
              <div className="border-t pt-4 space-y-4">
                <Button
                  onClick={analyzeImageElements}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      حلل العناصر والمكونات
                    </>
                  )}
                </Button>

                {detectedElements.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium arabic-text">العناصر المكتشفة:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {detectedElements.map((element, index) => (
                        <Button
                          key={index}
                          variant={selectedElement === element ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedElement(element);
                            setShowElementInput(true);
                          }}
                          className="arabic-text text-xs h-auto py-2"
                        >
                          {element}
                        </Button>
                      ))}
                    </div>

                    {showElementInput && selectedElement && (
                      <div className="space-y-3 border-t pt-3">
                        <h5 className="text-sm font-medium arabic-text">
                          تعديل: {selectedElement}
                        </h5>
                        <Textarea
                          placeholder="اكتب التعديل المطلوب لهذا العنصر..."
                          value={elementModification}
                          onChange={(e) => setElementModification(e.target.value)}
                          className="min-h-20 arabic-text resize-none"
                          dir="rtl"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={addElementModification}
                            disabled={!elementModification.trim()}
                            size="sm"
                            className="flex-1 arabic-text"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            أضف للبرومت
                          </Button>
                          <Button
                            onClick={() => {
                              setShowElementInput(false);
                              setSelectedElement('');
                              setElementModification('');
                            }}
                            variant="outline"
                            size="sm"
                            className="arabic-text"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Text Writing Tool */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium arabic-text">إضافة نص للصورة</h4>
                <Textarea
                  placeholder="اكتب النص الذي تريد إضافته للصورة... مثل: بسم الله الرحمن الرحيم"
                  value={textToWrite}
                  onChange={(e) => setTextToWrite(e.target.value)}
                  className="min-h-20 arabic-text resize-none"
                  dir="rtl"
                />
                <Button
                  onClick={addTextToPrompt}
                  disabled={!textToWrite.trim()}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  <Type className="w-4 h-4 mr-2" />
                  أضف النص للبرومت
                </Button>
              </div>

              {/* Custom Prompt Display */}
              {customPrompt && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-medium arabic-text">البرومت المخصص:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm arabic-text" dir="rtl">{customPrompt}</p>
                  </div>
                  <Button
                    onClick={() => setCustomPrompt('')}
                    variant="outline"
                    size="sm"
                    className="w-full arabic-text"
                  >
                    مسح البرومت
                  </Button>
                </div>
              )}
            </>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={processImage}
              disabled={!selectedFile || isProcessing}
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإزالة...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  إزالة الخلفية
                </>
              )}
            </Button>
          </div>

          {processedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={processedImage}
                  alt="صورة بدون خلفية"
                  className="w-full h-auto rounded-lg shadow-elegant animate-float"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
              <Button
                onClick={downloadImage}
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
              >
                <Download className="w-4 h-4 mr-2" />
                تحميل الصورة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};