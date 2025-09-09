import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './ui/file-upload';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2, Wand2, Download, RefreshCw, Languages, Search, Type, Plus, Palette, Eye, Target, Scissors, Grid3X3, Copy, Square, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI, Modality } from '@google/genai';
import { BackgroundRemover } from './background-remover';
import { ImageMerger } from './image-merger';
import { FurnitureEditor } from './furniture-editor';
import { VideoGenerator } from './video-generator';
import { SmartSuggestions } from './smart-suggestions';
import { SpeechGenerator } from './speech-generator';

export const ImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [textToWrite, setTextToWrite] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedElements, setDetectedElements] = useState<string[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [showElementInput, setShowElementInput] = useState(false);
  const [elementModification, setElementModification] = useState('');
  const [imageStyle, setImageStyle] = useState<string>('realistic');
  const [objectDetections, setObjectDetections] = useState<any[]>([]);
  const [segmentationMasks, setSegmentationMasks] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hoveredObject, setHoveredObject] = useState<number | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<number[]>([]);
  const [analysisType, setAnalysisType] = useState<string>('object-detection');
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [tempModification, setTempModification] = useState('');
  const [selectedForEdit, setSelectedForEdit] = useState<Set<string>>(new Set());
  // استخدم مفتاح API ثابت
  const apiKey = 'AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4';
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      
      console.log('ترجمة النص:', { original: arabicPrompt, translated: translatedText });
      return translatedText;
    } catch (error) {
      console.error('خطأ في ترجمة النص:', error);
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
      
      console.log('بدء عملية تحرير الصورة...', {
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
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      console.log('تم تحويل الصورة إلى base64 بنجاح');

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

      console.log('إرسال الطلب إلى Gemini API...');

      // Use the new image generation model with proper configuration
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      console.log('تم استلام الرد من Gemini API');

      // Process the response to extract both text and image
      let imageGenerated = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Image part - convert base64 to blob URL
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
          imageGenerated = true;
          
          toast({
            title: "نجح التحرير!",
            description: "تم تحرير الصورة بنجاح باستخدام Gemini AI",
          });
          
          console.log('تم إنشاء الصورة بنجاح');
        } else if (part.text) {
          console.log('نص الرد:', part.text);
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
      console.error('خطأ في تحرير الصورة:', error);
      
      let errorMessage = "حدث خطأ أثناء تحرير الصورة";
      
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
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ألوان مختلفة للإطارات
  const objectColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const analysisTypes = [
    { value: 'elements', label: 'تحليل العناصر', description: 'تحليل تفصيلي للعناصر والمناطق' },
    { value: 'object-detection', label: 'كشف الكائنات', description: 'تحديد الكائنات وموقعها' },
    { value: 'segmentation', label: 'تقسيم الصورة', description: 'تقسيم الصورة لأجزاء منفصلة' },
    { value: 'visual-qa', label: 'الأسئلة البصرية', description: 'الإجابة على أسئلة حول الصورة' },
    { value: 'classification', label: 'تصنيف الصورة', description: 'تصنيف محتوى الصورة' }
  ];

  const getPromptForAnalysisType = (type: string, customPrompt: string = ''): string => {
    switch (type) {
      case 'elements':
        return 'حلل هذه الصورة بدقة وحدد العناصر والمناطق المختلفة بتفصيل دقيق. اذكر:\n1. المناطق الجغرافية (الجهة اليمنى، اليسرى، الوسط، الأعلى، الأسفل)\n2. العناصر الرئيسية في كل منطقة (الخلفية، الأشخاص، الأثاث، الألوان)\n3. التفاصيل الدقيقة (الإضاءة، الظلال، المواد، الأنسجة)\n4. العلاقات المكانية بين العناصر\nأرجع كل عنصر في سطر منفصل باللغة العربية، مع تحديد موقعه بدقة، بدون أرقام أو نقاط.';
      
      case 'object-detection':
        return 'اكتشف جميع الكائنات البارزة في هذه الصورة. أرجع النتائج بتنسيق JSON يحتوي على قائمة من الكائنات، كل منها يحتوي على "label" (التسمية بالعربية) و "box_2d" (الإحداثيات المعيارية من 0-1000 بتنسيق [ymin, xmin, ymax, xmax]) و "confidence" (مستوى الثقة).';
      
      case 'segmentation':
        return 'قم بتقسيم هذه الصورة وإنشاء أقنعة التجزئة للكائنات المختلفة. أرجع النتائج بتنسيق JSON يحتوي على قائمة من الأقنعة، كل منها يحتوي على "label" (التسمية بالعربية)، "box_2d" (صندوق الحدود)، و "mask" (قناع التجزئة).';
      
      case 'visual-qa':
        return `أجب على السؤال التالي حول الصورة باللغة العربية: ${customPrompt}`;
      
      case 'classification':
        return 'صنف هذه الصورة. حدد النوع، الفئة، النمط، والموضوع الرئيسي. قدم تحليلاً شاملاً بالعربية.';
      
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
    } else if (type === 'elements') {
      const elements = resultText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/));
      
      setDetectedElements(elements);
    }
  };

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
      // Convert file to base64
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

      let prompt = getPromptForAnalysisType(analysisType);
      
      // إعداد المحتوى للإرسال
      const contents = [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: selectedFile.type,
              data: base64String,
            },
          }
        ]
      }];

      let requestBody: any = {
        contents: contents
      };

      // إعدادات خاصة لكل نوع تحليل
      if (analysisType === 'object-detection' || analysisType === 'segmentation') {
        requestBody.generationConfig = {
          responseMimeType: "application/json"
        };
      }

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

  // وظيفة إضافة تعديل العنصر إلى البرومت
  const addElementModification = () => {
    if (!selectedElement || !elementModification.trim()) return;
    
    // إنشاء تعديل أكثر إبداعية ودقة
    const creativeMods = {
      'الجهة اليمنى': `استبدل ${selectedElement} بـ ${elementModification} مع الحفاظ على التناسق البصري والإضاءة الطبيعية والانسجام مع باقي عناصر الصورة`,
      'الجهة اليسرى': `حول ${selectedElement} إلى ${elementModification} مع دمج سلس يحافظ على التوازن البصري`,
      'الخلفية': `غير ${selectedElement} لتصبح ${elementModification} مع انتقال تدريجي طبيعي يحافظ على عمق الصورة`,
      'الوسط': `اجعل ${selectedElement} ${elementModification} مع الحفاظ على النقطة المحورية للصورة`,
    };
    
    // تحديد نوع التعديل بناءً على العنصر المحدد
    let modification = '';
    let foundMatch = false;
    
    for (const [key, template] of Object.entries(creativeMods)) {
      if (selectedElement.includes(key) || selectedElement.includes(key.replace('الجهة ', ''))) {
        modification = template;
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      modification = `قم بتحويل ${selectedElement} إلى ${elementModification} مع دمج إبداعي وسلس يحافظ على التناسق العام للصورة والإضاءة الطبيعية`;
    }
    
    if (prompt.trim()) {
      setPrompt(prompt + '. ' + modification);
    } else {
      setPrompt(modification);
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

  // وظيفة إضافة النص إلى البرومت بطريقة صحيحة
  const addTextToPrompt = () => {
    if (!textToWrite.trim()) return;
    
    const textInstruction = `اكتب النص التالي على الصورة: "${textToWrite}"`;
    
    if (prompt.trim()) {
      setPrompt(prompt + '. ' + textInstruction);
    } else {
      setPrompt(textInstruction);
    }
    
    setTextToWrite('');
    
    toast({
      title: "تم الإضافة!",
      description: "تم إضافة النص إلى حقل البرومت",
    });
  };

  // وظيفة تحويل نمط الصورة إلى نص بالإنجليزية
  const getStyleText = (style: string): string => {
    const styleMap: { [key: string]: string } = {
      'realistic': 'Make it photorealistic with natural lighting and high detail',
      'cartoon': 'Create in cartoon style with vibrant colors and simplified forms',
      'anime': 'Transform into anime/manga style with characteristic features',
      'oil-painting': 'Apply oil painting technique with visible brush strokes and artistic texture',
      'watercolor': 'Use watercolor painting style with soft edges and flowing colors',
      'sketch': 'Convert to pencil sketch style with fine lines and shading',
      'digital-art': 'Create as digital artwork with modern techniques and effects',
      'vintage': 'Apply vintage style with retro colors and classic atmosphere',
      'modern': 'Use modern contemporary style with clean lines and current aesthetics',
      'minimalist': 'Create in minimalist style with simple forms and clean composition'
    };
    
    return styleMap[style] || styleMap['realistic'];
  };

  // وظيفة رسم الكائنات المكتشفة والأقنعة على الصورة
  const drawOverlays = (imageRef?: any, canvasRef?: any) => {
    const imgElement = imageRef?.current;
    const canvasElement = canvasRef?.current || document.querySelector('canvas[class*="absolute"]');
    
    if (!imgElement || !canvasElement) return;
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const imgRect = imgElement.getBoundingClientRect();
    canvasElement.width = imgRect.width;
    canvasElement.height = imgRect.height;
    
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // رسم الكائنات المكتشفة
    objectDetections.forEach((detection, index) => {
      if (!detection.box_2d || !showOverlay) return;

      const [ymin, xmin, ymax, xmax] = detection.box_2d;
      const x = (xmin / 1000) * canvasElement.width;
      const y = (ymin / 1000) * canvasElement.height;
      const width = ((xmax - xmin) / 1000) * canvasElement.width;
      const height = ((ymax - ymin) / 1000) * canvasElement.height;

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
      const x = (xmin / 1000) * canvasElement.width;
      const y = (ymin / 1000) * canvasElement.height;
      const width = ((xmax - xmin) / 1000) * canvasElement.width;
      const height = ((ymax - ymin) / 1000) * canvasElement.height;

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

  // وظائف إدارة تحرير العناصر
  const toggleElementSelection = (element: string) => {
    setSelectedForEdit(prev => {
      const newSet = new Set(prev);
      if (newSet.has(element)) {
        newSet.delete(element);
      } else {
        newSet.add(element);
      }
      return newSet;
    });
  };

  const startElementEdit = (element: string) => {
    setEditingElement(element);
    setTempModification('');
  };

  const cancelElementEdit = () => {
    setEditingElement(null);
    setTempModification('');
  };

  const applyElementModification = (element: string) => {
    if (!tempModification.trim()) return;
    
    const modification = `قم بتحويل ${element} إلى ${tempModification.trim()} مع دمج إبداعي وسلس يحافظ على التناسق العام للصورة والإضاءة الطبيعية`;
    
    if (prompt.trim()) {
      setPrompt(prompt + '. ' + modification);
    } else {
      setPrompt(modification);
    }
    
    setEditingElement(null);
    setTempModification('');
    
    toast({
      title: "تم الإضافة!",
      description: "تم إضافة التعديل إلى حقل البرومت",
    });
  };

  const addSelectedElementsToPrompt = () => {
    if (selectedForEdit.size === 0) return;
    
    const elementsText = Array.from(selectedForEdit).join('، ');
    const instruction = `استخدم العناصر التالية في التحرير: ${elementsText}`;
    
    if (prompt.trim()) {
      setPrompt(prompt + '. ' + instruction);
    } else {
      setPrompt(instruction);
    }
    
    clearElementSelection();
    
    toast({
      title: "تم الإضافة!",
      description: `تم إضافة ${selectedForEdit.size} عنصر إلى البرومت`,
    });
  };

  const clearElementSelection = () => {
    setSelectedForEdit(new Set());
  };

  const resetEditor = () => {
    setSelectedFile(null);
    setPrompt('');
    setTextToWrite('');
    setGeneratedImage(null);
    setDetectedElements([]);
    setSelectedElement('');
    setShowElementInput(false);
    setElementModification('');
    setImageStyle('realistic');
    setObjectDetections([]);
    setSegmentationMasks([]);
    setSelectedObjects([]);
    setHoveredObject(null);
    setImagePreview(null);
    setEditingElement(null);
    setTempModification('');
    setSelectedForEdit(new Set());
  };

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
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="arabic-text">مدعوم بـ Gemini AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse animation-delay-300"></div>
            <span className="arabic-text">تحرير إبداعي متقدم</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="gemini" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="gemini" className="arabic-text">
            تحرير بـ Gemini AI
          </TabsTrigger>
          <TabsTrigger value="video" className="arabic-text">
            إنشاء الفيديو
          </TabsTrigger>
          <TabsTrigger value="furniture" className="arabic-text">
            محرر الأثاث الذكي
          </TabsTrigger>
          <TabsTrigger value="merge" className="arabic-text">
            دمج الصور
          </TabsTrigger>
          <TabsTrigger value="background" className="arabic-text">
            إزالة الخلفية
          </TabsTrigger>
          <TabsTrigger value="speech" className="arabic-text">
            تحويل النص لكلام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gemini" className="space-y-6">
          {/* Translation Status */}
          <Card className="ai-card cyber-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground arabic-text">
                <Languages className="w-4 h-4 text-primary" />
                سيتم ترجمة الأوامر العربية تلقائياً إلى الإنجليزية لضمان أفضل النتائج
                <div className="ml-auto w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Side - Input */}
            <div className="space-y-6">
              {/* File Upload */}
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

              {/* Image Analysis */}
              {selectedFile && (
                <Card className="bg-gradient-card shadow-elegant">
                  <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      فهم الصور المتقدم
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
                              <div className="text-right arabic-text">
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                          {analysisType === 'object-detection' && <Target className="w-4 h-4 mr-2" />}
                          {analysisType === 'segmentation' && <Scissors className="w-4 h-4 mr-2" />}
                          {analysisType === 'elements' && <Search className="w-4 h-4 mr-2" />}
                          {analysisType === 'classification' && <Grid3X3 className="w-4 h-4 mr-2" />}
                          {analysisType === 'visual-qa' && <Eye className="w-4 h-4 mr-2" />}
                          {analysisTypes.find(t => t.value === analysisType)?.label || 'تحليل الصورة'}
                        </>
                      )}
                    </Button>

                     {detectedElements.length > 0 && (
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <h4 className="text-sm font-semibold arabic-text text-primary">العناصر المكتشفة</h4>
                           <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full arabic-text">
                             {detectedElements.length} عنصر
                           </div>
                         </div>
                         
                          {/* قائمة العناصر التفاعلية */}
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {detectedElements.map((element, index) => (
                              <div
                                key={index}
                                className={`p-3 bg-gradient-card rounded-lg border transition-all ${
                                  selectedForEdit.has(element) 
                                    ? 'border-primary shadow-primary/20' 
                                    : 'border-border hover:border-accent'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs arabic-text text-foreground leading-relaxed">
                                      {element}
                                    </p>
                                    
                                    {/* حقل التعديل */}
                                    {editingElement === element && (
                                      <div className="mt-2 space-y-2">
                                        <Textarea
                                          value={tempModification}
                                          onChange={(e) => setTempModification(e.target.value)}
                                          placeholder="اكتب التعديل المطلوب..."
                                          className="min-h-[60px] text-xs bg-muted/50 border-accent"
                                          dir="rtl"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => applyElementModification(element)}
                                            size="sm"
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs arabic-text"
                                          >
                                            <Check className="w-3 h-3 mr-1" />
                                            تطبيق
                                          </Button>
                                          <Button
                                            onClick={() => cancelElementEdit()}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs arabic-text"
                                          >
                                            <X className="w-3 h-3 mr-1" />
                                            إلغاء
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    {/* زر التحديد */}
                                    <Button
                                      onClick={() => toggleElementSelection(element)}
                                      size="sm"
                                      variant={selectedForEdit.has(element) ? "default" : "outline"}
                                      className="w-8 h-8 p-0"
                                    >
                                      <Square className={`w-3 h-3 ${selectedForEdit.has(element) ? 'fill-current' : ''}`} />
                                    </Button>
                                    
                                    {/* زر التحرير */}
                                    <Button
                                      onClick={() => startElementEdit(element)}
                                      size="sm"
                                      variant="outline"
                                      className="w-8 h-8 p-0"
                                      disabled={editingElement !== null && editingElement !== element}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* أزرار العمليات الجماعية */}
                          {selectedForEdit.size > 0 && (
                            <div className="flex gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <Button
                                onClick={addSelectedElementsToPrompt}
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs arabic-text"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                إضافة المحدد للبرومت ({selectedForEdit.size})
                              </Button>
                              <Button
                                onClick={clearElementSelection}
                                size="sm"
                                variant="outline"
                                className="text-xs arabic-text"
                              >
                                <X className="w-3 h-3 mr-1" />
                                إلغاء التحديد
                              </Button>
                            </div>
                          )}
                        </div>
                     )}

                     {/* نتائج كشف الكائنات والتجزئة */}
                     {(objectDetections.length > 0 || segmentationMasks.length > 0) && (
                       <div className="space-y-4">
                         <div className="flex items-center gap-2">
                           <Target className="w-4 h-4 text-primary" />
                           <h4 className="text-sm font-semibold arabic-text text-primary">
                             النتائج البصرية
                           </h4>
                         </div>
                         
                         {/* معاينة الصورة مع الكائنات المكتشفة */}
                         {imagePreview && (
                           <div className="bg-gradient-card rounded-lg p-4 space-y-4">
                             <div className="relative rounded-lg overflow-hidden bg-muted/20">
                               <img
                                 ref={(node) => {
                                   if (node) {
                                     // Create a new image reference
                                     const imageRef = { current: node };
                                     // Draw overlays when image loads
                                     node.onload = () => {
                                       drawOverlays(imageRef);
                                     };
                                   }
                                 }}
                                 src={imagePreview}
                                 alt="صورة مع الكائنات المكتشفة"
                                 className="w-full h-auto max-h-96 object-contain"
                                 onLoad={(e) => {
                                   const img = e.target as HTMLImageElement;
                                   const imageRef = { current: img };
                                   setTimeout(() => drawOverlays(imageRef), 100);
                                 }}
                               />
                               <canvas
                                 ref={(node) => {
                                   if (node) {
                                     const canvasRef = { current: node };
                                     setTimeout(() => {
                                       const img = node.previousElementSibling as HTMLImageElement;
                                       if (img) {
                                         const imageRef = { current: img };
                                         drawOverlays(imageRef, canvasRef);
                                       }
                                     }, 100);
                                   }
                                 }}
                                 className="absolute top-0 left-0 w-full h-full pointer-events-none"
                               />
                             </div>
                             
                             {/* معلومات الكائنات */}
                             {objectDetections.length > 0 && (
                               <div className="space-y-2">
                                 <h5 className="text-xs font-medium arabic-text text-muted-foreground">
                                   الكائنات المكتشفة ({objectDetections.length})
                                 </h5>
                                 <div className="grid grid-cols-1 gap-2">
                                   {objectDetections.map((detection, index) => (
                                     <div
                                       key={index}
                                       className="flex items-center gap-2 p-2 bg-muted/20 rounded-md"
                                     >
                                       <div
                                         className="w-3 h-3 rounded-full"
                                         style={{ backgroundColor: objectColors[index % objectColors.length] }}
                                       />
                                       <span className="text-xs arabic-text">
                                         {detection.label || `كائن ${index + 1}`}
                                       </span>
                                       {detection.confidence && (
                                         <span className="text-xs text-muted-foreground ml-auto">
                                           {Math.round(detection.confidence * 100)}%
                                         </span>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                             
                             {/* معلومات أقنعة التجزئة */}
                             {segmentationMasks.length > 0 && (
                               <div className="space-y-2">
                                 <h5 className="text-xs font-medium arabic-text text-muted-foreground">
                                   أقنعة التجزئة ({segmentationMasks.length})
                                 </h5>
                                 <div className="grid grid-cols-1 gap-2">
                                   {segmentationMasks.map((mask, index) => (
                                     <div
                                       key={index}
                                       className="flex items-center gap-2 p-2 bg-muted/20 rounded-md"
                                     >
                                       <div
                                         className="w-3 h-3 rounded-full"
                                         style={{ backgroundColor: objectColors[index % objectColors.length] }}
                                       />
                                       <span className="text-xs arabic-text">
                                         {mask.label || `قناع ${index + 1}`}
                                       </span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               )}

              {/* Text Writing Tool */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">إضافة نص للصورة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Smart Suggestions */}
              <SmartSuggestions
                title="اقتراحات التحرير الذكية"
                suggestionsPrompt="قم بإنشاء 5 اقتراحات إبداعية لتحرير الصور باللغة العربية. كل اقتراح يجب أن يكون عبارة قصيرة تصف كيفية تحرير أو تحسين الصورة (مثل 'أضف غروب شمس جميل في الخلفية'، 'غير لون السماء إلى الوردي'، 'أضف تأثير المطر'، إلخ). أرجع الاقتراحات فقط، واحد في كل سطر، بدون أرقام أو نص إضافي."
                onSuggestionClick={(suggestion) => {
                  if (prompt.trim()) {
                    setPrompt(prompt + ' ' + suggestion);
                  } else {
                    setPrompt(suggestion);
                  }
                }}
                isEnabled={!!selectedFile}
                context="تحرير الصور"
              />

              {/* Image Style Selection */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    نمط الصورة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="style-select" className="text-sm text-muted-foreground arabic-text">
                    اختر النمط الفني للصورة المحررة
                  </Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger className="w-full">
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
                </CardContent>
              </Card>

              {/* Prompt Input */}
              <Card className="bg-gradient-card shadow-elegant">
                <CardHeader>
                  <CardTitle className="arabic-text">وصف التحرير المطلوب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="اكتب هنا ما تريد تغييره في الصورة... مثل: غير الشاشة داخل الحاسوب الى مشهد من فلم، اجعل السماء زرقاء، أضف غروب شمس..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32 arabic-text resize-none"
                    dir="rtl"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={generateImage}
                      disabled={!selectedFile || !prompt.trim() || isGenerating || isTranslating}
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
                          جاري التحرير...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          حرر الصورة
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetEditor}
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
                  <CardTitle className="arabic-text">النتيجة</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedImage ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={generatedImage}
                          alt="الصورة المحررة"
                          className="w-full h-auto rounded-lg shadow-elegant animate-float"
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-6 rounded-full bg-gradient-primary/10 mb-4">
                        <Wand2 className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 arabic-text">
                        في انتظار التحرير
                      </h3>
                      <p className="text-muted-foreground arabic-text">
                        اختر صورة واكتب وصف التحرير المطلوب لبدء التحرير بالذكاء الاصطناعي
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="video">
          <VideoGenerator />
        </TabsContent>

        <TabsContent value="furniture">
          <FurnitureEditor />
        </TabsContent>

        <TabsContent value="merge">
          <ImageMerger />
        </TabsContent>

        <TabsContent value="background">
          <BackgroundRemover />
        </TabsContent>

        <TabsContent value="speech">
          <SpeechGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};