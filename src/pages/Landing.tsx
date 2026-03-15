import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';

const Landing: React.FC = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleEnter = async () => {
    if (user) {
      navigate('/app');
    } else {
      try {
        await loginWithGoogle();
        navigate('/app');
      } catch (err: any) {
        // Only navigate if login actually succeeds; ignore if user closes the popup
        console.error("Login failed or was cancelled:", err.message);
        if (err.message.includes("not initialized")) {
          alert('Firebase is not configured! Please check your .env vars.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white flex flex-col items-center justify-center p-8 gap-12 md:gap-16 overflow-hidden">
      {/* Hero */}
      <div className="text-center max-w-4xl mx-auto px-4">
        <div className="text-sm md:text-base bg-amber-400/20 text-amber-300 px-4 py-1 rounded-full mb-6 inline-block font-medium tracking-wide uppercase">
          MODULAR NEURAL CONTROLLER · HACKBIO '26
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent mb-6 leading-tight">
          The Tidepool Brain
        </h1>
        <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-8">
          A living neural controller that learns to forage, avoid predators, 
          and survive in a simulated tidepool — with a fully interactive 3D brain.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="secondary" className="bg-amber-500/20 border-amber-400/30 text-amber-200">
            Live 3D brain
          </Badge>
          <Badge variant="secondary" className="bg-amber-500/20 border-amber-400/30 text-amber-200">
            Predator & shelter modules
          </Badge>
          <Badge variant="secondary" className="bg-amber-500/20 border-amber-400/30 text-amber-200">
            Foraging & energy metrics
          </Badge>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 px-4">
        <Button
          onClick={handleEnter}
          disabled={loading}
          size="lg"
          className="text-lg px-12 py-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-2xl shadow-amber-500/25 min-w-[280px] md:min-w-[320px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Checking session…
            </>
          ) : user ? (
            <>
              Enter Tidepool Brain
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            'Start Local Session'
          )}
        </Button>
        {user && (
          <p className="text-lg text-amber-300 font-medium">
            Signed in as {user.displayName || user.email}
          </p>
        )}
      </div>

      {/* Mini Preview */}
      <div className="w-full max-w-4xl px-4">
        <div className="border border-amber-400/20 rounded-2xl p-4 bg-neutral-900/50 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col gap-2 relative h-64 md:h-96">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          {/* Header Mock */}
          <div className="w-full h-8 bg-black/40 rounded flex items-center px-4 justify-between border border-white/5">
            <div className="w-1/3 h-2 bg-amber-400/20 rounded-full" />
            <div className="flex gap-2">
              <div className="w-12 h-2 bg-amber-400/20 rounded-full" />
              <div className="w-12 h-2 bg-amber-400/20 rounded-full" />
            </div>
          </div>
          {/* Layout Mock */}
          <div className="flex flex-1 gap-2">
            {/* Left Panel */}
            <div className="w-48 bg-black/40 rounded border border-white/5 p-3 flex flex-col gap-3">
              <div className="w-2/3 h-2 bg-white/10 rounded-full" />
              <div className="w-full h-8 bg-amber-500/10 border border-amber-500/20 rounded" />
              <div className="w-full h-8 bg-white/5 rounded" />
              <div className="w-full h-8 bg-white/5 rounded" />
            </div>
            {/* Center View */}
            <div className="flex-1 bg-black/60 rounded border border-amber-500/10 p-4 relative overflow-hidden flex items-center justify-center">
              {/* Fake 3D World or Brain */}
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-amber-500/30 flex items-center justify-center relative">
                <div className="absolute w-full h-full border border-amber-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute w-2/3 h-2/3 border border-amber-500/20 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
                <div className="w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
              </div>
            </div>
          </div>
          <p className="text-xs text-amber-500/50 mt-2 text-center absolute bottom-4 w-full z-20">
            Interactive metrics and 3D visualization inside
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
