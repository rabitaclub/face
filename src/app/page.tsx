'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CustomConnect from "@/components/CustomConnect";
import { useActiveWallet } from "@/hooks/useActiveWallet";

export default function Home() {
  const { address } = useActiveWallet();
  const [currentStep, setCurrentStep] = useState(0);
  
  const onboardingSteps = [
    {
      title: "connect your wallet",
      description: "connect your web3 wallet to get started with rabita's decentralized connectionsm and switch to binance smart chain",
      action: <CustomConnect />
    },
    {
      title: "create your KOL profile (optional)",
      description: "if you are a KOL, set up your digital identity with your wallet address as your unique identifier, and start connecting with your followers.",
      action: address ? <Link href="/profile" className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium transition-colors duration-200">Create Profile</Link> : null
    },
    {
      title: "start messaging",
      description: "search your KOL, pay for a connection and wait for the reply",
      action: address ? <Link href="/messages" className="bg-primary hover:bg-primary-dark text-button px-6 py-3 rounded-button font-medium transition-colors duration-200">Open Messages</Link> : null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-dark to-background">
      {/* Hero Section */}
      <section className="pt-2 pb-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            decentralized <span className="text-foreground">connections</span> marketplace
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            pay, connect, and chat with KOLs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('onboarding')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-dark hover:bg-dark text-button px-8 py-3 rounded-button font-medium text-white transition-all duration-normal border border-transparent shadow-elevation"
            >
              Get Started
            </button>
            <CustomConnect showBalance={false} showNetwork={false} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">why this?</h2>
          <p className="text-center text-gray-300 mb-12">
            we are building a decentralized connections marketplace for the web3 community, as suggested by <a href="https://www.binance.com/en/square/post/21262724104305" className="text-primary">CZ</a>. this platform is built on binance smart chain and uses the native token of the chain, BNB.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
                {/* Icon placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">only verified KOLs</h3>
              <p className="text-gray-300">this ensures that the connections are genuine and authentic.</p>
            </div>
            
            <div className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
                {/* Icon placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">decentralized</h3>
              <p className="text-gray-300">using the power of blockchain</p>
            </div>
            
            <div className="bg-background-light p-6 rounded-card border border-border rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-pill flex items-center justify-center mb-4">
                {/* Icon placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">pay to reach</h3>
              <p className="text-gray-300">pay for a connection and wait for the reply, simple.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Section */}
      <section id="onboarding" className="py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">get started</h2>
          <p className="text-center text-gray-300 mb-12">follow these simple steps to begin your decentralized connections journey</p>
          
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
                  Previous
                </button>
                
                <button 
                  onClick={() => setCurrentStep(Math.min(onboardingSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === onboardingSteps.length - 1}
                  className={`px-4 py-2 rounded-button ${currentStep === onboardingSteps.length - 1 ? 'bg-background-lighter text-gray-500 cursor-not-allowed' : 'bg-primary text-button hover:bg-primary-dark'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-16 bg-primary border">
        <div className="max-w-4xl mx-auto text-center justify-center items-center flex flex-col">
          <h2 className="text-3xl font-bold mb-4 text-button">Ready to Connect?</h2>
          <p className="text-xl text-button mb-8">Join thousands of users already messaging securely on Rabita</p>
          <CustomConnect />
        </div>
      </section> */}

      {/* Footer */}
      <footer className="py-12 bg-background-dark text-gray-400 rounded-b-lg shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center text-center">
            <div className="mb-8 md:mb-0 text-center">
              <Image src="/logo.svg" alt="Rabita Logo" width={300} height={300} />
            </div>
            {/* <div className="flex gap-8">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div> */}
          </div>
          {/* <div className="border-t border-border mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} rabita. All rights reserved.</p>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
