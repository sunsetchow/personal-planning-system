'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Personal Planning System
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            AI-native personal planning with OKR tracking and daily journaling
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Track your objectives and key results, maintain a daily journal, and get
            AI-powered insights to achieve your goals. Powered by Claude AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">OKR Tracking</h3>
              <p className="text-gray-600">
                Set and track your objectives and key results with AI-powered suggestions
                and progress visualization.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Daily Journal</h3>
              <p className="text-gray-600">
                Reflect on your daily progress with customizable templates and get
                AI feedback on your entries.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">AI Insights</h3>
              <p className="text-gray-600">
                Receive personalized insights and recommendations powered by Claude AI
                to help you achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
