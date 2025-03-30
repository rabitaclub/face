import { motion } from "framer-motion";
import CustomConnect from "@/components/CustomConnect";

export const HeroSection = () => {
  return (
    <motion.section 
      className="pt-16 pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.h1 
          className="text-5xl md:text-6xl font-bold mb-6 text-white"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          decentralized <span className="text-foreground">connections</span> marketplace
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          pay, connect, and chat with kols
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button 
            onClick={() => document.getElementById('onboarding')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-dark hover:bg-dark text-button px-8 py-3 rounded-button font-medium text-white transition-all duration-normal border border-transparent shadow-elevation"
          >
            get started
          </button>
          <CustomConnect showBalance={false} showNetwork={false} />
        </motion.div>
      </div>
    </motion.section>
  );
}; 