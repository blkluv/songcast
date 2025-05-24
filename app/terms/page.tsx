'use client';

import React from 'react';
import PageLayout from '../components/layout/PageLayout';

export default function TermsOfService() {
  return (
      <div className="container px-4 py-16 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="pb-2 mb-10 border-b-2 border-white">
            <h1 className="text-4xl font-black tracking-tight uppercase md:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-lg font-bold text-white uppercase">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-8 prose prose-invert max-w-none">
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Jersey Club, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">2. Description of Services</h2>
              <p>
                Jersey Club provides a platform for artists to create and manage social tokens, and for users to purchase, trade, and collect 
                these tokens. All transactions are conducted on the Base blockchain network.
              </p>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">3. User Registration</h2>
              <p>
                To use certain features of Jersey Club, you must connect a compatible cryptocurrency wallet. You are responsible for 
                maintaining the security of your wallet and for all activities that occur under your account.
              </p>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">4. Musik Coins and Transactions</h2>
              <p>
                Musi Coins are digital assets on the blockchain. When purchasing Musik Coins, you understand that:
              </p>
              <ul className="pl-6 mt-2 space-y-2 list-disc">
                <li>Digital assets are subject to high market volatility and risk.</li>
                <li>Jersey Club will receive platform referral rewards from trades in form of Zora protocol market rewards.</li>
                <li>Blockchain transactions are irreversible once confirmed.</li>
                <li>You are responsible for any taxes related to your transactions.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">5. Artist Rights and Obligations</h2>
              <p>
                Artists who create Musik Coins on Jersey Club retain all rights to their original content. By creating 
                tokens, artists agree to:
              </p>
              <ul className="pl-6 mt-2 space-y-2 list-disc">
                <li>Provide accurate information about themselves and their work.</li>
                <li>Only tokenize content they have rights to.</li>
                <li>Fulfill any promises made to token holders.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">6. Prohibited Activities</h2>
              <p>
                Users may not engage in any of the following activities:
              </p>
              <ul className="pl-6 mt-2 space-y-2 list-disc">
                <li>Violating any laws or regulations.</li>
                <li>Infringing on intellectual property rights.</li>
                <li>Manipulating the market for Musik Coins.</li>
                <li>Using the platform for money laundering or illegal activities.</li>
                <li>Attempting to interfere with the proper functioning of the platform.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">7. Limitation of Liability</h2>
              <p>
                Jersey Club and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of or inability to use the service.
              </p>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">8. Changes to Terms</h2>
              <p>
                Jersey Club reserves the right to modify these terms at any time. We will provide notice of significant changes by 
                updating the date at the top of these terms and by maintaining a changelog.
              </p>
            </section>
            
            <section>
              <h2 className="mb-4 text-2xl font-black uppercase">9. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2 font-bold">orange@jerseyclub.io</p>
            </section>
          </div>
        </div>
      </div>
  );
} 