
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with Dual-tone Gradient Animations */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-gradient-to-r from-primary to-accent blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] left-[5%] w-72 h-72 rounded-full bg-gradient-to-r from-secondary to-primary blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute top-[30%] left-[30%] w-56 h-56 rounded-full bg-gradient-to-r from-accent to-secondary blur-3xl animate-pulse" style={{ animationDuration: "12s" }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient">
              Loyalty Luminary
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The next generation blockchain-powered loyalty rewards platform for businesses and customers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all">
              <Link to="/dashboard">
                Launch Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="px-8 border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
            >
              <Link to="/connect">Connect Wallet</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-lg border shadow-sm"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reward Management</h3>
              <p className="text-muted-foreground">
                Create and manage digital loyalty coupons that can be instantly redeemed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-lg border shadow-sm"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
              <p className="text-muted-foreground">
                All transactions are secured by blockchain technology for maximum transparency.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-lg border shadow-sm"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Redemption</h3>
              <p className="text-muted-foreground">
                Customers can quickly redeem rewards with a simple QR code scan in-store.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 p-10 rounded-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to transform your loyalty program?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the future of customer rewards with blockchain-powered loyalty solutions.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all">
              <Link to="/organizations">Explore Organizations</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
