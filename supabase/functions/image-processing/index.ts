import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenAI, Modality } from 'https://esm.sh/@google/genai@1.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// نظام تدوير المفاتيح المحسن
class APIKeyRotationManager {
  private readonly apiKeys: string[] = [
    "AIzaSyCoE0wSdHRAVvjU6Dllx6XmxMAMG409sSk",
    "AIzaSyDqGwN1PbfdH1lMPd_PM-h-nUlbVvDT-1U",
    "AIzaSyAHMJKhRgLbgOLXhUHWdea6hhsn1cuuW6U",
    "AIzaSyDL4YJrqxqsvvi_kGg0q0GdrEQbOKCt_oI",
    "AIzaSyCl1LfzT-uRryPFF4nujkvjBVHCXalyzgY",
    "AIzaSyCGLL88zVZjJtzod4Z-ONvFXKZiGVM3Wm4",
    "AIzaSyBrlikXYs8kgzvzZmc69R3waQdcOGI08qI",
    "AIzaSyCdU4U-dW8Tfe9763CO0AL1u2WLFj0zNu8",
    "AIzaSyCjlGbUV5K7PhZvJY7Mmehx7PH-juxmxn0",
    "AIzaSyCmZivJpY6e9WJQRc80NH1P0fHcjJNZy80",
    "AIzaSyB-pMGCSj9yzjsM1hN24CmzsKWHBS0rNJ8",
    "AIzaSyBDiCnl8l17wkFmrl3dV56dKm16DQElaC0",
    "AIzaSyDJcPPoJKtwltBAB5TzskaN0hUIIi3nszU",
    "AIzaSyA-uzh4RA0Sb4k1NmNqE_fpIX2YHvBy-KI",
    "AIzaSyAchPA9UJhTVrivthVY7eQtAm5udJ8ilxA",
    "AIzaSyDxRdDIYa9KSQwP2BJFA1bvshe3_OWKPRs",
    "AIzaSyDnFbX3IOQiCRncMMMD5PcCiaDzV1DGqBM",
    "AIzaSyDNgCnIo5yoU7RTIh7jyDmXQBk60Iirw5U",
    "AIzaSyDKF5PszBk0iNsUjRrEBgby4jFmbia1C44",
    "AIzaSyCHIHwj3i_WM3HXpI8XwAodrBBMPj5SbXQ",
    "AIzaSyBZok28uf_cZsCknA3N7yUcYtDmznRvUG0",
    "AIzaSyD51vrO0vj4-WKANNgbzrbJPh7nPnPhsMM",
    "AIzaSyCLqikA8e0gJ-4gTLH4QG8uaBT4hPW6HSU",
    "AIzaSyD5JsmtJdOFOxn0zY6HYYwy95VmzGUmNt8",
    "AIzaSyAujZ8JJXkOkMyZ373RfcTZVjmFCuiM40k",
    "AIzaSyAy2Ks8NBoVCtZ6vFwNpsdnYEDSZ-o1jq0",
    "AIzaSyDFu3ZVPw2mJtkelci3carHUO0MKJgmHPY",
    "AIzaSyD9XuFuht-FoLRBUGidQgqG3mnm546rJYs",
    "AIzaSyDTSm9MoPs91UCWYYp7qy76qyUgzdh3VXc",
    "AIzaSyDxOpke9DTgOAnNBQtP7rGNKdytrkd-gic",
    "AIzaSyCt1ZpRTlLKaHt-KJNTTnMXw0guEQxaCzE",
    "AIzaSyApe06sM6hxjIXWv-u1xLmEe9T49ylNPTI",
    "AIzaSyD-gvwPST_CP0eq2Ko_RxLpFrA8c_x5fgk",
    "AIzaSyBfMoI2j4e6cyVNtLU6obD2xSdBKsEUlTs",
    "AIzaSyBQY7Cx8XdXkkqom_p6lquZStQruTKSjd4",
    "AIzaSyA4sHW6glV2wb48vxMQbFwjVMCwwAdRe1c",
    "AIzaSyArcW9zlcdsPTH1XIYHrYOylx6HRhm8NnI",
    "AIzaSyA5t9GAiOUjTOvxijKrn_vxeOQSMy8eeBA",
    "AIzaSyBExKGbK3BvqpfFKKmJLtl2rc95aLwTk5w",
    "AIzaSyAgJ2pAptikvr8eQOp0YoCdh9UjEN25y30",
    "AIzaSyA98CEjjkPE67yo01kISeu-1qgIiDb_AdE",
    "AIzaSyA8h0agTWehKe6HXGdsTnWy35vi5NGeNjg",
    "AIzaSyCrTjVaiJMSeqGuftBRO5tFtqd8yk2bq2g",
    "AIzaSyBnhsvLxvJWMad9bSixPVNTRyLQJTsszW4",
    "AIzaSyDOmH26pxAMSdsTCFUgo9cqExhZZfllwyo",
    "AIzaSyB0Rm5BvD1iirhChwg2uALtT7X5JADjRr4"
  ];

