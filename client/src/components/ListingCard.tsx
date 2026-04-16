import { Link } from "wouter";
import { type Listing } from "@shared/schema";
import { MapPin, Tag, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ListingCard({ listing }: { listing: Listing }) {
  // Parse location safely
  const location = listing.location as { address: string } | undefined;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-muted">
        {listing.images?.[0] ? (
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
            <Box size={40} className="opacity-20" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-primary shadow-sm">
          {listing.status.toUpperCase()}
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {listing.category}
          </span>
          <span className="flex items-center text-xs text-muted-foreground">
            <MapPin size={12} className="mr-1" />
            {location?.address || "Location unavailable"}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">{listing.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
          {listing.description}
        </p>
        
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Quantity</p>
            <p className="font-semibold text-foreground">
              {Number(listing.quantity)} {listing.unit}
            </p>
          </div>
          <div className="text-right">
             <p className="text-xs text-muted-foreground font-medium">Price</p>
             <p className="font-bold text-primary text-lg">
               ₹{Number(listing.price)}
             </p>
          </div>
        </div>
        
        <Link href={`/listings/${listing.id}`} className="mt-4 w-full">
          <Button variant="outline" className="w-full hover:bg-primary hover:text-white hover:border-primary transition-colors">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
