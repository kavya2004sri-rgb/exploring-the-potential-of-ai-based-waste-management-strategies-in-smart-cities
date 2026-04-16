import { useIdentifyWaste } from "@/hooks/use-ai";
import { useDropzone } from "react-dropzone";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function IdentifyWaste() {
  const [image, setImage] = useState<string | null>(null);
  const identifyMutation = useIdentifyWaste();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    maxFiles: 1 
  });

  const handleIdentify = () => {
    if (image) {
      identifyMutation.mutate(image);
    }
  };

  const handleReset = () => {
    setImage(null);
    identifyMutation.reset();
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-4">
          <Camera className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">AI Waste Identifier</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Upload a photo of your waste material. Our AI will analyze it, identify the material type, and suggest how to recycle it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="border-2 border-dashed border-border shadow-none bg-secondary/20 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            {!image ? (
              <div 
                {...getRootProps()} 
                className={`flex-grow flex flex-col items-center justify-center p-10 min-h-[300px] cursor-pointer transition-colors ${
                  isDragActive ? "bg-primary/5 border-primary" : "hover:bg-muted"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                   <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium text-lg mb-1">Drop image here</p>
                <p className="text-sm text-muted-foreground text-center">
                  or click to upload from your device
                </p>
              </div>
            ) : (
              <div className="relative h-full min-h-[300px] bg-black">
                <img 
                  src={image} 
                  alt="Uploaded waste" 
                  className="w-full h-full object-contain absolute inset-0" 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-4 right-4 shadow-lg"
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                >
                  Change Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!identifyMutation.data && !identifyMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8"
              >
                <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                <p className="text-muted-foreground mb-6">
                  Upload an image to start the analysis process.
                </p>
                <Button 
                  onClick={handleIdentify} 
                  disabled={!image} 
                  size="lg"
                  className="w-full max-w-xs shadow-xl shadow-primary/20"
                >
                  Analyze Material
                </Button>
              </motion.div>
            )}

            {identifyMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-bold mb-2">Analyzing Image...</h3>
                <p className="text-muted-foreground">Identifying material composition and recycling category.</p>
              </motion.div>
            )}

            {identifyMutation.data && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-bold text-xl">Identification Complete</h3>
                    <p className="text-sm text-muted-foreground">Confidence: {Math.round(identifyMutation.data.confidence * 100)}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Material</span>
                    <p className="text-2xl font-display font-bold text-primary">{identifyMutation.data.material}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</span>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                      {identifyMutation.data.category}
                    </span>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-xl text-sm leading-relaxed text-muted-foreground">
                    {identifyMutation.data.description}
                  </div>

                  <div className="pt-4">
                    <Button className="w-full" variant="outline">
                      Search Marketplace for {identifyMutation.data.material}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {identifyMutation.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center"
              >
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <h3 className="font-bold text-destructive mb-1">Analysis Failed</h3>
                <p className="text-sm text-destructive/80 mb-4">{identifyMutation.error.message}</p>
                <Button onClick={handleIdentify} variant="outline" className="border-destructive/30 hover:bg-destructive/10">Try Again</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