  private currentKeyIndex: number = 0;
  private readonly failedKeys: Set<string> = new Set();
  private readonly lastUsedTime: Map<string, number> = new Map();
  private readonly cooldownPeriod: number = 30000; // 30 ثانية

  getNextApiKey(): string {
    const availableKeys = this.apiKeys.filter(key => !this.failedKeys.has(key));
    
    if (availableKeys.length === 0) {
      this.resetFailedKeys();
      return this.apiKeys[0];
    }

    const now = Date.now();
    
    // البحث عن مفتاح متاح لم يُستخدم مؤخراً
    for (let i = 0; i < availableKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % availableKeys.length;
      const key = availableKeys[keyIndex];
      const lastUsed = this.lastUsedTime.get(key) || 0;
      
      if (now - lastUsed >= this.cooldownPeriod) {
        this.currentKeyIndex = (keyIndex + 1) % availableKeys.length;
        this.lastUsedTime.set(key, now);
        console.log(`استخدام المفتاح رقم ${this.apiKeys.indexOf(key) + 1} من ${this.apiKeys.length}`);
        return key;
      }
    }

    // إذا لم نجد مفتاح متاح، استخدم التالي في الترتيب
    const nextKey = availableKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % availableKeys.length;
    this.lastUsedTime.set(nextKey, now);
    return nextKey;
  }

  markKeyAsFailed(apiKey: string, error: any): void {
    const msg = error && (error.message || error.error?.message) || "";
    
    if (msg.includes("QUOTA_EXCEEDED") || msg.includes("429") || error?.status === 429) {
      console.log(`تم تعطيل المفتاح مؤقتاً: ${apiKey.substring(0, 20)}...`);
      this.failedKeys.add(apiKey);
      
      // إعادة تفعيل المفتاح بعد ساعة
      setTimeout(() => {
        this.failedKeys.delete(apiKey);
        console.log(`تم إعادة تفعيل المفتاح: ${apiKey.substring(0, 20)}...`);
      }, 3600000); // ساعة واحدة
    }
  }

  resetFailedKeys(): void {
    this.failedKeys.clear();
    console.log("تم إعادة تعيين جميع المفاتيح المعطلة");
  }

  async makeRequestWithRotation<T>(
    requestFn: (apiKey: string) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiKey = this.getNextApiKey();
      
      try {
        const result = await requestFn(apiKey);
        return result;
      } catch (error) {
        console.error(`فشل الطلب مع المفتاح ${apiKey.substring(0, 20)}... (المحاولة ${attempt + 1}):`, error);
        this.markKeyAsFailed(apiKey, error);
        lastError = error;
        
        const msg = error && (error.message || error.error?.message) || "";
        if (!msg.includes("QUOTA_EXCEEDED") && !msg.includes("429") && error?.status !== 429) {
          throw error;
        }
      }
    }
    
    throw lastError;
  }
}

const keyManager = new APIKeyRotationManager();

// IMGBB API key
const IMGBB_API_KEY = "c9aeeb2c2e029f20a23564c192fd5764";

