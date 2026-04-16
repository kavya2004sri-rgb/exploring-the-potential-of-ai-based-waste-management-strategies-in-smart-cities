import { useAuth } from "@/hooks/use-auth";
import { useListings } from "@/hooks/use-listings";
import { useMyPurchases, useMySales } from "@/hooks/use-purchases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Calendar, Package, ShoppingCart, 
  TrendingUp, DollarSign, CheckCircle, Clock, XCircle,
  Edit2, Save, X as XIcon, Loader2
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const { data: listings } = useListings();
  const { data: purchases } = useMyPurchases();
  const { data: sales } = useMySales();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const { toast } = useToast();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
        <Link href="/auth">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  const isSeller = user.role === "seller";
  const userListings = listings?.filter(l => l.sellerId === user.id) || [];
  const activeListings = userListings.filter(l => l.status === "available").length;
  const soldListings = userListings.filter(l => l.status === "sold").length;

  // Calculate statistics
  const totalListingsValue = userListings.reduce((sum, l) => sum + Number(l.price), 0);
  const totalPurchasesValue = purchases?.reduce((sum, p) => sum + Number(p.totalPrice), 0) || 0;
  const totalSalesValue = sales?.reduce((sum, s) => sum + Number(s.totalPrice), 0) || 0;
  
  const pendingPurchases = purchases?.filter(p => p.status === "PENDING").length || 0;
  const acceptedPurchases = purchases?.filter(p => p.status === "ACCEPTED").length || 0;
  const rejectedPurchases = purchases?.filter(p => p.status === "REJECTED").length || 0;

  const pendingSales = sales?.filter(s => s.status === "PENDING").length || 0;
  const acceptedSales = sales?.filter(s => s.status === "ACCEPTED").length || 0;

  const handleSaveProfile = async () => {
    // TODO: Implement update profile endpoint
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {user.username}
              </h1>
              <Badge variant={isSeller ? "default" : "secondary"} className="text-sm">
                {isSeller ? "Seller" : "Buyer"}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              Member since {format(new Date(user.createdAt || Date.now()), "MMMM yyyy")}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSeller ? (
                <>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-primary">{userListings.length}</div>
                    <div className="text-sm text-muted-foreground">Total Listings</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-green-600">₹{totalSalesValue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-blue-600">{acceptedSales}</div>
                    <div className="text-sm text-muted-foreground">Completed Sales</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-primary">{purchases?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-green-600">₹{totalPurchasesValue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-blue-600">{acceptedPurchases}</div>
                    <div className="text-sm text-muted-foreground">Accepted Requests</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(false)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSaveProfile}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input value={user.username} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={isEditing ? editData.email : user.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={isEditing ? editData.phone : user.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <Input
                  value={format(new Date(user.createdAt || Date.now()), "PPP")}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your activity overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSeller ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Active Listings</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{activeListings}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium">Sold Items</span>
                    </div>
                    <span className="text-lg font-bold text-gray-600">{soldListings}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Pending Requests</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{pendingSales}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">₹{totalSalesValue.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{pendingPurchases}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Accepted</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{acceptedPurchases}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium">Rejected</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{rejectedPurchases}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Total Spent</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">₹{totalPurchasesValue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent activity and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={isSeller ? "listings" : "purchases"} className="w-full">
                <TabsList className={`grid w-full ${isSeller ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {isSeller ? (
                    <>
                      <TabsTrigger value="listings">
                        <Package className="h-4 w-4 mr-2" />
                        My Listings ({userListings.length})
                      </TabsTrigger>
                      <TabsTrigger value="sales">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sales ({sales?.length || 0})
                      </TabsTrigger>
                    </>
                  ) : (
                    <TabsTrigger value="purchases">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase History ({purchases?.length || 0})
                    </TabsTrigger>
                  )}
                </TabsList>

                {isSeller ? (
                  <>
                    <TabsContent value="listings" className="space-y-4 mt-4">
                      {userListings.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No listings yet</p>
                          <Link href="/create-listing">
                            <Button>Create Your First Listing</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                          {userListings.map((listing) => (
                            <div
                              key={listing.id}
                              className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start gap-4">
                                {listing.images?.[0] && (
                                  <img
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-bold">{listing.title}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {listing.category} • {Number(listing.quantity)} {listing.unit}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={listing.status === "available" ? "default" : "secondary"}
                                    >
                                      {listing.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {format(new Date(listing.createdAt || Date.now()), "MMM d, yyyy")}
                                    </span>
                                    <span className="font-bold text-primary">₹{Number(listing.price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4 mt-4">
                      {!sales || sales.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No sales yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                          {sales.map((sale: any) => (
                            <div
                              key={sale.id}
                              className="border border-border rounded-xl p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold">{sale.listing?.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Buyer: {sale.buyer?.username}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    sale.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                    sale.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                                    "bg-red-100 text-red-700"
                                  }
                                >
                                  {sale.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {sale.quantity} {sale.listing?.unit} • {format(new Date(sale.createdAt), "MMM d, yyyy")}
                                </span>
                                <span className="font-bold text-primary">₹{sale.totalPrice}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </>
                ) : (
                  <TabsContent value="purchases" className="space-y-4 mt-4">
                    {!purchases || purchases.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No purchase requests yet</p>
                        <Link href="/browse">
                          <Button>Browse Listings</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {purchases.map((purchase: any) => (
                          <div
                            key={purchase.id}
                            className="border border-border rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold">{purchase.listing?.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Seller: {purchase.seller?.username}
                                </p>
                              </div>
                              <Badge
                                className={
                                  purchase.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                  purchase.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                                  "bg-red-100 text-red-700"
                                }
                              >
                                {purchase.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {purchase.quantity} {purchase.listing?.unit} • {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                              </span>
                              <span className="font-bold text-primary">₹{purchase.totalPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
