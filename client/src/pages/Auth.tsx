import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Leaf } from "lucide-react";

export default function AuthPage() {
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ username, password, email, phone, role });
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold">RecycleConnect</CardTitle>
          <CardDescription>Join the circular economy marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input id="login-username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="flex justify-end">
                  <Link href="/forgot-password">
                    <a className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </Link>
                </div>
                {login.error && <p className="text-destructive text-sm text-center">{login.error.message}</p>}
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input id="reg-username" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="role">I am a...</Label>
                     <select 
                       id="role" 
                       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                       value={role}
                       onChange={e => setRole(e.target.value as any)}
                     >
                       <option value="buyer">Buyer</option>
                       <option value="seller">Seller</option>
                     </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {register.error && <p className="text-destructive text-sm text-center">{register.error.message}</p>}
                <Button type="submit" className="w-full" disabled={register.isPending}>
                  {register.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