// رفع الصورة إلى IMGBB
async function uploadImageToImgBB(imageBase64: string, name?: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageBase64);
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`IMGBB API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('فشل في رفع الصورة إلى IMGBB');
    }

    console.log('تم رفع الصورة بنجاح إلى IMGBB:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('خطأ في رفع الصورة إلى IMGBB:', error);
    throw error;
  }
}

// تحويل data URL إلى base64 فقط
function extractBase64FromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
}

// إضافة نوع عملية رفع الصورة
interface UploadImageRequest {
  operationType: 'image-upload';
  imageBase64: string;
  fileName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for DB and auth client to read JWT if present
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    );

    // قراءة المستخدم من التوكن إذا تم إرساله
    let user = null;
    try {
      const { data: authData } = await authClient.auth.getUser();
      user = authData.user;
    } catch (error) {
      console.log('No authenticated user, proceeding as anonymous');
    }

    const requestBody = await req.json();
    console.log('Received request:', {
      operationType: requestBody.operationType,
      hasImages: !!requestBody.images,
      hasPrompt: !!requestBody.prompt
    });

    const { 
      operationType, 
      images, 
      prompt, 
      projectTitle, 
      imageStyle,
      analysisType,
      imageBase64,
      fileName
    } = requestBody;

    // إن لم يكن المستخدم مسجلاً، نفذ المعالجة دون حفظ في قاعدة البيانات
    if (!user) {
      let result;
      switch (operationType) {
        case 'image-upload':
          result = await uploadImageToImgBB(imageBase64, fileName);
          return new Response(
            JSON.stringify({ success: true, imageUrl: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        case 'image-editing':
          result = await processImageEditingWithImgBB(images[0], prompt, imageStyle);
          break;
        case 'image-merging':
          result = await processImageMerging(images[0], images[1], prompt);
          break;
        case 'background-removal':
          result = await processBackgroundRemoval(images[0], prompt);
          break;
        case 'image-analysis':
          result = await processImageAnalysis(images[0], prompt, analysisType);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operationType}`);
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إذا كان هناك مستخدم، نحفظ كل شيء في قاعدة البيانات
    const { data: project, error: projectError } = await db
      .from('image_projects')
      .insert({
        user_id: user.id,
        title: projectTitle || `${operationType} - ${new Date().toISOString()}`,
        description: prompt,
        project_type: operationType,
        status: 'active'
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    console.log('Created project:', project.id);

    // إنشاء عملية معالجة
    const { data: operation, error: operationError } = await db
      .from('image_operations')
      .insert({
        project_id: project.id,
        operation_type: operationType,
        prompt_text: prompt,
        original_image_url: images?.[0] ? 'uploaded' : null,
        operation_settings: {
          imageStyle: imageStyle,
          analysisType: analysisType,
          imageCount: images?.length || 0
        },
        status: 'processing'
      })
      .select()
      .single();

    if (operationError) {
      throw new Error(`Failed to create operation: ${operationError.message}`);
    }

    console.log('Created operation:', operation.id);

    // معالجة الطلب حسب النوع
    let result;
    
    switch (operationType) {
      case 'image-upload':
        result = { imageUrl: await uploadImageToImgBB(imageBase64, fileName) };
        break;
      case 'image-editing':
        result = await processImageEditingWithImgBB(images[0], prompt, imageStyle);
        break;
      case 'image-merging':
        result = await processImageMerging(images[0], images[1], prompt);
        break;
      case 'background-removal':
        result = await processBackgroundRemoval(images[0], prompt);
        break;
      case 'image-analysis':
        result = await processImageAnalysis(images[0], prompt, analysisType);
        break;
      default:
        throw new Error(`Unsupported operation type: ${operationType}`);
    }

    // تحديث حالة العملية
    const { error: updateError } = await db
      .from('image_operations')
      .update({
        status: 'completed',
        processed_image_url: result.imageUrl || null,
        completed_at: new Date().toISOString(),
        processing_time: Math.floor((Date.now() - new Date(operation.created_at).getTime()) / 1000)
      })
      .eq('id', operation.id);

    if (updateError) {
      console.error('Failed to update operation status:', updateError);
    }

    // حفظ تحليل الصورة إذا لزم الأمر
    if (result.analysisResults) {
      const { error: analysisError } = await db
        .from('image_analysis')
        .insert({
          operation_id: operation.id,
          analysis_type: analysisType || 'general',
          analysis_results: result.analysisResults,
          detected_elements: result.detectedElements || [],
          confidence_score: result.confidenceScore || null
        });

      if (analysisError) {
        console.error('Failed to save analysis:', analysisError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        projectId: project.id,
        operationId: operation.id,
        result: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-processing function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// وظيفة ترجمة النص إلى الإنجليزية مع تدوير المفاتيح المحسن
async function translatePrompt(arabicPrompt: string): Promise<string> {
  try {
    const result = await keyManager.makeRequestWithRotation(async (apiKey) => {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    });

    const translatedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || arabicPrompt;
    console.log('ترجمة النص:', { original: arabicPrompt, translated: translatedText });
    return translatedText;
  } catch (error) {
    console.error('خطأ في ترجمة النص:', error);
    return arabicPrompt;
  }
}

// وظيفة الحصول على نص النمط
function getStyleText(style: string): string {
  const styles: { [key: string]: string } = {
    'realistic': 'Make it photorealistic with natural lighting and details',
    'cartoon': 'Convert to cartoon style with bold colors and simplified shapes',
    'anime': 'Transform to anime/manga style with characteristic features',
    'oil-painting': 'Apply oil painting style with brush strokes and rich textures',
    'watercolor': 'Create watercolor painting effect with soft blending',
    'sketch': 'Convert to pencil sketch with line art style',
    'digital-art': 'Apply modern digital art style with vibrant colors',
    'vintage': 'Add vintage/retro effect with classic color tones',
    'modern': 'Apply contemporary modern art style',
    'minimalist': 'Create clean minimalist design with simple elements'
  };
  
  return styles[style] || styles['realistic'];
}

// معالجة تحرير الصور مع رفعها إلى IMGBB
async function processImageEditingWithImgBB(imageBase64: string, prompt: string, imageStyle?: string): Promise<any> {
  console.log('بدء معالجة طلب تحرير الصورة:', { prompt, style: imageStyle });
  
  // ترجمة النص
  const translatedPrompt = await translatePrompt(prompt);
  
  // إضافة معلومات النمط
  const styleText = getStyleText(imageStyle || 'realistic');
  const enhancedPrompt = `${translatedPrompt}. ${styleText}`;

  const result = await keyManager.makeRequestWithRotation(async (apiKey) => {
    // تنظيف base64 إذا لزم الأمر
    const cleanImageBase64 = extractBase64FromDataUrl(imageBase64);
    
    // التحقق من حجم الصورة
    if (cleanImageBase64.length > 5500000) {
      throw new Error('حجم الصورة كبير جداً. يرجى استخدام صورة أصغر من 4 ميجابايت');
    }

    console.log('إرسال الطلب إلى Gemini API...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Edit this image based on the following description: ${enhancedPrompt}`,
          }, {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanImageBase64,
            },
          }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('تم استلام الرد من Gemini API');

    // استخراج الصورة من الاستجابة
    const image = extractImageFromGemini(responseData);
    if (!image) {
      throw new Error('لم يتم العثور على صورة في رد Gemini API');
    }

    console.log('تم إنشاء الصورة بنجاح، جاري رفعها إلى IMGBB...');
    
    // رفع الصورة إلى IMGBB
    const imgbbUrl = await uploadImageToImgBB(image.imageData, `edited-image-${Date.now()}`);
    
    return {
      success: true,
      imageUrl: imgbbUrl,
      translatedPrompt,
      imageData: image.imageData,
      mimeType: image.mimeType
    };
  });

  return result;
}

// استخراج الصورة من استجابة Gemini
function extractImageFromGemini(data: any): { imageData: string; mimeType: string } | null {
  const candidates = data?.candidates || [];
  
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
  }
  
  return null;
}

// معالجة دمج الصور - محدثة حسب الكود العامل  
async function processImageMerging(firstImageBase64: string, secondImageBase64: string, prompt: string): Promise<any> {
  const translatedPrompt = await translatePrompt(prompt);

  const result = await keyManager.makeRequestWithRotation(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      { text: `IMPORTANT: Do not write any text or explanations on the generated image. Simply perform the requested image merging task. Merge these two images based on the following description: ${translatedPrompt}. Create a seamless, professional blend or composition of both images. Focus on visual integration without adding any textual descriptions to the final image.` },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: firstImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: secondImageBase64,
        },
      },
    ];

    console.log('إرسال طلب دمج الصور إلى Gemini API...');

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log('تم استلام رد دمج الصور من Gemini API');

    // استخراج الصورة من الاستجابة - نفس منطق الكود الناجح
    let imageGenerated = false;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        imageGenerated = true;
        console.log('تم دمج الصور بنجاح');
        
        return {
          imageUrl: `data:${mimeType};base64,${imageData}`,
          translatedPrompt
        };
      } else if (part.text) {
        console.log('نص الرد:', part.text);
      }
    }

    if (!imageGenerated) {
      throw new Error('لم يتم دمج الصور. يرجى تجربة وصف مختلف');
    }
  });

  return result;
}

