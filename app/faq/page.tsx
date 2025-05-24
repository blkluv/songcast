'use client';

import React from 'react';
import PageLayout from '../components/layout/PageLayout';

export default function FAQ() {
  const faqItems = [
    {
      question: "What is Jersey Club?",
      answer: "Jersey Club is a platform that enables musikians to create and manage social tokens for their musik, allowing fans to support artists directly while gaining ownership in their success."
    },
    {
      question: "How do Musi Coins work?",
      answer: "Musik Coins are social tokens tied to specific artists or songs. When you buy Musik Coins, you're investing in the success of that artist. As the artist grows in popularity, the value of their coins may increase."
    },
    {
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button in the top right corner and select MetaMask. Make sure you have the Base network configured in your wallet."
    },
    {
      question: "What blockchain does Jersey Club use?",
      answer: "Jersey Club operates on the Base network, an Ethereum Layer 2 scaling solution that provides fast and low-cost transactions."
    },
    {
      question: "How do artists get paid?",
      answer: "Artists receive a percentage of every Musik Coin transaction related to their content, as well as royalties from secondary sales."
    },
    {
      question: "Can I sell my Musik Coins?",
      answer: "Yes, you can sell your Musik Coins to other users on the platform or through the integrated DEX."
    },
    {
      question: "What fees does Jersey Club charge?",
      answer: "Jersey Club serves as a platform referrer to Zora and will receive fee's on every trade with a coin that has the plaform referrer set to our address to maintain the service. The exact fee structure is based on the Zora protocol market rewards"
    }
  ];
  
  return (
      <div className="container px-4 py-16 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="pb-2 mb-10 border-b-2 border-white">
            <h1 className="text-4xl font-black tracking-tight uppercase md:text-5xl">Frequently Asked Questions</h1>
            <p className="mt-4 text-lg font-bold text-white uppercase">Everything you need to know about Jersey Club</p>
          </div>
          
          <div className="space-y-10">
            {faqItems.map((item, index) => (
              <div key={index} className="p-6 bg-black border-2 border-white shadow-woodcut">
                <h3 className="mb-3 text-xl font-black uppercase">{item.question}</h3>
                <p className="text-white">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
} 