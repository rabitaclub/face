import { motion } from "framer-motion";
import { FaLock, FaNetworkWired } from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";

interface Feature {
  title: string;
  details: string[];
}

interface FeaturesSectionProps {
  features: Record<string, Feature>;
  onFeatureClick: (feature: Feature) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export const FeaturesSection = ({ features, onFeatureClick }: FeaturesSectionProps) => {
  return (
    <motion.section 
      id="features" 
      className="py-16"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          variants={itemVariants}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 text-white">why choose <span className="text-primary">rabita</span>?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            pioneering the future of decentralized engagement, inspired by <a target="_blank" href="https://www.binance.com/en/square/post/21262724104305" className="text-primary hover:text-primary-light transition-colors">CZ</a>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            variants={itemVariants}
            className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.02 }}
            onClick={() => onFeatureClick(features.e2ee)}
          >
            <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
              <FaLock className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">end-to-end encryption</h3>
            <p className="text-gray-300">secure messaging with wallet-based verification</p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.02 }}
            onClick={() => onFeatureClick(features.decentralization)}
          >
            <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
              <FaNetworkWired className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">decentralized</h3>
            <p className="text-gray-300">fully open-source platform built on bsc with community governance</p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.02 }}
            onClick={() => onFeatureClick(features.smartContract)}
          >
            <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
              <HiLightningBolt className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">smart contracts</h3>
            <p className="text-gray-300">automated fee distribution and secure message handling</p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}; 