// معالجة إزالة الخلفية - محدثة حسب الكود العامل
async function processBackgroundRemoval(imageBase64: string, customPrompt?: string): Promise<any> {
  const prompt = customPrompt || "Remove the background from this image completely, keeping only the main subject. Make the background transparent.";
  const translatedPrompt = await translatePrompt(prompt);

  const result = await keyManager.makeRequestWithRotation(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      { text: translatedPrompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ];

    console.log('إرسال طلب إزالة الخلفية إلى Gemini API...');

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    console.log('تم استلام رد إزالة الخلفية من Gemini API');

    // استخراج الصورة من الاستجابة - نفس منطق الكود الناجح
    let imageGenerated = false;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        imageGenerated = true;
        console.log('تم إزالة الخلفية بنجاح');
        
        return {
          imageUrl: `data:${mimeType};base64,${imageData}`,
          translatedPrompt
        };
      } else if (part.text) {
        console.log('نص الرد:', part.text);
      }
    }

    if (!imageGenerated) {
      throw new Error('لم يتم إزالة الخلفية. يرجى المحاولة مرة أخرى');
    }
  });

  return result;
}

// معالجة تحليل الصور
async function processImageAnalysis(imageBase64: string, prompt: string, analysisType: string): Promise<any> {
  const analysisPrompt = getPromptForAnalysisType(analysisType, prompt);

  const result = await keyManager.makeRequestWithRotation(async (apiKey) => {
    const requestBody: any = {
      contents: [{
        parts: [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          }
        ]
      }]
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No analysis results received');
    }

    // معالجة النتائج حسب نوع التحليل
    const processedResults = processAnalysisResults(analysisType, resultText);

    return {
      analysisResults: processedResults,
      detectedElements: processedResults.elements || [],
      confidenceScore: processedResults.confidence || null,
      rawText: resultText
    };
  });

  return result;
}


function getPromptForAnalysisType(type: string, customPrompt: string = ''): string {
  switch (type) {
    case 'elements':
      return 'حلل هذه الصورة بدقة وحدد العناصر والمناطق المختلفة بتفصيل دقيق. اذكر المناطق الجغرافية والعناصر الرئيسية والتفاصيل الدقيقة والعلاقات المكانية بين العناصر. أرجع كل عنصر في سطر منفصل باللغة العربية، مع تحديد موقعه بدقة، بدون أرقام أو نقاط.';
    
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
}

function processAnalysisResults(type: string, resultText: string): any {
  if (type === 'object-detection' || type === 'segmentation') {
    try {
      const cleanedText = resultText.replace(/```json\n?|\n?```/g, '');
      const jsonData = JSON.parse(cleanedText);
      return {
        objects: Array.isArray(jsonData) ? jsonData : [],
        type: type
      };
    } catch (error) {
      console.log('Failed to parse JSON, returning raw text');
      return { rawText: resultText, type: type };
    }
  } else if (type === 'elements') {
    const elements = resultText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    return {
      elements: elements,
      type: type
    };
  }
  
  return {
    text: resultText,
    type: type
  };
}