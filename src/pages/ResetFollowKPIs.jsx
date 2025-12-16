import React, { useEffect, useState } from "react";
import { Follow, User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ResetFollowKPIs() {
  const [status, setStatus] = useState('resetting');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resetKPIs = async () => {
      try {
        const currentUser = await User.me();
        
        console.log('[Reset] Starting follow KPI reset for user:', currentUser.id);
        setStatus('deleting-follows');
        
        // 1. Get all follow records involving this user
        const allFollows = await Follow.list();
        const userFollows = allFollows.filter(f => 
          f.follower_id === currentUser.id || f.followee_id === currentUser.id
        );
        
        console.log('[Reset] Found', userFollows.length, 'follow records to delete');
        
        // 2. Delete all follow records
        for (const follow of userFollows) {
          await Follow.delete(follow.id);
        }
        
        console.log('[Reset] Deleted all follow records');
        setStatus('updating-kpis');
        
        // 3. Reset KPIs to 0
        await User.updateMe({
          metrics_following: 0,
          metrics_followers: 0
        });
        
        console.log('[Reset] ✅ Follow KPIs reset complete');
        
        setResult({
          success: true,
          deletedRecords: userFollows.length
        });
        setStatus('complete');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 2000);
        
      } catch (error) {
        console.error('[Reset] ❌ Error resetting follow KPIs:', error);
        setResult({
          success: false,
          error: error.message
        });
        setStatus('error');
      }
    };
    
    resetKPIs();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="bg-[#1A1B23] rounded-2xl p-8 max-w-md w-full border border-[#2A2B35]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Reset Follow KPIs
        </h1>
        
        {status === 'resetting' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Iniciando reset...</p>
          </div>
        )}
        
        {status === 'deleting-follows' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Deletando registros de follow...</p>
          </div>
        )}
        
        {status === 'updating-kpis' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Atualizando KPIs...</p>
          </div>
        )}
        
        {status === 'complete' && result?.success && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-semibold mb-2">Reset completo!</p>
            <p className="text-gray-400 text-sm mb-1">
              {result.deletedRecords} registros deletados
            </p>
            <p className="text-gray-400 text-sm">
              KPIs resetados para 0
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Redirecionando para Home...
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-semibold mb-2">Erro no reset</p>
            <p className="text-gray-400 text-sm">
              {result?.error || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => navigate(createPageUrl("Home"))}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Voltar para Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}