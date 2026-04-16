import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/routes";
import { useListing, useUpdateListing } from "@/hooks/use-listings";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, MapPin, ArrowLeft } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Enhance schema for form validation
const formSchema = insertListingSchema.extend({
  price: z.coerce.number().min(0, "Price must be positive"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditListing() {
  const [, params] = useRoute("/edit-listing/:id");
  const id = parseInt(params?.id || "0");
  const { data: listing, isLoading: loadingListing } = useListing(id);
  const [, setLocation] = useLocation();
  const updateMutation = useUpdateListing();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Plastic",
      unit: "kg",
      location: { lat: 51.505, lng: -0.09, address: "London, UK" },
      images: [],
      status: "available"
    }
  });

  // Populate form when listing loads
  useEffect(() => {
    if (listing) {
      const imageArray = Array.isArray(listing.images) ? listing.images : [];
      form.reset({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        quantity: Number(listing.quantity),
        unit: listing.unit,
        price: Number(listing.price),
        location: listing.location as any,
        images: imageArray,
        status: listing.status as "available" | "sold"
      });
      setImages(imageArray);
    }
  }, [listing, form]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const url = await uploadImage(file);
        setImages(prev => {
          const newImages = [...prev, url];
          form.setValue("images", newImages);
          return newImages;
        });
      }
      toast({
        title: "Image Uploaded",
        description: `${acceptedFiles.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [form, toast]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const onSubmit = (data: FormValues) => {
    const location = data.location as { lat: number; lng: number; address: string };
    
    const submissionData = {
      ...data,
      latitude: listing?.latitude || location?.lat || 0,
      longitude: listing?.longitude || location?.lng || 0,
      images: images.length > 0 ? images : listing?.images || []
    };
    
    console.log("Submitting update with data:", submissionData);
    
    updateMutation.mutate({ id, data: submissionData }, {
      onSuccess: () => {
        toast({
          title: "Listing Updated!",
          description: "Your waste listing has been updated successfully.",
        });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        console.error("Update error:", error);
        const errorMsg = error.message || "Failed to update listing. Please try again.";
        
        // If unauthorized or forbidden, redirect to login
        if (errorMsg.includes("log in") || errorMsg.includes("Unauthorized")) {
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          setTimeout(() => setLocation("/auth"), 2000);
        } else if (errorMsg.includes("own listings") || errorMsg.includes("another seller")) {
          toast({
            title: "Access Denied",
            description: errorMsg,
            variant: "destructive",
          });
          setTimeout(() => setLocation("/dashboard"), 2000);
        } else {
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    });
  };

  if (loadingListing) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Listing not found</p>
        <Link href="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Edit Listing</h1>
        <p className="text-muted-foreground mt-1">Update your waste material listing</p>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., Recycled PET Bottles" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category" 
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("category")}
              >
                {["Plastic", "Glass", "Metal", "Paper", "Electronics", "Textile"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" id="quantity" {...form.register("quantity")} />
                <select 
                  className="w-24 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  {...form.register("unit")}
                >
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="units">units</option>
                </select>
              </div>
              {form.formState.errors.quantity && <p className="text-destructive text-sm">{form.formState.errors.quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="price">Price (INR)</Label>
             <Input type="number" step="0.01" id="price" placeholder="Enter price in ₹" {...form.register("price")} />
             {form.formState.errors.price && <p className="text-destructive text-sm">{form.formState.errors.price.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the condition and source of the waste..." 
              className="min-h-[120px]"
              {...form.register("description")} 
            />
            {form.formState.errors.description && <p className="text-destructive text-sm">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <div {...getRootProps()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-secondary/30 transition-colors">
              <input {...getInputProps()} disabled={uploading} />
              {uploading ? (
                <>
                  <Loader2 className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop images here, or click to select</p>
                </>
              )}
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = images.filter((_, idx) => idx !== i);
                        setImages(newImages);
                        form.setValue("images", newImages);
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select 
              id="status" 
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              {...form.register("status")}
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* Location Mock */}
          <div className="p-4 bg-muted/30 rounded-xl flex items-center gap-3 text-sm text-muted-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Location: {(listing.location as any).address || "London, UK"}</span>
          </div>

          {updateMutation.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              <strong>Error:</strong> {updateMutation.error.message || "Failed to update listing"}
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12 text-base font-semibold" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...</>
              ) : (
                "Update Listing"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
