import { ImageEditor } from "@/components/image-editor";
import { APIImageEditor } from "@/components/api-image-editor";
import AudioUnderstanding from "@/components/audio-understanding";
import { ImageUnderstanding } from "@/components/image-understanding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold arabic-text mb-4 holographic-text">
            أدوات الذكاء الاصطناعي
          </h1>
          <p className="text-xl text-muted-foreground arabic-text">
            تحرير وفهم الصور وتحليل الصوت بتقنيات الذكاء الاصطناعي المتطورة
          </p>
        </div>
        
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14 bg-gradient-card border-accent shadow-elegant">
            <TabsTrigger 
              value="image" 
              className="arabic-text text-lg font-semibold py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-smooth"
            >
              تحرير الصور
            </TabsTrigger>
            <TabsTrigger 
              value="api-editor" 
              className="arabic-text text-lg font-semibold py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-smooth"
            >
              API محرر
            </TabsTrigger>
            <TabsTrigger 
              value="understanding" 
              className="arabic-text text-lg font-semibold py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-smooth"
            >
              فهم الصور
            </TabsTrigger>
            <TabsTrigger 
              value="audio" 
              className="arabic-text text-lg font-semibold py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-smooth"
            >
              فهم الصوت
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="mt-0">
            <ImageEditor />
          </TabsContent>
          <TabsContent value="api-editor" className="mt-0">
            <APIImageEditor />
          </TabsContent>
          <TabsContent value="understanding" className="mt-0">
            <ImageUnderstanding />
          </TabsContent>
          <TabsContent value="audio" className="mt-0">
            <AudioUnderstanding />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
