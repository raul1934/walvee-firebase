import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ResetLikes() {
  const [status, setStatus] = useState('resetting');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resetLikes = async () => {
      try {
        console.log('[Reset Likes] Starting reset');
        setStatus('deleting-likes');
        
        // 1. Get all like records
        const allLikes = await base44.entities.TripLike.list();
        
        console.log('[Reset Likes] Found', allLikes.length, 'like records to delete');
        
        // 2. Delete all like records
        for (const like of allLikes) {
          await base44.entities.TripLike.delete(like.id);
        }
        
        console.log('[Reset Likes] Deleted all like records');
        setStatus('updating-trips');
        
        // 3. Reset all trips likes to 0
        const allTrips = await base44.entities.Trip.list();
        
        for (const trip of allTrips) {
          await base44.entities.Trip.update(trip.id, { likes: 0 });
        }
        
        console.log('[Reset Likes] Reset', allTrips.length, 'trips to 0 likes');
        
        setResult({
          success: true,
          deletedRecords: allLikes.length,
          updatedTrips: allTrips.length
        });
        setStatus('complete');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 2000);
        
      } catch (error) {
        console.error('[Reset Likes] ❌ Error:', error);
        setResult({
          success: false,
          error: error.message
        });
        setStatus('error');
      }
    };
    
    resetLikes();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <div className="bg-[#1A1B23] rounded-2xl p-8 max-w-md w-full border border-[#2A2B35]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Reset All Likes
        </h1>
        
        {status === 'resetting' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Iniciando reset...</p>
          </div>
        )}
        
        {status === 'deleting-likes' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Deletando registros de likes...</p>
          </div>
        )}
        
        {status === 'updating-trips' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-300">Atualizando contadores das viagens...</p>
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
              {result.deletedRecords} likes deletados
            </p>
            <p className="text-gray-400 text-sm">
              {result.updatedTrips} viagens atualizadas
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
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
            >
              Voltar para Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}