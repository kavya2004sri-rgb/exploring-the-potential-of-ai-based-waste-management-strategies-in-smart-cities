import { useListing } from "@/hooks/use-listings";
import { useCreateInquiry } from "@/hooks/use-inquiries";
import { useCreatePurchase } from "@/hooks/use-purchases";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MapPin, Calendar, Send, User, Mail, Phone, Navigation, MessageCircle, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
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

// Component to fit map bounds
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  map.fitBounds(bounds);
  return null;
}

export default function ListingDetail() {
  const [, params] = useRoute("/listings/:id");
  const id = parseInt(params?.id || "0");
  const { data: listing, isLoading } = useListing(id);
  const { user } = useAuth();
  const inquiryMutation = useCreateInquiry();
  const purchaseMutation = useCreatePurchase();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [buyerLocation, setBuyerLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  if (!listing) return <div className="container py-20 text-center">Listing not found</div>;

  const location = listing.location as { lat: number; lng: number; address: string };
  const sellerLat = listing.latitude || location.lat;
  const sellerLng = listing.longitude || location.lng;

  const handleContact = () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to contact sellers.", variant: "destructive" });
      return;
    }
    
    inquiryMutation.mutate({
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId: user.id,
      message
    }, {
      onSuccess: () => {
        toast({ title: "Inquiry Sent!", description: "The seller has been notified." });
        setMessage("");
      }
    });
  };

  const handlePurchaseRequest = () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to make purchase requests.", variant: "destructive" });
      return;
    }

    const quantity = Number(purchaseQuantity) || Number(listing.quantity);
    
    if (quantity <= 0 || isNaN(quantity)) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid quantity.", variant: "destructive" });
      return;
    }

    if (quantity > Number(listing.quantity)) {
      toast({ title: "Invalid Quantity", description: `Maximum available quantity is ${listing.quantity} ${listing.unit}.`, variant: "destructive" });
      return;
    }
    
    purchaseMutation.mutate({
      listingId: listing.id,
      quantity,
    }, {
      onSuccess: () => {
        toast({ title: "Purchase Request Sent!", description: "The seller will review your request." });
        setPurchaseQuantity("");
      },
      onError: (error: any) => {
        console.error("Purchase request error:", error);
        const errorMessage = error?.message || "Failed to send purchase request. Please try again.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const getRoute = async () => {
    setLoadingRoute(true);
    try {
      // Get buyer's location using browser geolocation
      if (!buyerLocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const buyerLat = position.coords.latitude;
        const buyerLng = position.coords.longitude;
        setBuyerLocation([buyerLat, buyerLng]);

        // Call OSRM routing API
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${buyerLng},${buyerLat};${sellerLng},${sellerLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          const coordinates: [number, number][] = routeData.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          setRoute(coordinates);
          setDistance(routeData.distance / 1000);
          setDuration(routeData.duration / 60);
          toast({ title: "Route Found!", description: `Distance: ${(routeData.distance / 1000).toFixed(2)} km` });
        }
      } else {
        // Already have buyer location, just recalculate route
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${buyerLocation[1]},${buyerLocation[0]};${sellerLng},${sellerLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0];
          const coordinates: [number, number][] = routeData.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          setRoute(coordinates);
          setDistance(routeData.distance / 1000);
          setDuration(routeData.duration / 60);
          toast({ title: "Route Found!", description: `Distance: ${(routeData.distance / 1000).toFixed(2)} km` });
        }
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to get route. Please enable location access.", 
        variant: "destructive" 
      });
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image & Map Column */}
        <div className="space-y-8">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-border/50 h-[400px] relative bg-muted">
            {listing.images?.[0] ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">No Image</div>
            )}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm">
              {listing.category}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Location</h3>
              <Button 
                onClick={getRoute} 
                disabled={loadingRoute}
                variant="outline"
                size="sm"
              >
                {loadingRoute ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                ) : (
                  <><Navigation className="h-4 w-4 mr-2" /> Get Route</>
                )}
              </Button>
            </div>
            <div className="flex items-center text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              {location.address}
            </div>
            {distance && duration && (
              <div className="flex gap-4 p-3 bg-primary/10 rounded-xl text-sm">
                <div>
                  <span className="font-bold text-primary">{distance.toFixed(2)} km</span>
                  <span className="text-muted-foreground ml-1">distance</span>
                </div>
                <div className="border-l border-border pl-4">
                  <span className="font-bold text-primary">{Math.round(duration)} min</span>
                  <span className="text-muted-foreground ml-1">estimated time</span>
                </div>
              </div>
            )}
            <div className="h-80 w-full rounded-2xl overflow-hidden border border-border shadow-sm">
              <MapContainer 
                center={[sellerLat, sellerLng]} 
                zoom={13} 
                scrollWheelZoom={true} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[sellerLat, sellerLng]} />
                
                {buyerLocation && (
                  <Marker position={buyerLocation} />
                )}
                
                {route && (
                  <Polyline positions={route} color="blue" weight={4} opacity={0.7} />
                )}
                
                {buyerLocation && route && (
                  <FitBounds bounds={[buyerLocation, [sellerLat, sellerLng]]} />
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">{listing.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                {Number(listing.quantity)} {listing.unit}
              </span>
              <span className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                ₹{Number(listing.price)} total
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Posted {new Date(listing.createdAt || "").toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="prose prose-stone max-w-none">
            <h3 className="text-lg font-bold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Seller Information</h3>
            {(listing as any).seller && (
              <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-3 text-primary" />
                  <span className="font-medium">{(listing as any).seller.username}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-3 text-primary" />
                  <span className="text-muted-foreground">{(listing as any).seller.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MessageCircle className="h-4 w-4 mr-3 text-green-600" />
                  <a 
                    href={`https://wa.me/${(listing as any).seller.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 font-medium transition-colors underline flex items-center gap-1"
                  >
                    WhatsApp: {(listing as any).seller.phone}
                  </a>
                </div>
              </div>
            )}
            
            {/* Quick Contact Section */}
            {(listing as any).seller && user?.id !== listing.sellerId && (
              <div className="mb-6">
                <a 
                  href={`https://wa.me/${(listing as any).seller.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-900">Contact on WhatsApp</div>
                        <div className="text-xs text-green-700">{(listing as any).seller.phone}</div>
                      </div>
                    </div>
                    <div className="text-green-600 font-bold">
                      →
                    </div>
                  </div>
                </a>
              </div>
            )}
            
            {/* Purchase Request Section */}
            {user?.id !== listing.sellerId && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Make Purchase Request
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Quantity ({listing.unit})</label>
                    <Input
                      type="number"
                      placeholder={`Max: ${listing.quantity} ${listing.unit}`}
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(e.target.value)}
                      max={Number(listing.quantity)}
                      min={1}
                    />
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Price per {listing.unit}:</span>
                      <span className="font-medium">₹{(Number(listing.price) / Number(listing.quantity)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">
                        ₹{((Number(purchaseQuantity) || Number(listing.quantity)) * (Number(listing.price) / Number(listing.quantity))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={handlePurchaseRequest}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={purchaseMutation.isPending}
                  >
                    {purchaseMutation.isPending ? (
                      <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Sending...</>
                    ) : (
                      <><ShoppingCart className="mr-2 h-4 w-4" /> Send Purchase Request</>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <h4 className="font-bold mb-3">Send Inquiry</h4>
            {user?.id === listing.sellerId ? (
              <div className="p-4 bg-secondary/50 rounded-xl text-center text-muted-foreground">
                This is your listing.
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea 
                  placeholder="Hi, I'm interested in this material. Is it still available?" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleContact} 
                  className="w-full"
                  disabled={inquiryMutation.isPending || !message}
                >
                  {inquiryMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Inquiry
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
