import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, LogOut, Menu, User, LayoutDashboard, Search, Camera, UserCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout.mutate();
  };

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
                <Leaf size={20} strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl text-foreground tracking-tight">
                Recycle<span className="text-primary">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/browse") ? "text-primary" : "text-muted-foreground"}`}>
              Browse
            </Link>
            
            {user ? (
              <>
                <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
                  Dashboard
                </Link>
                {user.role === "buyer" && (
                   <Link href="/identify" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/identify") ? "text-primary" : "text-muted-foreground"}`}>
                   AI Scan
                 </Link>
                )}
                <Link href="/profile" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}>
                  Profile
                </Link>
                <Link href="/performance" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/performance") ? "text-primary" : "text-muted-foreground"}`}>
                  Metrics
                </Link>
                <div className="w-px h-6 bg-border mx-2" />
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {user.username}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border p-4 space-y-4 shadow-xl">
          <Link href="/browse" className="block text-base font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
            Browse Listings
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-base font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
               {user.role === "buyer" && (
                   <Link href="/identify" className="block text-base font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
                   AI Identify Waste
                 </Link>
                )}
              <Link href="/profile" className="block text-base font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
              <Link href="/performance" className="block text-base font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
                Performance Metrics
              </Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="w-full text-left text-base font-medium text-destructive py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth" className="block w-full" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Sign In / Register</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
