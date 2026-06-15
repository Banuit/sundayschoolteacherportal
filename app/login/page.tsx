'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setMessage('✅ Account created! Please check your email for a verification link.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setMessage('🚀 Success! Redirecting...');
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
          {isRegistering ? '📝 Teacher Registration' : '🔐 Teacher Login'}
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          {isRegistering ? 'Create an administrative profile' : 'Sign in to access your dashboard'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white border-gray-200"
              placeholder="teacher@school.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Password</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white border-gray-200"
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-sm text-center font-medium mt-2 text-gray-700">{message}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-all shadow-sm"
          >
            {loading ? 'Processing...' : isRegistering ? 'Create Free Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Here"}
          </button>
        </div>
      </div>
    </main>
  );
}
