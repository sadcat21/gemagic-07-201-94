// نظام تدوير المفاتيح الذكي لتجنب حدود الاستخدام
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
  private keyUsageCount: Map<string, number> = new Map();
  private keyErrorCount: Map<string, number> = new Map();
  private keyLastUsed: Map<string, number> = new Map();
  
  // حد الاستخدام لكل مفتاح (يمكن تعديله حسب حدود Google API)
  private readonly MAX_USAGE_PER_KEY = 100;
  private readonly MAX_ERRORS_PER_KEY = 5;
  private readonly COOLDOWN_PERIOD = 60 * 60 * 1000; // ساعة واحدة

  constructor() {
    // تهيئة العدادات
    this.apiKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.keyErrorCount.set(key, 0);
      this.keyLastUsed.set(key, 0);
    });
    
    // استعادة البيانات من localStorage إن توفرت
    this.loadFromStorage();
  }

  // حفظ البيانات في localStorage
  private saveToStorage() {
    try {
      const data = {
        currentKeyIndex: this.currentKeyIndex,
        keyUsageCount: Array.from(this.keyUsageCount.entries()),
        keyErrorCount: Array.from(this.keyErrorCount.entries()),
        keyLastUsed: Array.from(this.keyLastUsed.entries())
      };
      localStorage.setItem('api-key-rotation-data', JSON.stringify(data));
    } catch (error) {
      console.warn('فشل في حفظ بيانات تدوير المفاتيح:', error);
    }
  }

  // استعادة البيانات من localStorage
  private loadFromStorage() {
    try {
      const savedData = localStorage.getItem('api-key-rotation-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.currentKeyIndex = data.currentKeyIndex || 0;
        
        if (data.keyUsageCount) {
          this.keyUsageCount = new Map(data.keyUsageCount);
        }
        if (data.keyErrorCount) {
          this.keyErrorCount = new Map(data.keyErrorCount);
        }
        if (data.keyLastUsed) {
          this.keyLastUsed = new Map(data.keyLastUsed);
        }
      }
    } catch (error) {
      console.warn('فشل في استعادة بيانات تدوير المفاتيح:', error);
    }
  }

  // الحصول على المفتاح الحالي
  getCurrentKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    
    // تحديث وقت الاستخدام الأخير
    this.keyLastUsed.set(key, Date.now());
    
    // زيادة عداد الاستخدام
    const currentUsage = this.keyUsageCount.get(key) || 0;
    this.keyUsageCount.set(key, currentUsage + 1);
    
    this.saveToStorage();
    return key;
  }

  // التحقق من صحة المفتاح
  private isKeyValid(key: string): boolean {
    const now = Date.now();
    const lastUsed = this.keyLastUsed.get(key) || 0;
    const usage = this.keyUsageCount.get(key) || 0;
    const errors = this.keyErrorCount.get(key) || 0;
    
    // تحقق من فترة التهدئة
    const isInCooldown = (now - lastUsed) < this.COOLDOWN_PERIOD && usage >= this.MAX_USAGE_PER_KEY;
    
    // تحقق من عدد الأخطاء
    const hasTooManyErrors = errors >= this.MAX_ERRORS_PER_KEY;
    
    return !isInCooldown && !hasTooManyErrors;
  }

  // البحث عن المفتاح التالي المتاح
  private findNextValidKey(): string | null {
    const startIndex = this.currentKeyIndex;
    
    // تجربة جميع المفاتيح بداية من المفتاح الحالي
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (startIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      
      if (this.isKeyValid(key)) {
        this.currentKeyIndex = keyIndex;
        return key;
      }
    }
    
    return null;
  }

  // تسجيل خطأ في المفتاح والانتقال للتالي
  reportError(key: string, error: any): string | null {
    console.warn(`خطأ في المفتاح ${key.substring(0, 10)}...`, error);
    
    // زيادة عداد الأخطاء
    const currentErrors = this.keyErrorCount.get(key) || 0;
    this.keyErrorCount.set(key, currentErrors + 1);
    
    // إذا كان الخطأ متعلق بحد الاستخدام، أضف إلى عداد الاستخدام
    if (this.isQuotaError(error)) {
      const currentUsage = this.keyUsageCount.get(key) || 0;
      this.keyUsageCount.set(key, this.MAX_USAGE_PER_KEY); // تعيين الحد الأقصى
    }
    
    this.saveToStorage();
    
    // البحث عن مفتاح آخر متاح
    return this.findNextValidKey();
  }

  // فحص نوع الخطأ
  private isQuotaError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('quota') || 
           errorMessage.includes('limit') || 
           error?.status === 429 ||
           errorMessage.includes('resource_exhausted');
  }

  // تسجيل نجاح العملية
  reportSuccess(key: string) {
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
    this.saveToStorage();
  }

  // إعادة تعيين إحصائيات المفاتيح (يدوياً أو تلقائياً)
  resetKeyStats(key?: string) {
    if (key) {
      this.keyUsageCount.set(key, 0);
      this.keyErrorCount.set(key, 0);
      this.keyLastUsed.set(key, 0);
    } else {
      // إعادة تعيين جميع المفاتيح
      this.apiKeys.forEach(apiKey => {
        this.keyUsageCount.set(apiKey, 0);
        this.keyErrorCount.set(apiKey, 0);
        this.keyLastUsed.set(apiKey, 0);
      });
    }
    this.saveToStorage();
  }

  // الحصول على إحصائيات المفاتيح
  getKeyStats() {
    return this.apiKeys.map((key, index) => ({
      index,
      key: `${key.substring(0, 10)}...`,
      usage: this.keyUsageCount.get(key) || 0,
      errors: this.keyErrorCount.get(key) || 0,
      lastUsed: this.keyLastUsed.get(key) || 0,
      isValid: this.isKeyValid(key),
      isCurrent: index === this.currentKeyIndex
    }));
  }

  // إعادة تعيين كل شيء (في حالة الطوارئ)
  resetAll() {
    this.currentKeyIndex = 0;
    this.keyUsageCount.clear();
    this.keyErrorCount.clear();
    this.keyLastUsed.clear();
    
    this.apiKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.keyErrorCount.set(key, 0);
      this.keyLastUsed.set(key, 0);
    });
    
    localStorage.removeItem('api-key-rotation-data');
  }
}

// إنشاء instance وحيد للاستخدام في جميع أنحاء التطبيق
export const apiKeyManager = new APIKeyRotationManager();

// دالة مساعدة لتنفيذ API call مع تدوير تلقائي للمفاتيح
export async function makeAPICallWithRotation<T>(
  apiCall: (apiKey: string) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentKey = apiKeyManager.getCurrentKey();
    
    try {
      const result = await apiCall(currentKey);
      apiKeyManager.reportSuccess(currentKey);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`محاولة ${attempt + 1} فشلت مع المفتاح ${currentKey.substring(0, 10)}...`);
      
      // تسجيل الخطأ والحصول على مفتاح آخر
      const nextKey = apiKeyManager.reportError(currentKey, error);
      
      if (!nextKey) {
        console.error('لا توجد مفاتيح متاحة للاستخدام');
        break;
      }
      
      // انتظار قصير قبل المحاولة التالية
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError || new Error('فشل في تنفيذ API call مع جميع المفاتيح المتاحة');
}

export default apiKeyManager;