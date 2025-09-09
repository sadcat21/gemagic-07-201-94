import React, { useState } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Scan, Home, Trash2, Plus, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI } from '@google/genai';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { SmartSuggestions } from './smart-suggestions';

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  description: string;
}

interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  confidence: number;
  modifications?: string;
}

export const FurnitureEditor: React.FC = () => {
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [furnitureImage, setFurnitureImage] = useState<File | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [detectedFurniture, setDetectedFurniture] = useState<FurnitureItem[]>([]);
  const [selectedItemsToRemove, setSelectedItemsToRemove] = useState<string[]>([]);
  const [selectedFurnitureToAdd, setSelectedFurnitureToAdd] = useState<string[]>([]);
  const [furnitureModifications, setFurnitureModifications] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingFurniture, setIsAnalyzingFurniture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanedRoomImage, setCleanedRoomImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'remove' | 'furniture' | 'furnitureAnalyze' | 'final'>('upload');

  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
  const { toast } = useToast();

  const analyzeRoom = async () => {
    if (!roomImage) return;

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(roomImage);
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this room image and list all furniture and decorative items you can see. For each item, provide: name, confidence level (0-100), and brief description of location/appearance. Format the response as JSON array with objects containing: id, name, confidence, description. Only return the JSON array, no other text."
              },
              {
                inlineData: {
                  mimeType: roomImage.type,
                  data: base64String,
                },
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      try {
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const items = JSON.parse(cleanedText);
        setDetectedItems(items);
        setCurrentStep('analyze');
        
        toast({
          title: "تم تحليل الغرفة بنجاح",
          description: `تم اكتشاف ${items.length} عنصر في الغرفة`,
        });
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        toast({
          title: "خطأ في التحليل",
          description: "لم نتمكن من تحليل محتويات الغرفة بشكل صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing room:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل الغرفة",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeSelectedItems = async () => {
    if (!roomImage || selectedItemsToRemove.length === 0) return;

    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(roomImage);
      });

      const itemsToRemove = detectedItems
        .filter(item => selectedItemsToRemove.includes(item.id))
        .map(item => item.name)
        .join(', ');

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [
          {
            text: `Remove the following items from this room image: ${itemsToRemove}. Keep the room structure intact and fill the empty spaces naturally with appropriate room elements like walls, floor, or background. Make it look realistic and clean.`
          },
          {
            inlineData: {
              mimeType: roomImage.type,
              data: base64String,
            },
          }
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      let imageGenerated = false;
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
          
          setCleanedRoomImage(imageUrl);
          setCurrentStep('remove');
          imageGenerated = true;

          toast({
            title: "تم تنظيف الغرفة",
            description: "تم إزالة العناصر المحددة بنجاح",
          });
        }
      }

      if (!imageGenerated) {
        toast({
          title: "خطأ",
          description: "لم نتمكن من إزالة العناصر",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing items:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إزالة العناصر",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeFurniture = async () => {
    if (!furnitureImage) return;

    setIsAnalyzingFurniture(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(furnitureImage);
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this furniture image and identify all individual furniture pieces or items you can see. For each item, provide: name, confidence level (0-100), and brief description. Format the response as JSON array with objects containing: id, name, confidence, description. Only return the JSON array, no other text."
              },
              {
                inlineData: {
                  mimeType: furnitureImage.type,
                  data: base64String,
                },
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      try {
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const items = JSON.parse(cleanedText);
        setDetectedFurniture(items);
        setCurrentStep('furnitureAnalyze');
        
        toast({
          title: "تم تحليل الأثاث بنجاح",
          description: `تم اكتشاف ${items.length} قطعة أثاث`,
        });
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        toast({
          title: "خطأ في التحليل",
          description: "لم نتمكن من تحليل الأثاث بشكل صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing furniture:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل الأثاث",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingFurniture(false);
    }
  };

  const addFurniture = async () => {
    if (!cleanedRoomImage || !furnitureImage || selectedFurnitureToAdd.length === 0) return;

    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Convert cleaned room image URL back to base64
      const roomResponse = await fetch(cleanedRoomImage);
      const roomBlob = await roomResponse.blob();
      const roomBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(roomBlob);
      });

      // Convert furniture image to base64
      const furnitureBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(furnitureImage);
      });

      const selectedItems = detectedFurniture
        .filter(item => selectedFurnitureToAdd.includes(item.id))
        .map(item => {
          const modifications = furnitureModifications[item.id];
          return modifications ? `${item.name} (${modifications})` : item.name;
        })
        .join(', ');

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [
          {
            text: `Place these specific furniture items naturally into this room: ${selectedItems}. Position them appropriately considering the room's perspective, lighting, and scale. Make sure the furniture fits harmoniously with the room's style and appears realistic.`
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: roomBase64,
            },
          },
          {
            inlineData: {
              mimeType: furnitureImage.type,
              data: furnitureBase64,
            },
          }
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      let imageGenerated = false;
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
          
          setFinalImage(imageUrl);
          setCurrentStep('final');
          imageGenerated = true;

          toast({
            title: "تم دمج الأثاث بنجاح",
            description: "تم إضافة الأثاث إلى الغرفة بشكل طبيعي",
          });
        }
      }

      if (!imageGenerated) {
        toast({
          title: "خطأ",
          description: "لم نتمكن من دمج الأثاث",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding furniture:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء دمج الأثاث",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!finalImage) return;
    
    const link = document.createElement('a');
    link.href = finalImage;
    link.download = 'room-with-furniture.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetEditor = () => {
    setRoomImage(null);
    setFurnitureImage(null);
    setDetectedItems([]);
    setDetectedFurniture([]);
    setSelectedItemsToRemove([]);
    setSelectedFurnitureToAdd([]);
    setFurnitureModifications({});
    setCleanedRoomImage(null);
    setFinalImage(null);
    setCurrentStep('upload');
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemsToRemove(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleFurnitureSelection = (itemId: string) => {
    setSelectedFurnitureToAdd(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent arabic-text">
          محرر الأثاث الذكي
        </h2>
        <p className="text-lg text-muted-foreground arabic-text max-w-2xl mx-auto">
          حلل غرفتك واختر العناصر المراد إزالتها ثم أضف أثاثاً جديداً بشكل طبيعي
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {[
            { step: 'upload', label: 'رفع الغرفة', icon: Home },
            { step: 'analyze', label: 'تحليل العناصر', icon: Scan },
            { step: 'remove', label: 'إزالة العناصر', icon: Trash2 },
            { step: 'furniture', label: 'رفع الأثاث', icon: Plus },
            { step: 'furnitureAnalyze', label: 'اختيار الأثاث', icon: Scan },
            { step: 'final', label: 'النتيجة النهائية', icon: Download }
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === step 
                  ? 'bg-gradient-primary text-primary-foreground' 
                  : index < ['upload', 'analyze', 'remove', 'furniture', 'furnitureAnalyze', 'final'].indexOf(currentStep)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="mr-2 text-sm arabic-text">{label}</span>
              {index < 5 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Controls */}
        <div className="space-y-6">
          {/* Smart Suggestions */}
          <SmartSuggestions
            title="اقتراحات التصميم الذكية"
            suggestionsPrompt="قم بإنشاء 5 اقتراحات إبداعية لتصميم الغرف والأثاث باللغة العربية. كل اقتراح يجب أن يكون وصف قصير لفكرة تصميم أو ترتيب (مثل 'إضافة طاولة قهوة في وسط الغرفة'، 'استبدال الكنبة بكراسي مريحة'، 'إضافة نباتات للزاوية الفارغة'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
            onSuggestionClick={(suggestion) => {
              toast({
                title: "اقتراح مفيد!",
                description: suggestion,
              });
            }}
            isEnabled={true}
            context="تصميم الأثاث"
          />

          {/* Step 1: Upload Room */}
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text flex items-center gap-2">
                <Home className="w-5 h-5" />
                الخطوة 1: رفع صورة الغرفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={(file) => {
                  setRoomImage(file);
                  if (file) {
                    analyzeRoom();
                  }
                }}
                selectedFile={roomImage}
              />
              {roomImage && !detectedItems.length && (
                <Button
                  onClick={analyzeRoom}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري تحليل الغرفة...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      تحليل عناصر الغرفة
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Items to Remove */}
          {detectedItems.length > 0 && (
            <Card className="bg-gradient-card shadow-elegant">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  الخطوة 2: اختر العناصر للإزالة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {detectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                    >
                      <Checkbox
                        id={item.id}
                        checked={selectedItemsToRemove.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={item.id}
                            className="text-sm font-medium arabic-text cursor-pointer"
                          >
                            {item.name}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {item.confidence}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground arabic-text">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedItemsToRemove.length > 0 && (
                  <Button
                    onClick={removeSelectedItems}
                    disabled={isProcessing}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري إزالة العناصر...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        إزالة العناصر المحددة ({selectedItemsToRemove.length})
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Upload Furniture */}
          {cleanedRoomImage && (
            <Card className="bg-gradient-card shadow-elegant">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  الخطوة 3: رفع صورة الأثاث
                </CardTitle>
              </CardHeader>
              <CardContent>
              <FileUpload
                onFileSelect={(file) => {
                  setFurnitureImage(file);
                  if (file) {
                    analyzeFurniture();
                  }
                }}
                selectedFile={furnitureImage}
              />
                {furnitureImage && !detectedFurniture.length && (
                  <Button
                    onClick={analyzeFurniture}
                    disabled={isAnalyzingFurniture}
                    className="w-full mt-4 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                  >
                    {isAnalyzingFurniture ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري تحليل الأثاث...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        تحليل قطع الأثاث
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Select Furniture to Add */}
          {detectedFurniture.length > 0 && (
            <Card className="bg-gradient-card shadow-elegant">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  الخطوة 4: اختر الأثاث للإضافة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                   {detectedFurniture.map((item) => (
                     <div
                       key={item.id}
                       className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors space-y-3"
                     >
                       <div className="flex items-center space-x-3 rtl:space-x-reverse">
                         <Checkbox
                           id={`furniture-${item.id}`}
                           checked={selectedFurnitureToAdd.includes(item.id)}
                           onCheckedChange={() => toggleFurnitureSelection(item.id)}
                         />
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <label
                               htmlFor={`furniture-${item.id}`}
                               className="text-sm font-medium arabic-text cursor-pointer"
                             >
                               {item.name}
                             </label>
                             <Badge variant="secondary" className="text-xs">
                               {item.confidence}%
                             </Badge>
                           </div>
                           <p className="text-xs text-muted-foreground arabic-text">
                             {item.description}
                           </p>
                         </div>
                       </div>
                       {selectedFurnitureToAdd.includes(item.id) && (
                         <div className="mr-6 rtl:ml-6">
                           <label className="block text-sm font-medium mb-2 arabic-text">
                             التعديلات المطلوبة:
                           </label>
                           <textarea
                             className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
                             rows={2}
                             placeholder="اكتب التعديلات التي تريدها على هذا الأثاث..."
                             value={furnitureModifications[item.id] || ''}
                             onChange={(e) => setFurnitureModifications(prev => ({
                               ...prev,
                               [item.id]: e.target.value
                             }))}
                           />
                         </div>
                       )}
                     </div>
                   ))}
                </div>
                {selectedFurnitureToAdd.length > 0 && (
                  <Button
                    onClick={addFurniture}
                    disabled={isProcessing}
                    className="w-full mt-4 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري دمج الأثاث...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        دمج الأثاث في الغرفة
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reset Button */}
          <Button
            onClick={resetEditor}
            variant="outline"
            className="w-full arabic-text"
          >
            <Home className="w-4 h-4 mr-2" />
            بدء مشروع جديد
          </Button>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text">معاينة النتائج</CardTitle>
            </CardHeader>
            <CardContent>
              {finalImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={finalImage}
                      alt="الغرفة مع الأثاث الجديد"
                      className="w-full h-auto rounded-lg shadow-elegant animate-float"
                    />
                  </div>
                  <Button
                    onClick={downloadImage}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تحميل النتيجة النهائية
                  </Button>
                </div>
              ) : cleanedRoomImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={cleanedRoomImage}
                      alt="الغرفة بعد إزالة العناصر"
                      className="w-full h-auto rounded-lg shadow-elegant"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground arabic-text">
                    الغرفة بعد إزالة العناصر - أضف الأثاث الآن
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-6 rounded-full bg-gradient-primary/10 mb-4">
                    <Home className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 arabic-text">
                    ابدأ بتحرير غرفتك
                  </h3>
                  <p className="text-muted-foreground arabic-text">
                    ارفع صورة الغرفة وتابع الخطوات لإنشاء التصميم المثالي
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