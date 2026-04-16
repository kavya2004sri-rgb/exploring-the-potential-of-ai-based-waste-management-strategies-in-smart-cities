import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/routes";
import { useCreateListing } from "@/hooks/use-listings";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Enhance schema for form validation
const formSchema = insertListingSchema.extend({
  price: z.coerce.number().min(0, "Price must be positive"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

// Location picker component - now updates form values automatically
function LocationPicker({ 
  position, 
  setPosition,
  setAddress,
  form,
  getAddressFromCoordinates
}: { 
  position: [number, number], 
  setPosition: (pos: [number, number]) => void,
  setAddress: (addr: string) => void,
  form: any,
  getAddressFromCoordinates: (lat: number, lng: number) => Promise<string>
}) {
  useMapEvents({
    click: async (e: L.LeafletMouseEvent) => {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      
      // Get actual address from clicked coordinates
      const actualAddress = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
      
      // Automatically update form values when location changes
      form.setValue("latitude", e.latlng.lat);
      form.setValue("longitude", e.latlng.lng);
      form.setValue("location", { 
        lat: e.latlng.lat, 
        lng: e.latlng.lng, 
        address: actualAddress 
      });
      
      // Update address display
      setAddress(actualAddress);
    },
  });

  return <Marker position={position} />;
}

// Component to recenter map when position changes
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, 13);
  }, [position, map]);
  
  return null;
}

export default function CreateListing() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateListing();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [mapPosition, setMapPosition] = useState<[number, number]>([51.505, -0.09]);
  const [address, setAddress] = useState("London, UK");
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        // Build a readable address from the components
        const parts = [];
        if (data.address.road || data.address.neighbourhood) {
          parts.push(data.address.road || data.address.neighbourhood);
        }
        if (data.address.suburb || data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.suburb || data.address.city || data.address.town || data.address.village);
        }
        if (data.address.state) {
          parts.push(data.address.state);
        }
        if (data.address.country) {
          parts.push(data.address.country);
        }
        
        return parts.length > 0 ? parts.join(", ") : data.display_name;
      }
      return data.display_name || "Selected Location";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Selected Location";
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Plastic",
      unit: "kg",
      latitude: 51.505,
      longitude: -0.09,
      location: { lat: 51.505, lng: -0.09, address: "London, UK" },
      images: [],
      status: "available"
    }
  });

  // Automatically get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition: [number, number] = [latitude, longitude];
          setMapPosition(newPosition);
          
          // Get actual address from coordinates
          const actualAddress = await getAddressFromCoordinates(latitude, longitude);
          setAddress(actualAddress);
          
          // Update form default values
          form.setValue("latitude", latitude);
          form.setValue("longitude", longitude);
          form.setValue("location", { lat: latitude, lng: longitude, address: actualAddress });
          
          setLoadingLocation(false);
          
          toast({
            title: "Location detected",
            description: `Your location has been set to ${actualAddress}`,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
          toast({
            title: "Location access denied",
            description: "Using default location. Click on the map to set your location.",
            variant: "destructive"
          });
        }
      );
    } else {
      setLoadingLocation(false);
      toast({
        title: "Geolocation not supported",
        description: "Click on the map to set your location.",
        variant: "destructive"
      });
    }
  }, [form, toast]);

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
    const submissionData = {
      ...data,
      latitude: mapPosition[0],
      longitude: mapPosition[1],
      location: { lat: mapPosition[0], lng: mapPosition[1], address },
      images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80"]
    };
    
    createMutation.mutate(submissionData, {
      onSuccess: () => {
        toast({
          title: "Listing Created!",
          description: "Your waste listing has been published successfully.",
        });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create listing. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Create Listing</h1>
        <p className="text-muted-foreground mt-1">Post your waste materials for sale</p>
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
                <Input type="number" id="quantity" {...form.register("quantity")} />
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
                  <img key={i} src={img} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input 
              placeholder="Enter address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {loadingLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting your location...</span>
              </div>
            )}
            <div className="h-64 w-full rounded-xl overflow-hidden border border-border shadow-sm">
              <MapContainer 
                center={mapPosition} 
                zoom={13} 
                scrollWheelZoom={true} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker 
                  position={mapPosition} 
                  setPosition={setMapPosition}
                  setAddress={setAddress}
                  form={form}
                  getAddressFromCoordinates={getAddressFromCoordinates}
                />
                <MapUpdater position={mapPosition} />
              </MapContainer>
            </div>
            <p className="text-xs text-muted-foreground">Click on the map to set your location</p>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              <strong>Error:</strong> {createMutation.error.message || "Failed to create listing"}
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
              ) : (
                "Publish Listing"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
