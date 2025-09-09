import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Settings, RefreshCw, Key, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiKeyManager } from '@/lib/api-key-rotation';
import { useToast } from '@/hooks/use-toast';

interface KeyStat {
  index: number;
  key: string;
  usage: number;
  errors: number;
  lastUsed: number;
  isValid: boolean;
  isCurrent: boolean;
}

export const APIKeyStatus: React.FC = () => {
  const [keyStats, setKeyStats] = useState<KeyStat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // تحديث الإحصائيات
  const refreshStats = () => {
    const stats = apiKeyManager.getKeyStats();
    setKeyStats(stats);
  };

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // إعادة تعيين إحصائيات مفتاح واحد
  const resetKeyStats = (index: number) => {
    const key = keyStats[index];
    if (key) {
      // تحويل المفتاح المختصر إلى المفتاح الكامل
      const fullKey = apiKeyManager['apiKeys'][index];
      apiKeyManager.resetKeyStats(fullKey);
      refreshStats();
      
      toast({
        title: "تم إعادة التعيين",
        description: `تم إعادة تعيين إحصائيات المفتاح ${key.key}`,
      });
    }
  };

  // إعادة تعيين جميع الإحصائيات
  const resetAllStats = () => {
    apiKeyManager.resetAll();
    refreshStats();
    
    toast({
      title: "تم إعادة التعيين الكامل",
      description: "تم إعادة تعيين جميع إحصائيات المفاتيح",
    });
  };

  // حساب الإحصائيات العامة
  const totalKeys = keyStats.length;
  const validKeys = keyStats.filter(k => k.isValid).length;
  const totalUsage = keyStats.reduce((sum, k) => sum + k.usage, 0);
  const totalErrors = keyStats.reduce((sum, k) => sum + k.errors, 0);
  const currentKeyIndex = keyStats.findIndex(k => k.isCurrent);

  // تحديد لون الحالة
  const getStatusColor = (key: KeyStat) => {
    if (!key.isValid) return 'destructive';
    if (key.errors > 2) return 'secondary';
    return 'default';
  };

  // تنسيق الوقت
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'لم يُستخدم';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} يوم مضى`;
    if (hours > 0) return `${hours} ساعة مضت`;
    if (minutes > 0) return `${minutes} دقيقة مضت`;
    return 'الآن';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="arabic-text">
          <Settings className="w-4 h-4 mr-2" />
          حالة المفاتيح
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="arabic-text flex items-center gap-2">
            <Key className="w-5 h-5" />
            إحصائيات تدوير المفاتيح
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalKeys}</div>
                <p className="text-sm text-muted-foreground arabic-text">إجمالي المفاتيح</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{validKeys}</div>
                <p className="text-sm text-muted-foreground arabic-text">مفاتيح صالحة</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalUsage}</div>
                <p className="text-sm text-muted-foreground arabic-text">إجمالي الاستخدام</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
                <p className="text-sm text-muted-foreground arabic-text">إجمالي الأخطاء</p>
              </CardContent>
            </Card>
          </div>

          {/* المفتاح الحالي */}
          {currentKeyIndex >= 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg arabic-text flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  المفتاح النشط حالياً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {keyStats[currentKeyIndex].key}
                    </code>
                    <p className="text-sm text-muted-foreground mt-1 arabic-text">
                      الاستخدام: {keyStats[currentKeyIndex].usage} | الأخطاء: {keyStats[currentKeyIndex].errors}
                    </p>
                  </div>
                  <Badge variant="default" className="arabic-text">نشط</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار التحكم */}
          <div className="flex gap-2 justify-end">
            <Button onClick={refreshStats} variant="outline" size="sm" className="arabic-text">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
            <Button onClick={resetAllStats} variant="destructive" size="sm" className="arabic-text">
              <AlertTriangle className="w-4 h-4 mr-2" />
              إعادة تعيين الكل
            </Button>
          </div>

          {/* قائمة المفاتيح */}
          <div className="space-y-3">
            <h3 className="font-semibold arabic-text">تفاصيل المفاتيح</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {keyStats.map((key, index) => (
                <Card key={index} className={key.isCurrent ? 'border-primary/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusColor(key)} className="arabic-text">
                            {key.isValid ? 'صالح' : 'غير صالح'}
                          </Badge>
                          {key.isCurrent && (
                            <Badge variant="default" className="arabic-text">نشط</Badge>
                          )}
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {key.key}
                          </code>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground arabic-text">الاستخدام</p>
                            <div className="flex items-center gap-2">
                              <Progress value={(key.usage / 100) * 100} className="h-2 flex-1" />
                              <span className="font-medium">{key.usage}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground arabic-text">الأخطاء</p>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${key.errors > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                              <span className="font-medium">{key.errors}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground arabic-text">آخر استخدام</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium arabic-text">{formatTime(key.lastUsed)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => resetKeyStats(index)}
                        variant="ghost"
                        size="sm"
                        className="arabic-text"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        إعادة تعيين
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};