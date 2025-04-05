import { useState } from "react";
import Link from "next/link";
import CustomConnect from "@/components/CustomConnect";
import { useActiveWallet } from "@/hooks/useActiveWallet";

interface OnboardingStep {
  title: string;
  description: string;
  action: React.ReactNode;
}

export const OnboardingSection = () => {
  const { address } = useActiveWallet();
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "connect your wallet",
      description: "connect your web3 wallet to get started with rabita's decentralized connections and switch to binance smart chain",
      action: <CustomConnect />
    },
    {
      title: "create your kol profile (optional)",
      description: "if you are a kol, set up your digital identity with your wallet address as your unique identifier, and start connecting with your followers.",
      action: address ? <Link href="/profile" className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium transition-colors duration-200">create profile</Link> : null
    },
    {
      title: "start messaging",
      description: "search your kol, pay for a connection and wait for the reply",
      action: address ? <Link href="/messages" className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium transition-colors duration-200">open messages</Link> : null
    }
  ];

  return (
    <section id="onboarding" className="py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">get <span className="text-primary">started</span></h2>
        <p className="text-center text-gray-300 mb-8">follow these simple steps to begin your decentralized connections journey</p>
        
        <div className="bg-background-light rounded-container p-8 border border-border rounded-lg shadow-lg">
          <div className="flex mb-8 justify-center">
            {onboardingSteps.map((_, index) => (
              <div 
                key={index}
                className={`w-10 h-10 rounded-pill flex items-center justify-center mx-2 cursor-pointer 
                ${currentStep >= index ? 'bg-primary text-button' : 'bg-background-lighter text-gray-400'}`}
                onClick={() => setCurrentStep(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4 text-white">{onboardingSteps[currentStep].title}</h3>
            <p className="text-gray-300 mb-8">{onboardingSteps[currentStep].description}</p>
            
            <div className="flex justify-center mb-6">
              {onboardingSteps[currentStep].action}
            </div>
            
            <div className="flex justify-between mt-8">
              <button 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-button ${currentStep === 0 ? 'bg-background-lighter text-gray-500 cursor-not-allowed' : 'bg-background-lighter text-button-inverse hover:bg-background-lighter/80'}`}
              >
                previous
              </button>
              
              <button 
                onClick={() => setCurrentStep(Math.min(onboardingSteps.length - 1, currentStep + 1))}
                disabled={currentStep === onboardingSteps.length - 1}
                className={`px-4 py-2 rounded-button ${currentStep === onboardingSteps.length - 1 ? 'bg-background-lighter text-gray-500 cursor-not-allowed' : 'bg-primary text-button hover:bg-primary-dark'}`}
              >
                next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 