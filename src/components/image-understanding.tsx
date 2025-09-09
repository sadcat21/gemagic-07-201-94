import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2, Eye, Download, RefreshCw, Image as ImageIcon, Search, Target, Scissors, Grid3X3, Copy, Palette, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

export const ImageUnderstanding: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisType, setAnalysisType] = useState<string>('caption');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [objectDetections, setObjectDetections] = useState<any[]>([]);
  const [segmentationMasks, setSegmentationMasks] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [showOverlay, setShowOverlay] = useState(true);
  const [hoveredObject, setHoveredObject] = useState<number | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // استخدم مفتاح API ثابت
  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
  const { toast } = useToast();

  // ألوان مختلفة للإطارات
  const objectColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const analysisTypes = [
    { value: 'caption', label: 'وصف الصورة', description: 'وصف تفصيلي لمحتوى الصورة' },
    { value: 'object-detection', label: 'كشف الكائنات', description: 'تحديد الكائنات وموقعها' },
    { value: 'segmentation', label: 'تقسيم الصورة', description: 'تقسيم الصورة لأجزاء منفصلة' },
    { value: 'visual-qa', label: 'الأسئلة البصرية', description: 'الإجابة على أسئلة حول الصورة' },
    { value: 'classification', label: 'تصنيف الصورة', description: 'تصنيف محتوى الصورة' },
    { value: 'comparison', label: 'مقارنة الصور', description: 'مقارنة بين صورتين أو أكثر' }
  ];

  const handleFileSelect = (file: File) => {
    if (analysisType === 'comparison') {
      // للمقارنة، اسمح بعدة صور
      setSelectedFiles(prev => [...prev, file]);
    } else {
      // للتحليل العادي، صورة واحدة فقط
      setSelectedFiles([file]);
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
    setResults(null);
    setObjectDetections([]);
    setSegmentationMasks([]);
    setSelectedObjects([]);
    setHoveredObject(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = async (file: File): Promise<string> => {
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

  const analyzeImage = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (analysisType === 'visual-qa' && !customPrompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سؤال للإجابة عليه",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // تحويل الصور إلى base64
      const imageData = await Promise.all(
        selectedFiles.map(async (file) => ({
          inlineData: {
            mimeType: file.type,
            data: await convertFileToBase64(file),
          },
        }))
      );

      let prompt = getPromptForAnalysisType(analysisType, customPrompt);
      
      // إعداد المحتوى للإرسال
      const contents = [{
        parts: [
          { text: prompt },
          ...imageData
        ]
      }];

      let requestBody: any = {
        contents: contents
      };

      // إعدادات خاصة لكل نوع تحليل
      if (analysisType === 'object-detection') {
        requestBody.generationConfig = {
          responseMimeType: "application/json"
        };
      } else if (analysisType === 'segmentation') {
        requestBody.generationConfig = {
          responseMimeType: "application/json"
        };
      }

      console.log('إرسال طلب التحليل...', { analysisType, filesCount: selectedFiles.length });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'حدث خطأ في التحليل');
      }

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (resultText) {
        // معالجة النتائج حسب نوع التحليل
        processResults(analysisType, resultText);
        
        toast({
          title: "تم التحليل!",
          description: "تم تحليل الصورة بنجاح",
        });
      } else {
        throw new Error('لم يتم الحصول على نتائج');
      }

    } catch (error: any) {
      console.error('خطأ في تحليل الصورة:', error);
      
      let errorMessage = "حدث خطأ أثناء تحليل الصورة";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = "مفتاح API غير صحيح";
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = "تم تجاوز حد الاستخدام";
      } else if (error.message?.includes('SAFETY')) {
        errorMessage = "المحتوى لا يتوافق مع سياسات الأمان";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPromptForAnalysisType = (type: string, customPrompt: string): string => {
    switch (type) {
      case 'caption':
        return 'قم بوصف هذه الصورة بتفصيل دقيق باللغة العربية. اذكر العناصر الرئيسية، الألوان، الإضاءة، التكوين، والمشاعر المنقولة.';
      
      case 'object-detection':
        return 'اكتشف جميع الكائنات البارزة في هذه الصورة. أرجع النتائج بتنسيق JSON يحتوي على قائمة من الكائنات، كل منها يحتوي على "label" (التسمية بالعربية) و "box_2d" (الإحداثيات المعيارية من 0-1000 بتنسيق [ymin, xmin, ymax, xmax]) و "confidence" (مستوى الثقة).';
      
      case 'segmentation':
        return 'قم بتقسيم هذه الصورة وإنشاء أقنعة التجزئة للكائنات المختلفة. أرجع النتائج بتنسيق JSON يحتوي على قائمة من الأقنعة، كل منها يحتوي على "label" (التسمية بالعربية)، "box_2d" (صندوق الحدود)، و "mask" (قناع التجزئة).';
      
      case 'visual-qa':
        return `أجب على السؤال التالي حول الصورة باللغة العربية: ${customPrompt}`;
      
      case 'classification':
        return 'صنف هذه الصورة. حدد النوع، الفئة، النمط، والموضوع الرئيسي. قدم تحليلاً شاملاً بالعربية.';
      
      case 'comparison':
        return 'قارن بين هذه الصور. اذكر أوجه الشبه والاختلاف، العناصر المشتركة، والفروقات في التكوين والمحتوى والأسلوب.';
      
      default:
        return 'حلل هذه الصورة وقدم معلومات مفيدة عنها بالعربية.';
    }
  };

  const processResults = (type: string, resultText: string) => {
    if (type === 'object-detection' || type === 'segmentation') {
      try {
        // محاولة تحليل JSON
        const cleanedText = resultText.replace(/```json\n?|\n?```/g, '');
        const jsonData = JSON.parse(cleanedText);
        
        if (type === 'object-detection') {
          setObjectDetections(Array.isArray(jsonData) ? jsonData : []);
        } else if (type === 'segmentation') {
          setSegmentationMasks(Array.isArray(jsonData) ? jsonData : []);
        }
      } catch (error) {
        console.log('فشل في تحليل JSON، سيتم عرض النص العادي');
      }
    }
    
    setResults(resultText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  // وظائف عرض الإطارات والأقنعة
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }
  }, [imagePreview]);

  const drawOverlays = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgRect = imageRef.current.getBoundingClientRect();
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم الكائنات المكتشفة
    objectDetections.forEach((detection, index) => {
      if (!detection.box_2d || !showOverlay) return;

      const [ymin, xmin, ymax, xmax] = detection.box_2d;
      const x = (xmin / 1000) * canvas.width;
      const y = (ymin / 1000) * canvas.height;
      const width = ((xmax - xmin) / 1000) * canvas.width;
      const height = ((ymax - ymin) / 1000) * canvas.height;

      const color = objectColors[index % objectColors.length];
      const isHovered = hoveredObject === index;
      const isSelected = selectedObjects.includes(index);

      // رسم الإطار
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
      ctx.setLineDash(isSelected ? [5, 5] : []);
      ctx.strokeRect(x, y, width, height);

      // خلفية التسمية
      ctx.fillStyle = color + '90'; // شفافية
      ctx.fillRect(x, y - 25, ctx.measureText(detection.label || '').width + 10, 20);

      // نص التسمية
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(detection.label || `كائن ${index + 1}`, x + 5, y - 8);

      ctx.setLineDash([]);
    });

    // رسم أقنعة التجزئة
    segmentationMasks.forEach((mask, index) => {
      if (!mask.box_2d || !showOverlay) return;

      const [ymin, xmin, ymax, xmax] = mask.box_2d;
      const x = (xmin / 1000) * canvas.width;
      const y = (ymin / 1000) * canvas.height;
      const width = ((xmax - xmin) / 1000) * canvas.width;
      const height = ((ymax - ymin) / 1000) * canvas.height;

      const color = objectColors[index % objectColors.length];
      const isHovered = hoveredObject === index;
      const isSelected = selectedObjects.includes(index);

      // رسم منطقة شفافة للقناع
      ctx.fillStyle = color + '30';
      ctx.fillRect(x, y, width, height);

      // رسم الإطار
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
      ctx.setLineDash(isSelected ? [5, 5] : []);
      ctx.strokeRect(x, y, width, height);

      // تسمية القناع
      ctx.fillStyle = color + '90';
      ctx.fillRect(x, y - 25, ctx.measureText(mask.label || '').width + 10, 20);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(mask.label || `قناع ${index + 1}`, x + 5, y - 8);

      ctx.setLineDash([]);
    });
  };

  useEffect(() => {
    drawOverlays();
  }, [objectDetections, segmentationMasks, showOverlay, hoveredObject, selectedObjects, imagePreview]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 1000;

    // البحث عن الكائن المضغوط عليه
    const clickedObjects = [...objectDetections, ...segmentationMasks].map((item, index) => {
      if (!item.box_2d) return null;
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      
      if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
        return index;
      }
      return null;
    }).filter(index => index !== null);

    if (clickedObjects.length > 0) {
      const clickedIndex = clickedObjects[0]!;
      setSelectedObjects(prev => 
        prev.includes(clickedIndex) 
          ? prev.filter(i => i !== clickedIndex)
          : [...prev, clickedIndex]
      );
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 1000;

    // البحث عن الكائن تحت المؤشر
    const hoveredIndex = [...objectDetections, ...segmentationMasks].findIndex((item, index) => {
      if (!item.box_2d) return false;
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
    });

    setHoveredObject(hoveredIndex >= 0 ? hoveredIndex : null);
  };

  const resetAnalysis = () => {
    setSelectedFiles([]);
    setCustomPrompt('');
    setResults(null);
    setObjectDetections([]);
    setSegmentationMasks([]);
    setImagePreview(null);
    setSelectedObjects([]);
    setHoveredObject(null);
  };

  const selectedAnalysisType = analysisTypes.find(type => type.value === analysisType);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative">
      {/* AI Matrix Background */}
      <div className="matrix-bg"></div>
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold holographic-text arabic-text">
          فهم الصور بالذكاء الاصطناعي
        </h1>
        <p className="text-lg text-muted-foreground arabic-text max-w-2xl mx-auto">
          حلل صورك باستخدام تقنيات Gemini المتقدمة لكشف الكائنات والتجزئة والوصف التفصيلي
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="arabic-text">مدعوم بـ Gemini 2.5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse animation-delay-300"></div>
            <span className="arabic-text">تحليل متقدم للصور</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="ai-card border-accent shadow-elegant">
            <CardHeader>
              <CardTitle className="arabic-text flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                إعدادات التحليل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* نوع التحليل */}
              <div className="space-y-2">
                <Label className="arabic-text">نوع التحليل</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="bg-gradient-card border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="arabic-text">
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Prompt for Visual QA */}
              {analysisType === 'visual-qa' && (
                <div className="space-y-2">
                  <Label className="arabic-text">السؤال</Label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="اكتب سؤالاً عن الصورة..."
                    className="bg-gradient-card border-accent arabic-text resize-none min-h-[100px]"
                  />
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="arabic-text">
                  {analysisType === 'comparison' ? 'اختر الصور للمقارنة' : 'اختر صورة للتحليل'}
                </Label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFiles[0]}
                  accept="image"
                  className="bg-gradient-card border-accent"
                />
              </div>

              {/* عرض الصور المختارة للمقارنة */}
              {analysisType === 'comparison' && selectedFiles.length > 1 && (
                <div className="space-y-2">
                  <Label className="arabic-text">الصور المختارة ({selectedFiles.length})</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="bg-gradient-card p-2 rounded-lg border border-accent">
                          <div className="text-sm arabic-text truncate">{file.name}</div>
                          <Button
                            onClick={() => removeFile(index)}
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing || selectedFiles.length === 0}
                  className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth arabic-text"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 ml-2" />
                      تحليل الصورة
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  className="arabic-text border-accent"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <Card className="ai-card border-accent shadow-elegant">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  نتائج التحليل - {selectedAnalysisType?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Object Detection Results */}
                {analysisType === 'object-detection' && objectDetections.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold arabic-text flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      الكائنات المكتشفة ({objectDetections.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto elements-scroll">
                      {objectDetections.map((detection, index) => (
                        <div key={index} className="bg-gradient-card p-3 rounded-lg border border-accent">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="arabic-text">
                              {detection.label || `كائن ${index + 1}`}
                            </Badge>
                            {detection.confidence && (
                              <span className="text-sm text-muted-foreground">
                                {Math.round(detection.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          {detection.box_2d && (
                            <div className="text-xs text-muted-foreground mt-1">
                              الموقع: [{detection.box_2d.join(', ')}]
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segmentation Results */}
                {analysisType === 'segmentation' && segmentationMasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold arabic-text flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      أقنعة التجزئة ({segmentationMasks.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto elements-scroll">
                      {segmentationMasks.map((mask, index) => (
                        <div key={index} className="bg-gradient-card p-3 rounded-lg border border-accent">
                          <Badge variant="secondary" className="arabic-text">
                            {mask.label || `قناع ${index + 1}`}
                          </Badge>
                          {mask.box_2d && (
                            <div className="text-xs text-muted-foreground mt-1">
                              المنطقة: [{mask.box_2d.join(', ')}]
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold arabic-text">النتيجة التفصيلية</h3>
                    <Button
                      onClick={() => copyToClipboard(results)}
                      variant="outline"
                      size="sm"
                      className="arabic-text"
                    >
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ
                    </Button>
                  </div>
                  <div className="bg-gradient-card p-4 rounded-lg border border-accent max-h-96 overflow-y-auto elements-scroll">
                    <pre className="arabic-text text-sm whitespace-pre-wrap">{results}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions Card */}
          {!results && (
            <Card className="ai-card border-accent shadow-elegant">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-primary" />
                  إرشادات الاستخدام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 arabic-text text-sm">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">أنواع التحليل المتاحة:</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      {analysisTypes.map((type) => (
                        <li key={type.value} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <div>
                            <span className="font-medium">{type.label}:</span> {type.description}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-primary mb-2">نصائح للحصول على أفضل النتائج:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• استخدم صور واضحة وعالية الجودة</li>
                      <li>• تأكد من الإضاءة الجيدة في الصورة</li>
                      <li>• للمقارنة، اختر صور متشابهة في الحجم</li>
                      <li>• اكتب أسئلة محددة وواضحة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Visualization Section */}
      {imagePreview && (objectDetections.length > 0 || segmentationMasks.length > 0) && (
        <Card className="ai-card border-accent shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="arabic-text flex items-center gap-2">
                <Square className="w-5 h-5 text-primary" />
                عرض الكائنات على الصورة
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showOverlay}
                    onCheckedChange={setShowOverlay}
                    id="overlay-toggle"
                  />
                  <Label htmlFor="overlay-toggle" className="arabic-text text-sm">
                    إظهار الإطارات
                  </Label>
                </div>
                <Button
                  onClick={() => setSelectedObjects([])}
                  variant="outline"
                  size="sm"
                  className="arabic-text"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إلغاء التحديد
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* معلومات عن التفاعل */}
              <div className="bg-gradient-card p-3 rounded-lg border border-accent">
                <div className="arabic-text text-sm text-muted-foreground space-y-1">
                  <p>• مرر المؤشر فوق الكائنات لإبرازها</p>
                  <p>• اضغط على الكائنات لتحديدها أو إلغاء تحديدها</p>
                  <p>• الكائنات المحددة تظهر بإطار منقط</p>
                </div>
              </div>

              {/* عرض الصورة مع الإطارات */}
              <div className="relative bg-gradient-card rounded-lg p-4 border border-accent">
                <div className="relative inline-block w-full">
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="الصورة قيد التحليل"
                    className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                    onLoad={() => {
                      setTimeout(() => drawOverlays(), 100);
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-pointer"
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={() => setHoveredObject(null)}
                  />
                  
                  {/* معلومات الكائن عند التمرير */}
                  {hoveredObject !== null && (
                    <div className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded-lg text-sm arabic-text">
                      {[...objectDetections, ...segmentationMasks][hoveredObject]?.label || `كائن ${hoveredObject + 1}`}
                      {[...objectDetections, ...segmentationMasks][hoveredObject]?.confidence && (
                        <div className="text-xs opacity-75">
                          الثقة: {Math.round([...objectDetections, ...segmentationMasks][hoveredObject].confidence * 100)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* قائمة الألوان والكائنات */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold arabic-text">دليل الألوان</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[...objectDetections, ...segmentationMasks].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-smooth cursor-pointer ${
                        selectedObjects.includes(index)
                          ? 'border-primary bg-gradient-primary/10'
                          : hoveredObject === index
                          ? 'border-accent bg-gradient-card'
                          : 'border-border bg-card hover:bg-gradient-card'
                      }`}
                      onClick={() => {
                        setSelectedObjects(prev => 
                          prev.includes(index) 
                            ? prev.filter(i => i !== index)
                            : [...prev, index]
                        );
                      }}
                      onMouseEnter={() => setHoveredObject(index)}
                      onMouseLeave={() => setHoveredObject(null)}
                    >
                      <div
                        className="w-4 h-4 rounded border-2 border-white shadow-sm"
                        style={{ backgroundColor: objectColors[index % objectColors.length] }}
                      />
                      <div className="flex-1">
                        <div className="arabic-text text-sm font-medium">
                          {item.label || `${analysisType === 'segmentation' ? 'قناع' : 'كائن'} ${index + 1}`}
                        </div>
                        {item.confidence && (
                          <div className="text-xs text-muted-foreground">
                            الثقة: {Math.round(item.confidence * 100)}%
                          </div>
                        )}
                      </div>
                      {selectedObjects.includes(index) && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* إحصائيات */}
              <div className="bg-gradient-card p-3 rounded-lg border border-accent">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {objectDetections.length + segmentationMasks.length}
                    </div>
                    <div className="text-sm text-muted-foreground arabic-text">إجمالي الكائنات</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {objectDetections.length}
                    </div>
                    <div className="text-sm text-muted-foreground arabic-text">كائنات مكتشفة</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {segmentationMasks.length}
                    </div>
                    <div className="text-sm text-muted-foreground arabic-text">أقنعة التجزئة</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {selectedObjects.length}
                    </div>
                    <div className="text-sm text-muted-foreground arabic-text">محددة</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};