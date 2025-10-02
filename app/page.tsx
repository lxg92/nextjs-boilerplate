"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-6">
          <div className="text-2xl font-bold text-gray-900">VoiceClone AI</div>
          <div className="space-x-4">
            <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="/api/auth/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Sign In
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Clone Any Voice with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create high-quality voice clones and generate natural speech using advanced AI technology. 
            Perfect for content creators, developers, and businesses.
          </p>
          <div className="space-x-4">
            <a href="/api/auth/login" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700">
              Get Started Free
            </a>
            <a href="/pricing" className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 hover:bg-gray-50">
              View Pricing
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Voice Cloning</h3>
              <p className="text-gray-600">Upload a short audio sample and create a voice clone in seconds</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0v16a1 1 0 001 1h6a1 1 0 001-1V4H7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced SSML</h3>
              <p className="text-gray-600">Control speech with pauses, emphasis, and pronunciation</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">High Quality Audio</h3>
              <p className="text-gray-600">Generate studio-quality audio with natural-sounding voices</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600 text-white py-16 rounded-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-indigo-100 mb-8">Join thousands of users creating amazing voice content</p>
          <a href="/api/auth/login" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100">
            Start Free Trial
          </a>
        </div>

        {/* Footer */}
        <footer className="py-12 text-center text-gray-600">
          <p>&copy; 2024 VoiceClone AI. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}