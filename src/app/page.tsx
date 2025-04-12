'use client';

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PlatformFeaturesSection } from "@/components/home/PlatformFeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { OnboardingSection } from "@/components/home/OnboardingSection";
import { Footer } from "@/components/home/Footer";
import { FeatureModal } from "@/components/home/FeatureModal";
import { TopKOLsSection } from "@/components/home/TopKOLsSection";
import RoadmapSection from "@/components/home/RoadmapSection";
import { FAQSection } from "@/components/home/FAQSection";

interface Feature {
  title: string;
  details: string[];
}

export default function Home() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features: Record<string, Feature> = {
    e2ee: {
      title: "end-to-end encryption",
      details: [
        "when you send a message to a kol, it's automatically encrypted using pgp encryption. this means only you and the kol can read the messages, keeping your conversations completely private. we use your wallet to generate unique encryption keys, making sure your messages stay secure from start to finish."
      ]
    },
    decentralization: {
      title: "decentralized architecture",
      details: [
        "rabita runs entirely on the binance smart chain, which means there's no central server controlling your messages or data. you connect directly using your web3 wallet, and all transactions are transparent on the blockchain. this gives you full control over your interactions and ensures that your connections with kols are truly peer-to-peer."
      ]
    },
    smartContract: {
      title: "smart contract integration",
      details: [
        "our smart contracts handle all the important stuff automatically. when you send a message, your payment is held securely until the kol responds. if they don't respond in time (7 days), you get 50% of your money back. all fees are distributed fairly and instantly, and every transaction is recorded on the blockchain for complete transparency."
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-dark to-background">
      <HeroSection />
      <TopKOLsSection />
      <FeaturesSection 
        features={features}
        onFeatureClick={(feature) => {
          setSelectedFeature(feature);
          setIsModalOpen(true);
        }}
      />
      <PlatformFeaturesSection />
      <HowItWorksSection />
      <RoadmapSection />
      <FAQSection />
      <OnboardingSection />
      <Footer />

      <AnimatePresence>
        {isModalOpen && selectedFeature && (
          <FeatureModal
            feature={selectedFeature}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedFeature(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
