import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Recycle, BarChart3, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                <Leaf className="mr-2 h-4 w-4" />
                Sustainable Future
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Connect for a <span className="text-primary">Greener</span> Planet
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              The intelligent marketplace transforming waste into resources. 
              Connect with buyers and sellers, identify recyclable materials with AI, and track your environmental impact.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/browse">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                  Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
                  Create Account
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/10 blur-[100px]" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Recycle className="h-8 w-8 text-primary" />}
              title="Marketplace Connection"
              description="Directly connect industrial buyers with waste generators. Streamline logistics and ensure transparency."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-primary" />}
              title="Impact Tracking"
              description="Visualize your contribution to the circular economy with detailed metrics and performance reports."
            />
            <FeatureCard 
              icon={<Globe className="h-8 w-8 text-primary" />}
              title="AI-Powered Sorting"
              description="Use our advanced AI to instantly identify, categorize, and value waste materials from a single photo."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Ready to make a difference?</h2>
          <p className="text-xl text-background/80 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses and individuals turning waste into value today.
          </p>
          <Link href="/auth">
            <Button size="lg" className="h-14 px-8 text-lg bg-white text-foreground hover:bg-white/90 shadow-xl shadow-white/10 rounded-full">
              Join the Network
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors duration-300">
      <div className="p-4 rounded-xl bg-white shadow-md shadow-primary/5 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
