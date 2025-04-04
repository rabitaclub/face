import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FiAward, FiTrendingUp, FiDollarSign, FiMessageCircle, FiMessageSquare, FiInfo, FiArrowUp, FiArrowDown, FiActivity } from 'react-icons/fi';
import SecureImage from '@/components/SecureImage';
import { KOLProfile } from '@/types/profile';
import { useRouter } from 'next/navigation';
import XLogo from '@/ui/icons/XLogo';

// Line graph component for visualizing trends
export const LineGraph: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data) > 0 ? 0 : Math.min(...data); // Set min to 0 if all values are positive
  const range = max - min || 1;
  
  // Generate SVG points for the line
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  // Create a smooth path using cubic bezier curves
  const createSmoothPath = (points: number[][]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0][0]},${points[0][1]}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = points[i][0];
      const y0 = points[i][1];
      const x1 = points[i + 1][0];
      const y1 = points[i + 1][1];
      
      // Calculate control points for the curve
      const cp1x = x0 + (x1 - x0) / 3;
      const cp1y = y0;
      const cp2x = x1 - (x1 - x0) / 3;
      const cp2y = y1;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
    }
    
    return path;
  };
  
  // Convert string points to array of coordinates
  const pointsArray = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return [x, y];
  });
  
  // Create path for the smooth curve
  const smoothPath = createSmoothPath(pointsArray);
  
  // Create path for the filled area
  const areaPath = `${smoothPath} L ${pointsArray[pointsArray.length - 1][0]},100 L 0,100 Z`;
  
  return (
    <div className="w-full h-16 mt-1 rounded-md bg-primary/5 p-2 overflow-hidden border border-primary/10">
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* Filled area under the curve */}
        <motion.path
          d={areaPath}
          fill={color}
          fillOpacity="0.08"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        {/* Smooth curve line */}
        <motion.path
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </svg>
    </div>
  );
};

// Animated trend percentage badge as a separate component
const AnimatedTrendBadge = memo(({ 
  trendDirection, 
  trendPercentage 
}: { 
  trendDirection: 'up' | 'down', 
  trendPercentage: number 
}) => {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ 
        scale: [1, 1.1, 1],
        transition: { 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 2 
        } 
      }}
    >
      <Badge 
        className={`ml-1 flex items-center gap-0.5 text-[10px] ${
          trendDirection === 'up' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-700 border-red-200'
        }`}
      >
        {trendDirection === 'up' ? (
          <FiArrowUp size={10} />
        ) : (
          <FiArrowDown size={10} />
        )}
        {Math.abs(trendPercentage).toFixed(1)}%
      </Badge>
    </motion.div>
  );
});
AnimatedTrendBadge.displayName = 'AnimatedTrendBadge';

// Calculate linear regression to determine trend
const calculateTrend = (data: number[]): { percentage: number, direction: 'up' | 'down' } => {
  // Return default values for insufficient data
  if (!data || data.length < 2) {
    return { percentage: 0, direction: 'up' };
  }

  // Calculate linear regression (least squares method)
  const n = data.length;
  
  // X coordinates are positions (0, 1, 2, ..., n-1)
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = data.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope (m) using formula: m = Σ((x - xMean) * (y - yMean)) / Σ((x - xMean)²)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (data[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate y-intercept (b) using formula: b = yMean - (m * xMean)
  const intercept = yMean - (slope * xMean);
  
  // Calculate start and end y values using the regression line
  const startY = intercept;
  const endY = slope * (n - 1) + intercept;
  
  // Calculate percentage change
  const percentChange = startY !== 0 ? ((endY - startY) / Math.abs(startY)) * 100 : 0;
  
  // Determine trend direction
  const direction = percentChange >= 0 ? 'up' as const : 'down' as const;
  
  return {
    percentage: Math.abs(percentChange),
    direction
  };
};

// Enhanced KOL profile type with metrics and activity data
export type EnhancedKOLProfile = KOLProfile & { 
  metrics: { 
    messages: number, 
    earnings: string, 
    growth: number 
  },
  activity: number[]
};

// Shimmer effect component
const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`animate-shimmer bg-gradient-to-r from-transparent via-gray-200/50 to-transparent absolute inset-0 ${className}`} />
);

