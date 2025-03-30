import { FaRobot, FaWallet, FaLock, FaShieldAlt, FaUserCheck, FaNetworkWired, FaChartLine, FaClock, FaHandshake, FaMailBulk } from "react-icons/fa";
import { HiLightningBolt, HiChatAlt2, HiCurrencyDollar, HiUserGroup } from "react-icons/hi";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
}

const FeatureCard = ({ icon, title, items }: FeatureCardProps) => (
  <div 
    className="bg-background-light/10 p-8 rounded-xl border border-primary/10 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-4 text-gray-300">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            {item.icon}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const PlatformFeaturesSection = () => {
  return (
    <section className="py-16 bg-background-light/5 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">platform features</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            advanced capabilities for seamless kol engagement
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<FaRobot className="h-6 w-6 text-primary" />}
              title="automated messaging"
              items={[
                { icon: <HiChatAlt2 className="text-primary mt-1" />, text: "encrypted ipfs based message-storage" },
                { icon: <FaClock className="text-primary mt-1" />, text: "automatic triggers powered by chainlink keepers" },
                { icon: <FaHandshake className="text-primary mt-1" />, text: "seamless kol-user matching" }
              ]}
            />

            <FeatureCard
              icon={<FaWallet className="h-6 w-6 text-primary" />}
              title="secure payments"
              items={[
                { icon: <HiCurrencyDollar className="text-primary mt-1" />, text: "instant bnb payment processing" },
                { icon: <FaShieldAlt className="text-primary mt-1" />, text: "escrow-based payment protection" },
                { icon: <HiUserGroup className="text-primary mt-1" />, text: "transparent fee distribution" }
              ]}
            />
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<FaLock className="h-6 w-6 text-primary" />}
              title="verified connections"
              items={[
                { icon: <FaShieldAlt className="text-primary mt-1" />, text: "end-to-end message encryption" },
                { icon: <FaUserCheck className="text-primary mt-1" />, text: "verified kol profiles" },
                { icon: <FaNetworkWired className="text-primary mt-1" />, text: "decentralized architecture" }
              ]}
            />

            <FeatureCard
              icon={<HiLightningBolt className="h-6 w-6 text-primary" />}
              title="smart contracts"
              items={[
                { icon: <FaChartLine className="text-primary mt-1" />, text: "registry of kol's" },
                { icon: <FaClock className="text-primary mt-1" />, text: "timeout-based refunds" },
                { icon: <FaMailBulk className="text-primary mt-1" />, text: "trustless message verification" }
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}; 