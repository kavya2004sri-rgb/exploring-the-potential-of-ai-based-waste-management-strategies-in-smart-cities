import { useAuth } from "@/hooks/use-auth";
import { useListings, useDeleteListing } from "@/hooks/use-listings";
import { useMyPurchases, useMySales, useUpdatePurchaseStatus } from "@/hooks/use-purchases";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Package, TrendingUp, DollarSign, Leaf, ShoppingCart, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: userListings } = useListings({ userId: user?.id });
  
  if (!user) return null;

  const activeListings = userListings?.filter(l => l.status === "available").length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {user.username}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.role === "seller" ? "Manage your waste listings and track impact." : "Track your sourcing and recycling impact."}
          </p>
        </div>
        
        {user.role === "seller" && (
          <Link href="/create-listing">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> New Listing
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatsCard 
          title="Total Recycled" 
          value="1,240 kg" 
          icon={<Leaf className="h-6 w-6" />}
          trend="12%"
          trendUp={true}
        />
        <StatsCard 
          title="Active Listings" 
          value={activeListings.toString()}
          icon={<Package className="h-6 w-6" />}
        />
        <StatsCard 
          title="Est. Savings" 
          value="₹4,250" 
          icon={<DollarSign className="h-6 w-6" />}
          trend="8%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {user.role === "seller" ? <SellerDashboard /> : <BuyerDashboard />}
        </div>

        {/* Sidebar / Chart */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm h-full">
            <h3 className="font-bold mb-6 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Impact Trends
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Jan', value: 400 },
                  { name: 'Feb', value: 300 },
                  { name: 'Mar', value: 600 },
                  { name: 'Apr', value: 800 },
                  { name: 'May', value: 500 },
                ]}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Monthly waste volume processed (kg)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerDashboard() {
  const { data: sales, isLoading: salesLoading } = useMySales();
  const updateStatusMutation = useUpdatePurchaseStatus();
  const { toast } = useToast();

  const handleStatusUpdate = (id: number, status: "ACCEPTED" | "REJECTED") => {
    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: status === "ACCEPTED" ? "Request Accepted" : "Request Rejected",
          description: `Purchase request has been ${status.toLowerCase()}.`,
        });
      },
    });
  };

  if (salesLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  const pendingRequests = sales?.filter((s: any) => s.status === "PENDING") || [];
  const acceptedRequests = sales?.filter((s: any) => s.status === "ACCEPTED") || [];
  const allRequests = sales || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Pending Purchase Requests
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((purchase: any) => (
                  <div key={purchase.id} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title || "Unknown Listing"}</h4>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {purchase.buyer?.username} | {purchase.buyer?.phone}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        PENDING
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium ml-2">{purchase.quantity} {purchase.listing?.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold ml-2 text-primary">₹{purchase.totalPrice}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(purchase.id, "ACCEPTED")}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(purchase.id, "REJECTED")}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Accepted Requests</h3>
            {acceptedRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No accepted requests</p>
            ) : (
              <div className="space-y-4">
                {acceptedRequests.map((purchase: any) => (
                  <div key={purchase.id} className="border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {purchase.buyer?.username}
                        </p>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-300">
                        ACCEPTED
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Quantity:</span> {purchase.quantity} {purchase.listing?.unit}</p>
                      <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{purchase.totalPrice}</span></p>
                      <p><span className="text-muted-foreground">Date:</span> {format(new Date(purchase.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">All Purchase Requests</h3>
            {allRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No purchase requests yet</p>
            ) : (
              <div className="space-y-4">
                {allRequests.map((purchase: any) => (
                  <div key={purchase.id} className="border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {purchase.buyer?.username}
                        </p>
                      </div>
                      <Badge 
                        className={
                          purchase.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                          purchase.status === "ACCEPTED" ? "bg-green-50 text-green-700 border-green-300" :
                          "bg-red-50 text-red-700 border-red-300"
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Quantity:</span> {purchase.quantity} {purchase.listing?.unit}</p>
                      <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{purchase.totalPrice}</span></p>
                      <p><span className="text-muted-foreground">Date:</span> {format(new Date(purchase.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SellerListings />
    </div>
  );
}

function SellerListings() {
  const { user } = useAuth();
  const { data: listings, isLoading } = useListings({ userId: user?.id });
  const deleteMutation = useDeleteListing();
  const { toast } = useToast();

  const handleDelete = (id: number, title: string) => {
    if(confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Listing Deleted",
            description: "The listing has been removed successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete listing. Please try again.",
            variant: "destructive",
          });
        }
      });
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border/50">
        <h3 className="font-bold text-lg">My Listings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-right py-3 px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {listings?.map((listing) => (
              <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-medium text-foreground">{listing.title}</div>
                  <div className="text-xs text-muted-foreground">{Number(listing.quantity)} {listing.unit}</div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {listing.category}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    listing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d, yyyy') : '-'}
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <Link href={`/edit-listing/${listing.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(listing.id, listing.title)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No listings yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}

function BuyerDashboard() {
  const { data: purchases, isLoading } = useMyPurchases();

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  const acceptedPurchases = purchases?.filter((p: any) => p.status === "ACCEPTED") || [];
  const rejectedPurchases = purchases?.filter((p: any) => p.status === "REJECTED") || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accepted">
            Accepted ({acceptedPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({purchases?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accepted">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-green-700">Accepted Requests</h3>
            {acceptedPurchases.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No accepted requests</p>
            ) : (
              <div className="space-y-4">
                {acceptedPurchases.map((purchase: any) => (
                  <div key={purchase.id} className="border border-green-200 bg-green-50/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seller: {purchase.seller?.username} | {purchase.seller?.phone}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        ACCEPTED
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1 mb-3">
                      <p><span className="text-muted-foreground">Quantity:</span> {purchase.quantity} {purchase.listing?.unit}</p>
                      <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{purchase.totalPrice}</span></p>
                      <p><span className="text-muted-foreground">Date:</span> {format(new Date(purchase.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <a 
                      href={`https://wa.me/${purchase.seller?.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Package className="h-4 w-4" />
                      Contact Seller on WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-red-700">Rejected Requests</h3>
            {rejectedPurchases.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rejected requests</p>
            ) : (
              <div className="space-y-4">
                {rejectedPurchases.map((purchase: any) => (
                  <div key={purchase.id} className="border border-red-200 bg-red-50/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seller: {purchase.seller?.username}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        REJECTED
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Quantity:</span> {purchase.quantity} {purchase.listing?.unit}</p>
                      <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{purchase.totalPrice}</span></p>
                      <p><span className="text-muted-foreground">Date:</span> {format(new Date(purchase.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">All Purchase Requests</h3>
            {!purchases || purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No purchase requests yet</p>
                <Link href="/browse">
                  <Button>
                    Browse Listings
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase: any) => (
                  <div key={purchase.id} className="border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{purchase.listing?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seller: {purchase.seller?.username}
                        </p>
                      </div>
                      <Badge 
                        className={
                          purchase.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                          purchase.status === "ACCEPTED" ? "bg-green-50 text-green-700 border-green-300" :
                          "bg-red-50 text-red-700 border-red-300"
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Quantity:</span> {purchase.quantity} {purchase.listing?.unit}</p>
                      <p><span className="text-muted-foreground">Total:</span> <span className="font-bold">₹{purchase.totalPrice}</span></p>
                      <p><span className="text-muted-foreground">Date:</span> {format(new Date(purchase.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
