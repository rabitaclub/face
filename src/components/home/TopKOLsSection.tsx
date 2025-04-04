import React from 'react';
import { motion } from 'framer-motion';
import KOLCard from '@/components/kol/KOLCard';
import { KOLProfile } from '@/types/profile';
import { Address } from 'viem';

// Sample data for demonstration
interface KOLMetrics {
  messages: number;
  earnings: string;
  growth: number;
}

interface EnhancedKOL extends KOLProfile {
  metrics: KOLMetrics;
  activity: number[];
}

const mockTopKOLs: EnhancedKOL[] = [
  {
    wallet: '0x1234567890123456789012345678901234567890' as Address,
    platform: 'X',
    handle: 'cryptoinfluencer',
    name: 'Crypto Influencer',
    fee: BigInt(0),
    profileIpfsHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc',
    verified: true,
    exists: true,
    formattedFee: '0.1',
    metrics: {
      messages: 1420,
      earnings: '35.6',
      growth: 24
    },
    activity: [3, 0, 1, 2, 3, 0, 5]
  },
  {
    wallet: '0x2345678901234567890123456789012345678901' as Address,
    platform: 'X',
    handle: 'defiexpert',
    name: 'DeFi Expert',
    fee: BigInt(0),
    profileIpfsHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc',
    verified: true,
    exists: true,
    formattedFee: '0.2',
    metrics: {
      messages: 934,
      earnings: '28.2',
      growth: 18
    },
    activity: [2, 0, 0, 0, 0, 0, 1]
  },
  {
    wallet: '0x3456789012345678901234567890123456789012' as Address,
    platform: 'X',
    handle: 'blockchainpro',
    name: 'Blockchain Pro',
    fee: BigInt(0),
    profileIpfsHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc',
    verified: true,
    exists: true,
    formattedFee: '0.15',
    metrics: {
      messages: 1105,
      earnings: '22.7',
      growth: 30
    },
    activity: [2, 4, 12, 1, 1, 0, 2]
  }
];

export const TopKOLsSection = () => {
  return (
    <motion.section
      className="py-6 sm:py-16 overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background-dark/50 to-background/80 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-3 sm:px-6 relative">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">top <span className="text-foreground">engagements</span></h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
            connect with our most active and rewarded key opinion leaders
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {mockTopKOLs.map((kol, index) => (
            <KOLCard 
              key={kol.wallet} 
              kol={kol} 
              index={index}
              showRank={true}
              showTrend={true}
              showActions={true} 
            />
          ))}
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 sm:mt-12"
        >
          <button 
            onClick={() => {}}
            className="bg-dark hover:bg-dark/90 text-primary px-5 sm:px-6 py-1.5 sm:py-2 rounded-button font-medium transition-all duration-normal border border-primary/20 shadow-elevation text-sm sm:text-base"
          >
            view/search kols
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}; 