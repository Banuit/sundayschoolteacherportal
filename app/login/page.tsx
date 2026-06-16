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

  // New Teacher Profile Registration Fields
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [churchName, setChurchName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegistering) {
      // 1. Sign Up inside Supabase Authentication Table
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        setMessage(`❌ Error: ${authError.message}`);
        setLoading(false);
        return;
      }

      // 2. Insert corresponding profile row mapping data values
      if (authData?.user) {
        const { error: profileError } = await supabase.from('teacher_profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            residential_address: address,
            church_name: churchName
          }
        ]);

        if (profileError) {
          setMessage(`❌ Auth passed, Profile Error: ${profileError.message}`);
        } else {
          setMessage('🚀 Profile Registered! Switching to log in...');
          setIsRegistering(false);
        }
      }
    } else {
      // Handle Standard Teacher Sign-In Route
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 border border-slate-100 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRegistering ? '📝 Teacher Signup' : '🔐 Teacher Login'}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {isRegistering ? 'Create a Sunday School teacher profile' : 'Sign in to access your milestones spreadsheet'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3.5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-black bg-white focus:border-slate-400" placeholder="Teacher name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Church Name</label>
                <input type="text" required value={churchName} onChange={(e) => setChurchName(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-black bg-white focus:border-slate-400" placeholder="e.g. Grace Fellowship Church" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Residential Address</label>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-black bg-white focus:border-slate-400" placeholder="Home layout details" />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-black bg-white focus:border-slate-400" placeholder="name@churchmail.com" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none text-black bg-white focus:border-slate-400" placeholder="••••••••" />
          </div>

          {message && <p className="text-xs text-center font-bold mt-2 text-slate-600">{message}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-xs rounded-xl disabled:opacity-50 transition-all shadow-md shadow-blue-50">
            {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In Now'}
          </button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4">
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }} className="text-xs font-bold text-blue-600 hover:underline">
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Profile Here"}
          </button>
        </div>
      </div>
    </main>
  );
}
