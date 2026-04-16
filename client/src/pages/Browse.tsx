import { useListings } from "@/hooks/use-listings";
import { ListingCard } from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Filter, Loader2, DollarSign, Package, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Map from "@/components/Map";

// Custom debounce hook for instant filter updates
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Browse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");

  // Debounce search and numeric inputs for better UX
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);
  const debouncedMinQty = useDebounce(minQuantity, 500);
  const debouncedMaxQty = useDebounce(maxQuantity, 500);
  
  const { data: listings, isLoading, error } = useListings({ 
    search: debouncedSearch, 
    category: category || undefined,
    minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
    maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
    minQuantity: debouncedMinQty ? Number(debouncedMinQty) : undefined,
    maxQuantity: debouncedMaxQty ? Number(debouncedMaxQty) : undefined,
  });

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (category) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (minQuantity) count++;
    if (maxQuantity) count++;
    return count;
  }, [category, minPrice, maxPrice, minQuantity, maxQuantity]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinQuantity("");
    setMaxQuantity("");
  };

  // Mock map data from listings
  const mapMarkers = listings?.map(l => ({
    id: l.id,
    lat: (l.location as any).lat || 51.505 + (Math.random() - 0.5) * 0.1,
    lng: (l.location as any).lng || -0.09 + (Math.random() - 0.5) * 0.1,
    title: l.title
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Browse available materials for recycling</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4">Categories</h3>
            <div className="space-y-2">
              {["Plastic", "Glass", "Metal", "Paper", "Electronics", "Textile"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Price Range
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min Price (₹)</Label>
                <Input 
                  id="minPrice"
                  type="number" 
                  min="0"
                  placeholder="0" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max Price (₹)</Label>
                <Input 
                  id="maxPrice"
                  type="number" 
                  min="0"
                  placeholder="Any" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Quantity Range
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="minQuantity" className="text-xs text-muted-foreground">Min Quantity</Label>
                <Input 
                  id="minQuantity"
                  type="number" 
                  min="0"
                  placeholder="0" 
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxQuantity" className="text-xs text-muted-foreground">Max Quantity</Label>
                <Input 
                  id="maxQuantity"
                  type="number" 
                  min="0"
                  placeholder="Any" 
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map View */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4">Nearby Listings</h3>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <Map markers={mapMarkers} />
            </div>
          </div>

          {/* Listings Grid */}
          <div>
            {/* Results Header */}
            {!isLoading && !error && listings && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
                  {(search || activeFilterCount > 0) && (
                    <span className="ml-2">
                      • Filters active
                    </span>
                  )}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading listings...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20 text-destructive">
                Error loading listings
              </div>
            ) : listings?.length === 0 ? (
              <div className="text-center py-20 bg-secondary/30 rounded-3xl border-2 border-dashed border-border">
                <h3 className="text-xl font-medium text-foreground">No listings found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms</p>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings?.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
