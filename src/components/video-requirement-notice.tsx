import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from './ui/button';

export const VideoRequirementNotice: React.FC = () => {
  return (
    <Card className="bg-gradient-card shadow-elegant border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 arabic-text text-primary">
          <AlertTriangle className="w-5 h-5" />
          متطلبات استخدام نموذج Veo 3
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground arabic-text space-y-2">
          <p>
            نموذج Veo 3 من Google يتطلب المتطلبات التالية للعمل:
          </p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>حساب Google Cloud Platform مفعل</li>
            <li>تفعيل الفوترة (Billing) في GCP</li>
            <li>تفعيل Vertex AI API</li>
            <li>رصيد كافي لاستخدام النموذج</li>
          </ul>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 arabic-text flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            تكلفة الاستخدام:
          </h4>
          <p className="text-sm text-muted-foreground arabic-text">
            إنشاء فيديو واحد بطول 8 ثوان يكلف تقريباً $0.60 - $1.20 حسب جودة الفيديو والمحتوى.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="arabic-text"
            onClick={() => window.open('https://cloud.google.com/vertex-ai', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            تعلم المزيد عن Vertex AI
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="arabic-text"
            onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            إعداد الفوترة في GCP
          </Button>
        </div>

        <div className="text-xs text-muted-foreground arabic-text bg-muted/20 p-3 rounded">
          💡 <strong>نصيحة:</strong> يمكنك البدء بحساب Google Cloud مجاني يتضمن $300 رصيد للتجربة.
        </div>
      </CardContent>
    </Card>
  );
};