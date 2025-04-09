import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import KOLCard, { ShimmerKOLCard } from '@/components/kol/KOLCard';
import { KOLProfile } from '@/types/profile';
import { Address, formatEther } from 'viem';
import { useIsMobile } from '@/hooks/useIsClient';
import { FiLoader } from 'react-icons/fi';
import { FileScanIcon, ScanSearchIcon } from 'lucide-react';
import { useTrendingKOLs, TrendingKOLProfile } from '@/hooks/useTrendingKOLs';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingUpIcon } from 'lucide-react';

// Sample data for demonstration
interface KOLMetrics {
  activeConversations: number;
  totalFees: string;
  messageCount: number;
  dailyActivity: Record<string, number>;
}

interface EnhancedKOL extends KOLProfile {
  metrics: KOLMetrics;
  activity: number[];
  kolData: {
    tags: string;
    description: string;
    profileHash: string;
  }
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
      activeConversations: 1420,
      totalFees: '35.6',
      messageCount: 24,
      dailyActivity: {}
    },
    activity: [3, 0, 1, 2, 3, 0, 5],
    kolData: {
      tags: 'blockchain-development,defi,trading,market-analysis',
      description: 'Crypto influencer with a focus on blockchain development and DeFi',
      profileHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc'
    }
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
      activeConversations: 934,
      totalFees: '28.2',
      messageCount: 18,
      dailyActivity: {}
    },
    activity: [2, 0, 0, 0, 0, 0, 1],
    kolData: {
      tags: 'defi,tokenomics,investment,founder',
      description: 'DeFi expert with a focus on tokenomics and investment strategies',
      profileHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc'
    }
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
      activeConversations: 1105,
      totalFees: '22.7',
      messageCount: 30,
      dailyActivity: {}
    },
    activity: [2, 4, 12, 1, 1, 0, 2],
    kolData: {
      tags: 'smart-contracts,ethereum,solidity,developer',
      description: 'Blockchain developer with expertise in smart contracts and Ethereum',
      profileHash: 'QmYgtfRvhBQLXZE5kf3rG1hgCU2Vha2qmrfZgWCcwdmXZc'
    }
  }
];

export const TopKOLsSection = () => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const { trendingKOLs, isLoading } = useTrendingKOLs();
  const router = useRouter();
  
  // Use effect to set mounted state after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Number of shimmer cards to display
  const cardCount = isMobile ? 1 : 3;

  // Animation variants for shimmer cards
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
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Convert trending KOLs to enhanced KOL format
  const mapTrendingToEnhanced = (kol: TrendingKOLProfile): EnhancedKOL => {
    // Map the TrendingKOLProfile to EnhancedKOL format
    return {
      ...kol,
      formattedFee: formatEther(kol.fee),
      metrics: {
        activeConversations: kol.metrics.activeConversations || 0,
        totalFees: kol.metrics.totalFees || '0',
        messageCount: kol.metrics.messageCount || 0,
        dailyActivity: kol.metrics.dailyActivity || {}
      },
      activity: Object.values(kol.metrics.dailyActivity || {}).slice(-7),
      kolData: kol.kolData
    } as EnhancedKOL;
  };

  // Determine whether to show trending KOLs or notification
  const showTrendingKOLs = trendingKOLs && trendingKOLs.length > 0;
  const kols = showTrendingKOLs ? trendingKOLs.slice(0, 3).map(mapTrendingToEnhanced) : mockTopKOLs;
  
  return (
    <motion.section
      className="py-16 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-12"
        >
          {/* <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div> */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">top <span className="text-foreground">engagements</span></h2>
            <motion.div 
              className="text-primary"
              animate={{ 
                y: [0, -3, 0],
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
            >
              <TrendingUpIcon className="h-6 w-6" />
            </motion.div>
          </div>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
            discover and connect with the most active kols on the platform
          </p>
        </motion.div>

        {/* Card grid container with enhanced blur effects */}
        <div className="relative mb-10" style={{ minHeight: isMobile ? '300px' : '380px' }}>
          {/* Frosted glass-like container for better visual effect */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-background-dark/20 backdrop-blur-[2px]"></div>
          </div>

          {/* Shimmer KOL Cards with motion effect if loading */}
          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 relative"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {Array.from({ length: cardCount }).map((_, index) => (
                <motion.div 
                  key={index} 
                  className="relative"
                  variants={itemVariants}
                  style={{ 
                    filter: "blur(2px)"
                  }}
                  whileHover={{ 
                    filter: "blur(1px)",
                    transition: { duration: 0.3 }
                  }}
                >
                  <ShimmerKOLCard />
                  {/* Overlay gradient on each card for consistency */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background-dark/10 to-transparent rounded-lg pointer-events-none"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : showTrendingKOLs ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 relative"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {kols.map((kol, index) => (
                <motion.div 
                  key={index} 
                  className="relative"
                  variants={itemVariants}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <KOLCard 
                    kol={kol} 
                    showRank={index < 3} 
                    showTrend={true} 
                    showAverageResponseTime={false}
                    animated={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Creative notification overlay when no data available */
            <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
              <motion.div 
                className="bg-background-dark backdrop-blur-sm rounded-lg p-5 sm:p-6 border border-primary/20 max-w-md w-full shadow-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative"
                    animate={{ boxShadow: ['0 0 0 0 rgba(var(--primary-rgb), 0.4)', '0 0 0 10px rgba(var(--primary-rgb), 0)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-7 w-7 text-primary" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ScanSearchIcon className="h-2 w-2 text-primary" />
                    </motion.svg>
                  </motion.div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 text-center">analytics in progress</h3>
                  <p className="text-sm sm:text-base text-white text-center mb-2">
                    we're collecting engagement data across the network to provide meaningful insights.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-200 mt-1 text-center">
                    this section will display trending kols and performance metrics as the platform matures.
                  </p>
                  
                  <div className="w-full mt-5 pt-3 border-t border-primary/15">
                    <div className="mt-2 text-xs text-center text-gray-200">
                      <motion.span
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        share the word
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button 
            onClick={() => {
              router.push('/messages');
            }}
            className="bg-dark hover:bg-dark/90 text-primary px-5 sm:px-6 py-1.5 sm:py-2 rounded-button font-medium transition-all duration-normal border border-primary/20 shadow-elevation text-sm sm:text-base"
          >
            view/search kols
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}; 