import { SimplifiedImageEditor } from "@/components/simplified-image-editor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold arabic-text mb-4 holographic-text">
            محرر الصور بالذكاء الاصطناعي
          </h1>
          <p className="text-xl text-muted-foreground arabic-text">
            تحرير ودمج الصور بتقنيات الذكاء الاصطناعي المتطورة
          </p>
        </div>
        
        <SimplifiedImageEditor />
      </div>
    </div>
  );
};

export default Index;