// Shimmer loading placeholder for KOL Card
const ShimmerKOLCard = () => {
  return (
    <Card className="overflow-hidden bg-white/90 border-primary/20 h-full relative">
      <div className="absolute top-0 right-0">
        <div className="m-3 w-12 h-6 bg-gray-200 rounded-md relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
      
      <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 pb-2 px-3 sm:px-6 pt-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 relative overflow-hidden">
            <Shimmer />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="h-5 bg-gray-200 w-3/4 mb-3 rounded relative overflow-hidden">
            <Shimmer />
          </div>
          <div className="h-4 bg-gray-200 w-1/2 rounded relative overflow-hidden">
            <Shimmer />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 pb-4">
        {/* Expertise Tags placeholder */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-gray-200 w-16 rounded relative overflow-hidden">
              <Shimmer />
            </div>
          ))}
        </div>
        
        {/* Metrics Grid placeholder */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center p-1.5 sm:p-2 rounded-md bg-gray-100 h-16">
              <div className="w-full h-full bg-gray-200 rounded relative overflow-hidden">
                <Shimmer />
              </div>
            </div>
          ))}
        </div>
        
        {/* Response Time Display placeholder */}
        <div className="mt-3 sm:mt-4 relative">
          <div className="rounded-md border border-gray-200 bg-gray-100 p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-gray-200 w-1/2 rounded relative overflow-hidden">
                <Shimmer />
              </div>
              <div className="h-4 bg-gray-200 w-16 rounded relative overflow-hidden">
                <Shimmer />
              </div>
            </div>
            
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>
        
        {/* Trend Display placeholder */}
        <div className="mt-3 sm:mt-4 relative">
          <div className="rounded-md border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-2 bg-gray-100">
              <div className="h-4 bg-gray-200 w-1/3 rounded relative overflow-hidden">
                <Shimmer />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 bg-gray-200 w-12 rounded relative overflow-hidden">
                  <Shimmer />
                </div>
              </div>
            </div>
            
            <div className="h-16 bg-gray-200 relative overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>
        
        {/* Button placeholder */}
        <div className="mt-4 flex justify-center">
          <div className="w-full h-9 bg-gray-200 rounded-md relative overflow-hidden">
            <Shimmer />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface KOLCardProps {
  kol: EnhancedKOLProfile;
  index?: number;
  showRank?: boolean;
  showTrend?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  onCardClick?: (wallet: string) => void;
  onConnectClick?: (wallet: string, e: React.MouseEvent) => void;
  className?: string;
  animated?: boolean;
}

