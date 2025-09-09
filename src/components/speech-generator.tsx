import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Volume2, Plus, Mic, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenAI } from '@google/genai';
import { ModernAudioPlayer } from './modern-audio-player';
import { makeAPICallWithRotation, apiKeyManager } from '@/lib/api-key-rotation';

interface Speaker {
  name: string;
  voice: string;
  gender: 'male' | 'female';
}

// دالة تحويل PCM إلى WAV لضمان التوافق مع المتصفحات
const createWavFile = (pcmData: Uint8Array, sampleRate: number, channels: number, bitDepth: number): ArrayBuffer => {
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bitDepth / 8, true);
  view.setUint16(32, channels * bitDepth / 8, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Copy PCM data
  const uint8View = new Uint8Array(buffer, 44);
  uint8View.set(pcmData);

  return buffer;
};

export const SpeechGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [singleVoice, setSingleVoice] = useState('Kore');
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { name: 'أحمد', voice: 'Kore', gender: 'male' },
    { name: 'فاطمة', voice: 'Puck', gender: 'female' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('single');
  const [textPrompt, setTextPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const { toast } = useToast();

  // قائمة الأصوات المتاحة مصنفة حسب الجنس (تم تصحيح التصنيف)
  const maleVoices = [
    { value: 'Kore', label: 'Kore - حازم (ذكر)' },
    { value: 'Charon', label: 'Charon - إعلامي (ذكر)' },
    { value: 'Fenrir', label: 'Fenrir - متحمس (ذكر)' },
    { value: 'Orus', label: 'Orus - حازم (ذكر)' },
    { value: 'Enceladus', label: 'Enceladus - متنفس (ذكر)' },
    { value: 'Iapetus', label: 'Iapetus - واضح (ذكر)' },
    { value: 'Umbriel', label: 'Umbriel - هادئ (ذكر)' },
    { value: 'Algenib', label: 'Algenib - خشن (ذكر)' },
    { value: 'Rasalgethi', label: 'Rasalgethi - إعلامي (ذكر)' },
    { value: 'Achernar', label: 'Achernar - ناعم (ذكر)' },
    { value: 'Alnilam', label: 'Alnilam - حازم (ذكر)' },
    { value: 'Schedar', label: 'Schedar - متوازن (ذكر)' },
    { value: 'Gacrux', label: 'Gacrux - ناضج (ذكر)' },
    { value: 'Achird', label: 'Achird - ودود (ذكر)' },
    { value: 'Zubenelgenubi', label: 'Zubenelgenubi - غير رسمي (ذكر)' },
    { value: 'Sadaltager', label: 'Sadaltager - متعلم (ذكر)' }
  ];

  const femaleVoices = [
    { value: 'Puck', label: 'Puck - متفائلة (أنثى)' },
    { value: 'Zephyr', label: 'Zephyr - مشرقة (أنثى)' },
    { value: 'Leda', label: 'Leda - شبابية (أنثى)' },
    { value: 'Aoede', label: 'Aoede - منعشة (أنثى)' },
    { value: 'Callirrhoe', label: 'Callirrhoe - هادئة (أنثى)' },
    { value: 'Autonoe', label: 'Autonoe - مشرقة (أنثى)' },
    { value: 'Algieba', label: 'Algieba - ناعمة (أنثى)' },
    { value: 'Despina', label: 'Despina - ناعمة (أنثى)' },
    { value: 'Erinome', label: 'Erinome - واضحة (أنثى)' },
    { value: 'Laomedeia', label: 'Laomedeia - متفائلة (أنثى)' },
    { value: 'Pulcherrima', label: 'Pulcherrima - مباشرة (أنثى)' },
    { value: 'Vindemiatrix', label: 'Vindemiatrix - لطيفة (أنثى)' },
    { value: 'Sadachbia', label: 'Sadachbia - حيوية (أنثى)' },
    { value: 'Sulafat', label: 'Sulafat - دافئة (أنثى)' }
  ];

  const allVoices = [...maleVoices, ...femaleVoices];

  // توليد النص باستخدام Gemini API
  const generateTextContent = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وصف للنص المراد توليده",
        variant: "destructive",
      });
      return;
    }


    setIsGeneratingText(true);

    try {
      // استخدام نظام تدوير المفاتيح لتوليد النص
      const generatedText = await makeAPICallWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        let prompt;
        if (currentTab === 'single') {
          prompt = `قم بكتابة نص باللغة العربية حسب الوصف التالي: ${textPrompt}`;
        } else {
          prompt = `قم بكتابة محادثة باللغة العربية بين ${speakers.map(s => s.name).join(' و ')} حسب الوصف التالي: ${textPrompt}
          
          تأكد من تنسيق المحادثة بالشكل التالي:
          ${speakers[0].name}: [النص الأول]
          ${speakers[1].name}: [النص الثاني]
          ${speakers[0].name}: [النص الثالث]
          وهكذا...`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ parts: [{ text: prompt }] }]
        });

        const result = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!result) {
          throw new Error('لم يتم إرجاع نص');
        }
        return result;
      });
      
      if (generatedText) {
        setText(generatedText);
        
        toast({
          title: "تم التوليد!",
          description: "تم توليد النص بنجاح",
        });
      } else {
        throw new Error('لم يتم إرجاع نص');
      }

    } catch (error: any) {
      console.error('خطأ في توليد النص:', error);
      
      let errorMessage = "حدث خطأ أثناء توليد النص";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = "مفتاح API غير صحيح";
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = "تم تجاوز حد الاستخدام";
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج";
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingText(false);
    }
  };

  // توليد النص وتحويله إلى كلام مباشرة
  const generateAndSpeak = async () => {
    await generateTextContent();
    // سيتم تحويل النص تلقائياً بعد التوليد
    if (text.trim()) {
      setTimeout(() => generateSpeech(), 1000);
    }
  };

  // تحويل الصوت باستخدام Gemini API
  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال النص المراد تحويله إلى كلام",
        variant: "destructive",
      });
      return;
    }


    setIsGenerating(true);

    try {
      // استخدام النموذج الصحيح لتحويل النص إلى كلام
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`;
      
      let requestBody;

      if (currentTab === 'single') {
        // تحويل صوت واحد
        requestBody = {
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { 
                  voiceName: singleVoice 
                }
              }
            }
          }
        };
      } else {
        // تحويل متعدد الأصوات
        const speakerVoiceConfigs = speakers.map(speaker => ({
          speaker: speaker.name,
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName: speaker.voice 
            }
          }
        }));

        requestBody = {
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs
              }
            }
          }
        };
      }

      console.log('إرسال طلب تحويل النص إلى كلام:', requestBody);

      // استخدام نظام تدوير المفاتيح لتحويل النص إلى كلام
      const data = await makeAPICallWithRotation(async (apiKey) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('خطأ في الاستجابة:', errorData);
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        return await response.json();
      });

      console.log('استجابة API:', data);

      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        // تحويل base64 إلى blob وإنشاء URL للمتصفح  
        try {
          // تحويل البيانات المشفرة base64 إلى ArrayBuffer
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // تحويل PCM إلى WAV لضمان التوافق مع المتصفحات
          const wavBuffer = createWavFile(bytes, 24000, 1, 16);
          const blob = new Blob([wavBuffer], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(blob);
          
          setGeneratedAudio(audioUrl);
          
          toast({
            title: "تم الإنشاء!",
            description: "تم تحويل النص إلى كلام بنجاح",
          });

          console.log('تم إنشاء الملف الصوتي بنجاح');
        } catch (conversionError) {
          console.error('خطأ في تحويل البيانات الصوتية:', conversionError);
          throw new Error('فشل في تحويل البيانات الصوتية');
        }
      } else {
        console.error('لا توجد بيانات صوتية في الاستجابة:', data);
        throw new Error('لم يتم إرجاع بيانات صوتية من الخدمة');
      }

    } catch (error: any) {
      console.error('خطأ في تحويل النص إلى كلام:', error);
      
      let errorMessage = "حدث خطأ أثناء تحويل النص إلى كلام";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = "مفتاح API غير صحيح";
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = "تم تجاوز حد الاستخدام";
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = "ليس لديك صلاحية لاستخدام هذا النموذج";
      } else if (error.message?.includes('SAFETY')) {
        errorMessage = "المحتوى لا يتوافق مع سياسات الأمان";
      } else if (error.message?.includes('modality')) {
        errorMessage = "النموذج المحدد لا يدعم تحويل النص إلى كلام";
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

  // تحميل الملف الصوتي
  const downloadAudio = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = 'speech-output.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // إضافة متحدث جديد
  const addSpeaker = () => {
    const newSpeaker: Speaker = {
      name: `متحدث ${speakers.length + 1}`,
      voice: 'Kore',
      gender: 'male'
    };
    setSpeakers([...speakers, newSpeaker]);
  };

  // حذف متحدث
  const removeSpeaker = (index: number) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter((_, i) => i !== index));
    }
  };

  // تحديث بيانات متحدث
  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const updatedSpeakers = [...speakers];
    
    if (field === 'gender') {
      const genderValue = value as 'male' | 'female';
      updatedSpeakers[index].gender = genderValue;
      // عند تغيير الجنس، قم بتحديث الصوت ليتطابق مع الجنس المحدد
      const defaultVoice = genderValue === 'male' ? 'Kore' : 'Puck';
      updatedSpeakers[index].voice = defaultVoice;
    } else {
      updatedSpeakers[index][field] = value;
    }
    
    setSpeakers(updatedSpeakers);
  };

  // فحص التطابق بين الاسم والجنس
  const detectNameGender = (name: string): 'male' | 'female' => {
    const maleNames = ['أحمد', 'محمد', 'علي', 'حسن', 'خالد', 'يوسف', 'عبدالله', 'سعد', 'فهد', 'عمر', 'سالم', 'ناصر', 'حمد', 'زياد', 'طارق'];
    const femaleNames = ['فاطمة', 'عائشة', 'خديجة', 'مريم', 'زينب', 'سارة', 'نورا', 'هند', 'رقية', 'آمنة', 'حفصة', 'جميلة', 'ليلى', 'أسماء', 'رانيا'];
    
    if (maleNames.some(maleName => name.includes(maleName))) {
      return 'male';
    } else if (femaleNames.some(femaleName => name.includes(femaleName))) {
      return 'female';
    }
    
    // إذا لم يتم التعرف على الاسم، اعتماد على الصوت المحدد
    return 'male'; // افتراضي
  };

  // فحص التطابق والتحذير
  const checkGenderVoiceMatch = (speaker: Speaker): boolean => {
    const detectedGender = detectNameGender(speaker.name);
    const voiceGender = maleVoices.some(v => v.value === speaker.voice) ? 'male' : 'female';
    
    return detectedGender === voiceGender || speaker.gender === voiceGender;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold holographic-text arabic-text">
          مولد الكلام من النص
        </h2>
        <p className="text-lg text-muted-foreground arabic-text max-w-2xl mx-auto">
          حول النصوص إلى كلام طبيعي باستخدام تقنية Gemini AI المتقدمة
        </p>
      </div>

      {/* API Key Status */}
      <Card className="ai-card">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Mic className="w-5 h-5" />
            حالة نظام المفاتيح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground arabic-text">
              يتم استخدام نظام تدوير المفاتيح التلقائي لضمان عدم انقطاع الخدمة
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 arabic-text">نظام المفاتيح نشط</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="ai-card">
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            تحويل النص إلى كلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="arabic-text">
                صوت واحد
              </TabsTrigger>
              <TabsTrigger value="multi" className="arabic-text">
                أصوات متعددة
              </TabsTrigger>
            </TabsList>

            {/* توليد النص باستخدام Gemini */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-5 h-5" />
                  توليد النص بالذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-prompt" className="arabic-text">
                    وصف النص المراد توليده
                  </Label>
                  <Textarea
                    id="text-prompt"
                    placeholder={currentTab === 'single' 
                      ? "اكتب وصفاً للنص المراد توليده مثل: اكتب قصة قصيرة عن الصداقة"
                      : `اكتب وصفاً للمحادثة المراد توليدها مثل: محادثة بين ${speakers.map(s => s.name).join(' و ')} حول أهمية التعليم`
                    }
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="min-h-[80px] arabic-text"
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={generateTextContent} 
                    disabled={isGeneratingText || !textPrompt.trim()}
                    variant="outline"
                    className="arabic-text"
                  >
                    {isGeneratingText ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التوليد...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 ml-2" />
                        توليد النص
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={generateAndSpeak} 
                    disabled={isGeneratingText || isGenerating || !textPrompt.trim()}
                    className="arabic-text"
                  >
                    {isGeneratingText || isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 ml-2" />
                        توليد وتحويل لكلام
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground arabic-text">
                  <strong>نصيحة:</strong> كن واضحاً ومحدداً في وصف النص أو المحادثة المراد توليدها للحصول على أفضل النتائج
                </p>
              </CardContent>
            </Card>

            {/* النص المراد تحويله */}
            <div className="space-y-2">
              <Label htmlFor="text" className="arabic-text">النص</Label>
              <Textarea
                id="text"
                placeholder={currentTab === 'single' 
                  ? "أدخل النص المراد تحويله إلى كلام هنا..."
                  : "أدخل محادثة بتنسيق:\nأحمد: مرحبا، كيف حالك؟\nفاطمة: بخير، شكرا لك"
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] arabic-text"
                dir="rtl"
              />
            </div>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-2">
                <Label className="arabic-text">اختر الصوت</Label>
                <Select value={singleVoice} onValueChange={setSingleVoice}>
                  <SelectTrigger className="arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allVoices.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value} className="arabic-text">
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="multi" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="arabic-text">المتحدثون</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpeaker}
                    disabled={speakers.length >= 2}
                    className="arabic-text"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة متحدث
                  </Button>
                </div>

                {speakers.map((speaker, index) => {
                  const isGenderMismatch = !checkGenderVoiceMatch(speaker);
                  
                  return (
                    <div key={index} className={`grid grid-cols-3 gap-4 p-4 border rounded-lg ${isGenderMismatch ? 'border-destructive bg-destructive/5' : ''}`}>
                      <div className="space-y-2">
                        <Label className="arabic-text">اسم المتحدث</Label>
                        <Input
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                          className="arabic-text"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="arabic-text">الجنس</Label>
                        <Select 
                          value={speaker.gender} 
                          onValueChange={(value) => updateSpeaker(index, 'gender', value)}
                        >
                          <SelectTrigger className="arabic-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male" className="arabic-text">ذكر</SelectItem>
                            <SelectItem value="female" className="arabic-text">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="arabic-text">الصوت</Label>
                        <Select 
                          value={speaker.voice} 
                          onValueChange={(value) => updateSpeaker(index, 'voice', value)}
                        >
                          <SelectTrigger className="arabic-text">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>أصوات ذكورية</SelectLabel>
                              {maleVoices.map((voice) => (
                                <SelectItem key={voice.value} value={voice.value} className="arabic-text">
                                  {voice.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>أصوات نسائية</SelectLabel>
                              {femaleVoices.map((voice) => (
                                <SelectItem key={voice.value} value={voice.value} className="arabic-text">
                                  {voice.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {isGenderMismatch && (
                        <div className="col-span-3 p-3 bg-destructive/10 border border-destructive rounded-md">
                          <p className="text-sm text-destructive arabic-text">
                            ⚠️ تحذير: يبدو أن هناك عدم تطابق بين الاسم والصوت المحدد. يُنصح بمراجعة الجنس والصوت المحدد.
                          </p>
                        </div>
                      )}
                      {speakers.length > 1 && (
                        <div className="col-span-3">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSpeaker(index)}
                            className="arabic-text"
                          >
                            حذف المتحدث
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground arabic-text">
                    <strong>نصائح مهمة:</strong>
                    <br />
                    • تأكد من تطابق الجنس مع الصوت المحدد لتجنب التناقض
                    <br />
                    • استخدم أسماء المتحدثين في النص مثل: "أحمد: مرحبا، كيف حالك اليوم؟"
                    <br />
                    • الأصوات الذكورية تناسب الأسماء الذكورية والعكس صحيح
                    <br />
                    • يمكنك تغيير الجنس لتحديث الصوت تلقائياً
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* أزرار التحكم */}
            <div className="flex gap-4">
              <Button 
                onClick={generateSpeech} 
                disabled={isGenerating || !text.trim()}
                className="flex-1 bg-gradient-to-r from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90 transition-all duration-300 hover-scale"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحويل...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 ml-2" />
                    تحويل إلى كلام
                  </>
                )}
              </Button>
            </div>

            {/* مشغل الصوت العصري */}
            <div className="space-y-2">
              <Label className="arabic-text">الصوت المُنتج</Label>
              <ModernAudioPlayer 
                audioSrc={generatedAudio}
                onDownload={downloadAudio}
              />
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card className="ai-card">
        <CardHeader>
          <CardTitle className="arabic-text">معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground arabic-text space-y-2">
            <p><strong>الأصوات المدعومة:</strong> 30 صوت مختلف بخصائص متنوعة</p>
            <p><strong>اللغات المدعومة:</strong> 24 لغة بما في ذلك العربية</p>
            <p><strong>حد النص:</strong> 32,000 رمز كحد أقصى</p>
            <p><strong>تنسيق الإخراج:</strong> ملف WAV عالي الجودة</p>
            <p><strong>الأصوات المتعددة:</strong> حتى متحدثين في المحادثة الواحدة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};