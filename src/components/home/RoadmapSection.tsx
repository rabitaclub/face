import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Shield, 
  Link, 
  Smartphone, 
  Zap, 
  Network, 
  BarChart, 
  Brain,
  Map,
  Share2,
  Award
} from 'lucide-react';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  icon?: React.ReactNode;
}

const RoadmapSection: React.FC = () => {
  const roadmapItems: RoadmapItem[] = [
    {
      title: 'End-to-End Encryption',
      description: 'Implemented PGP encryption for secure messaging between users and KOLs',
      status: 'completed',
      icon: <Shield className="w-6 h-6 text-green-500" />
    },
    {
      title: 'Binance Smart Chain Integration',
      description: 'Successfully deployed smart contracts on BSC for secure transactions',
      status: 'completed',
      icon: <Link className="w-6 h-6 text-green-500" />
    },
    {
      title: 'Smart Contract Escrow System',
      description: 'Implemented automatic payment holding and refund mechanisms',
      status: 'completed',
      icon: <Smartphone className="w-6 h-6 text-green-500" />
    },
    {
      title: 'Multi-Chain Support',
      description: 'Expanding to Ethereum, Polygon, and other major chains for broader accessibility',
      status: 'in-progress',
      icon: <Network className="w-6 h-6 text-amber-500" />
    },
    {
      title: 'Messaging Speed Optimization',
      description: 'Reducing message delivery time from 30s to under 5s through advanced caching and parallel processing',
      status: 'in-progress',
      icon: <Zap className="w-6 h-6 text-amber-500" />
    },
    {
      title: 'Multi-Social Media Integration',
      description: 'Expanding beyond X (Twitter) to include Instagram, LinkedIn, and other major platforms for broader KOL reach',
      status: 'planned',
      icon: <Share2 className="w-6 h-6 text-blue-500" />
    },
    {
      title: 'Advanced Analytics Dashboard',
      description: 'Implementing detailed analytics for KOLs and users to track engagement and performance',
      status: 'planned',
      icon: <BarChart className="w-6 h-6 text-blue-500" />
    },
    {
      title: 'Decentralized Credential Verification',
      description: 'Blockchain-based system for verifying professional credentials, experience, and endorsements without centralized authorities',
      status: 'planned',
      icon: <Award className="w-6 h-6 text-blue-500" />
    }
  ];

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
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-background-dark lowercase">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Map className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Development Roadmap</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our journey to revolutionize decentralized communication and creator economy
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {roadmapItems.map((item, index) => (
            <motion.div
              key={index}
              className="bg-card-bg p-6 rounded-xl border border-border-color hover:border-primary transition-all duration-300"
              variants={itemVariants}
            >
              <div className="flex items-center mb-4">
                {item.icon}
                <h3 className="text-xl font-semibold text-white ml-2">{item.title}</h3>
              </div>
              <p className="text-gray-300 mb-4">{item.description}</p>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  item.status === 'completed' ? 'text-green-500' : 
                  item.status === 'in-progress' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  {item.status === 'completed' ? 'Completed' : 
                   item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default RoadmapSection; 