const KOLCard: React.FC<KOLCardProps> = ({ 
  kol, 
  index = 0, 
  showRank = true,
  showTrend = true,
  showActions = true,
  isLoading: externalLoading,
  onCardClick,
  onConnectClick,
  className = "",
  animated = true
}) => {
  const router = useRouter();
  const [showResponseInfo, setShowResponseInfo] = useState(false);
  const [showTrendInfo, setShowTrendInfo] = useState(false);
  const [responsePercent, setResponsePercent] = useState(0);
  const [showResponseValue, setShowResponseValue] = useState(false);
  const [isLoading, setIsLoading] = useState(externalLoading !== undefined ? externalLoading : true);
  
  // Simulate loading for 3 seconds if no external loading state is provided
  useEffect(() => {
    if (externalLoading !== undefined) {
      setIsLoading(externalLoading);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [externalLoading]);
  
  // Calculate trend direction and percentage using linear regression
  const [trendData] = useState(() => calculateTrend(kol.activity));
  
  // Mock average response time in hours (would come from API in production)
  const [avgResponseHours] = useState(3 + (Math.floor(Math.random() * 40))); // Random between 3-43 hours for demo
  
  // Mock expertise tags
  const [expertiseTags] = useState(['DeFi', 'NFTs', 'Trading', 'Technical Analysis'].slice(0, 2 + Math.floor(Math.random() * 3))); // Random 2-4 tags
  
  // Calculate response time percentage (assuming 72hrs is maximum for visualization)
  useEffect(() => {
    // Start with 0 and animate to final value
    setResponsePercent(0);
    const timer = setTimeout(() => {
      const maxTime = 72; // Assuming 72 hours is the max for visualization purposes
      const calculatedPercent = Math.min((avgResponseHours / maxTime) * 100, 100);
      setResponsePercent(calculatedPercent);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [avgResponseHours]);
  
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(kol.wallet);
    } else {
      router.push(`/messages/${kol.wallet}`);
    }
  };

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectClick) {
      onConnectClick(kol.wallet, e);
    } else {
      router.push(`/messages/${kol.wallet}`);
    }
  };

  const CardComponent = animated ? motion.div : 'div';
  const cardProps = animated ? {
    custom: index,
    variants: containerVariants,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.3 },
    whileHover: { 
      scale: 1.03,
      transition: { duration: 0.2 }
    }
  } : {};

  // Determine response time label
  const getResponseLabel = () => {
    if (avgResponseHours < 6) return "Very Fast";
    if (avgResponseHours < 24) return "Fast";
    if (avgResponseHours < 48) return "Average";
    return "Slow";
  };
  
  // Get color based on response time
  const getResponseColor = () => {
    if (avgResponseHours < 6) return "#4ade80"; // green
    if (avgResponseHours < 24) return "#60a5fa"; // blue
    if (avgResponseHours < 48) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  // Format hours to display
  const formatResponseTime = () => {
    if (avgResponseHours < 24) {
      return `${avgResponseHours} hours`;
    } else {
      const days = Math.floor(avgResponseHours / 24);
      const hours = avgResponseHours % 24;
      return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <ShimmerKOLCard />
      </div>
    );
  }

  return (
    <CardComponent
      {...cardProps}
      className={className}
    >
      <Card 
        className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-primary/20 h-full cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {showRank && (
          <div className="absolute top-0 right-0">
            <Badge 
              variant="default" 
              className="m-3 bg-background/80 backdrop-blur-sm text-foreground font-medium"
            >
              <FiAward className="mr-1" /> #{index + 1}
            </Badge>
          </div>
        )}
        
        <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 pb-2 px-3 sm:px-6 pt-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary/20">
              <SecureImage
                encryptedData={kol.profileIpfsHash || ''}
                alt={kol.name}
                width={64}
                height={64}
                className="rounded-full object-cover"
                priority
              />
            </div>
            {showTrend && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-background flex items-center justify-center border-2 border-primary/20">
                <FiTrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 pt-1">
            <CardTitle className="text-base sm:text-lg text-gray-800 truncate mb-2">
              {kol.name}
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/10 text-gray-800 text-xs whitespace-nowrap px-2 py-0.5 border border-primary/20">
                  {kol.platform === 'X' ? <XLogo /> : kol.platform}
                  <span className="ml-1">@{kol.handle}</span>
                </Badge>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="px-3 sm:px-6 pb-4">
          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {expertiseTags.map(tag => (
              <Badge 
                key={tag}
                className="bg-gray-100 text-gray-700 text-[10px] border border-gray-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2">
            <motion.div 
              className="flex flex-col items-center p-1.5 sm:p-2 rounded-md bg-primary/10"
              whileHover={{ 
                backgroundColor: "rgba(var(--primary-rgb), 0.2)",
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center text-gray-800 mb-0.5 sm:mb-1">
                <FiMessageCircle size={12} />
              </div>
              <span className="font-bold text-xs sm:text-base text-gray-800">{kol.metrics.messages}</span>
              <span className="text-[10px] sm:text-xs text-gray-600">messages</span>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-1.5 sm:p-2 rounded-md bg-primary/10"
              whileHover={{ 
                backgroundColor: "rgba(var(--primary-rgb), 0.2)",
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center text-gray-800 mb-0.5 sm:mb-1">
                <FiDollarSign size={12} />
              </div>
              <span className="font-bold text-xs sm:text-base text-gray-800">{kol.metrics.earnings}</span>
              <span className="text-[10px] sm:text-xs text-gray-600">BNB earned</span>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-1.5 sm:p-2 rounded-md bg-primary/10"
              whileHover={{ 
                backgroundColor: "rgba(var(--primary-rgb), 0.2)",
                transition: { duration: 0.2 }
              }}
            >
              <div className="flex items-center text-gray-800 mb-0.5 sm:mb-1">
                <FiDollarSign size={12} />
              </div>
              <span className="font-bold text-xs sm:text-base text-gray-800">{kol.formattedFee}</span>
              <span className="text-[10px] sm:text-xs text-gray-600">BNB fee</span>
            </motion.div>
          </div>
          
          {/* Response Time Display */}
          <div className="mt-3 sm:mt-4 relative">
            <motion.div 
              className="rounded-md border border-primary/10 overflow-hidden bg-gray-50 p-3"
              onHoverStart={() => setShowResponseInfo(true)}
              onHoverEnd={() => setShowResponseInfo(false)}
              onMouseEnter={() => setShowResponseValue(true)}
              onMouseLeave={() => setShowResponseValue(false)}
              whileHover={{ y: -2 }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <svg 
                    className="mr-2 text-dark" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Average Response Time</span>
                </div>
                <Badge 
                  className={`
                    text-[10px] px-2 border 
                    ${avgResponseHours < 6 ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${avgResponseHours >= 6 && avgResponseHours < 24 ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${avgResponseHours >= 24 && avgResponseHours < 48 ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                    ${avgResponseHours >= 48 ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  `}
                >
                  {getResponseLabel()}
                </Badge>
              </div>
              
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{ 
                    backgroundColor: getResponseColor(),
                    width: "0%"
                  }}
                  animate={{ 
                    width: `${responsePercent}%`
                  }}
                  transition={{ 
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                />
                
                <motion.div
                  className="absolute top-0 left-0 h-full w-full flex items-center justify-end px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showResponseValue ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-md">
                    {formatResponseTime()}
                  </span>
                </motion.div>
              </div>
              
              <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                <span>&lt;6h</span>
                <span>24h</span>
                <span>48h</span>
                <span>&gt;72h</span>
              </div>
              
              <AnimatePresence>
                {showResponseInfo && (
                  <motion.div 
                    className="absolute -bottom-24 left-0 right-0 mx-auto w-[90%] bg-white rounded-md shadow-lg p-3 z-10 border border-primary/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-800">Response Time Details</span>
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 10, 0],
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeInOut",
                          times: [0, 0.2, 0.5, 0.8, 1],
                          repeat: Infinity,
                          repeatDelay: 2
                        }}
                      >
                        <FiInfo size={12} className="text-primary" />
                      </motion.div>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-1">
                      This KOL typically responds within {formatResponseTime()}, which is 
                      {avgResponseHours < 24 ? " faster than average" : avgResponseHours < 48 ? " about average" : " slower than average"}.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-700">{getResponseLabel()} response rate</span>
                      <Badge 
                        className={`text-[10px] px-2 
                          ${avgResponseHours < 6 ? 'bg-green-100 text-green-700' : ''}
                          ${avgResponseHours >= 6 && avgResponseHours < 24 ? 'bg-blue-100 text-blue-700' : ''}
                          ${avgResponseHours >= 24 && avgResponseHours < 48 ? 'bg-amber-100 text-amber-700' : ''}
                          ${avgResponseHours >= 48 ? 'bg-red-100 text-red-700' : ''}
                        `}
                      >
                        {formatResponseTime()}
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Interactive Trend Display */}
          {showTrend && (
            <div className="mt-3 sm:mt-4 relative">
              <motion.div 
                className="rounded-md border border-primary/10 overflow-hidden"
                onHoverStart={() => setShowTrendInfo(true)}
                onHoverEnd={() => setShowTrendInfo(false)}
                whileHover={{ y: -2 }}
              >
                <div className="flex justify-between items-center p-2 bg-primary/5">
                  <div className="flex items-center gap-1">
                    <FiActivity className="text-dark" size={14} />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">Engagement Trend</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className="text-[10px] sm:text-xs py-0 px-1.5 h-4 sm:h-5 bg-gray-100/50 border-gray-300 text-gray-700"
                    >
                      7 days
                    </Badge>
                    <AnimatedTrendBadge 
                      trendDirection={trendData.direction}
                      trendPercentage={trendData.percentage}
                    />
                  </div>
                </div>
                
                <LineGraph 
                  data={kol.activity} 
                  color={trendData.direction === 'up' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} 
                />
                
                <AnimatePresence>
                  {showTrendInfo && (
                    <motion.div 
                      className="absolute -bottom-20 left-0 right-0 mx-auto w-[90%] bg-white rounded-md shadow-lg p-3 z-10 border border-primary/20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-800">Trend Analysis</span>
                        <FiInfo size={12} className="text-primary" />
                      </div>
                      <p className="text-[10px] text-gray-600">
                        {trendData.direction === 'up' 
                          ? `Growing engagement with ${Math.abs(trendData.percentage).toFixed(1)}% increase in the last 7 days` 
                          : `Decreasing engagement with ${Math.abs(trendData.percentage).toFixed(1)}% drop in the last 7 days`
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
          
          {showActions && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleConnectClick}
                className="flex items-center justify-center gap-1.5 w-full py-2 px-4 bg-primary text-dark text-sm font-medium rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm"
              >
                <FiMessageSquare size={14} />
                Connect Now
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </CardComponent>
  );
};

export default KOLCard; 