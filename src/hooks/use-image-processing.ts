import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImageProcessingOptions {
  operationType: 'image-editing' | 'image-merging' | 'background-removal' | 'image-analysis' | 'image-upload';
  images?: string[]; // base64 encoded images
  prompt?: string;
  projectTitle?: string;
  imageStyle?: string;
  analysisType?: string;
  imageBase64?: string;
  fileName?: string;
}

export interface ImageProcessingResult {
  success: boolean;
  projectId?: string;
  operationId?: string;
  result?: {
    imageUrl?: string;
    translatedPrompt?: string;
    analysisResults?: any;
    detectedElements?: string[];
    confidenceScore?: number;
    rawText?: string;
  };
  error?: string;
}

export const useImageProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processImages = async (options: ImageProcessingOptions): Promise<ImageProcessingResult> => {
    setIsProcessing(true);
    
    try {
      console.log('Starting image processing:', {
        operationType: options.operationType,
        imageCount: options.images.length,
        hasPrompt: !!options.prompt
      });

      // استدعاء edge function بدون تطلب تسجيل دخول
      const { data, error } = await supabase.functions.invoke('image-processing', {
        body: options
      });

      if (error) {
        throw new Error(error.message || 'Failed to process images');
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      console.log('Image processing completed:', data);

      // عرض رسالة نجاح
      const operationNames = {
        'image-editing': 'تحرير الصورة',
        'image-merging': 'دمج الصور',
        'background-removal': 'إزالة الخلفية',
        'image-analysis': 'تحليل الصورة',
        'image-upload': 'رفع الصورة'
      };

      const operationMessage = data.projectId 
        ? `تم ${operationNames[options.operationType]} باستخدام Gemini AI مع حفظ البيانات`
        : `تم ${operationNames[options.operationType]} باستخدام Gemini AI (بدون حفظ)`;

      toast({
        title: "تم بنجاح!",
        description: operationMessage,
      });

      return data;

    } catch (error: any) {
      console.error('Image processing error:', error);
      
      let errorMessage = "حدث خطأ أثناء معالجة الصور";
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = "يرجى تسجيل الدخول أولاً";
      } else if (error.message?.includes('API_KEY_INVALID')) {
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

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة رفع الصورة إلى IMGBB
  const uploadImage = async (imageBase64: string, fileName?: string) => {
    return processImages({
      operationType: 'image-upload',
      imageBase64,
      fileName
    });
  };

  // وظائف مساعدة لكل نوع عملية
  const editImage = async (
    imageBase64: string, 
    prompt: string, 
    imageStyle: string = 'realistic',
    projectTitle?: string
  ) => {
    return processImages({
      operationType: 'image-editing',
      images: [imageBase64],
      prompt,
      imageStyle,
      projectTitle
    });
  };

  const mergeImages = async (
    firstImageBase64: string,
    secondImageBase64: string,
    prompt: string,
    projectTitle?: string
  ) => {
    return processImages({
      operationType: 'image-merging',
      images: [firstImageBase64, secondImageBase64],
      prompt,
      projectTitle
    });
  };

  const removeBackground = async (
    imageBase64: string,
    customPrompt?: string,
    projectTitle?: string
  ) => {
    return processImages({
      operationType: 'background-removal',
      images: [imageBase64],
      prompt: customPrompt || "Remove the background from this image completely, keeping only the main subject. Make the background transparent.",
      projectTitle
    });
  };

  const analyzeImage = async (
    imageBase64: string,
    prompt: string,
    analysisType: string = 'elements',
    projectTitle?: string
  ) => {
    return processImages({
      operationType: 'image-analysis',
      images: [imageBase64],
      prompt,
      analysisType,
      projectTitle
    });
  };

  return {
    isProcessing,
    processImages,
    uploadImage,
    editImage,
    mergeImages,
    removeBackground,
    analyzeImage
  };
};

// دالة مساعدة لتحويل الملف إلى base64
export const fileToBase64 = (file: File): Promise<string> => {
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