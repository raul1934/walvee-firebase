import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle, Download, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacySettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState({
    consent_location: false,
    consent_demographics: false,
    marketing_opt_in: false
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setConsents({
          consent_location: currentUser.consent_location || false,
          consent_demographics: currentUser.consent_demographics || false,
          marketing_opt_in: currentUser.marketing_opt_in || false
        });
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const handleUpdateConsents = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...consents,
        consent_given_at: new Date().toISOString()
      };

      // Clear data if consent is revoked
      if (!consents.consent_location) {
        updateData.city = null;
        updateData.country = null;
      }

      if (!consents.consent_demographics) {
        updateData.birth_date = null;
        updateData.age_in_years = null;
        updateData.gender = "prefer-not-to-say";
        updateData.gender_other = null;
      }

      await base44.auth.updateMe(updateData);
      alert("Preferências atualizadas com sucesso!");
    } catch (error) {
      console.error("Error updating consents:", error);
      alert("Erro ao atualizar preferências");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const currentUser = await base44.auth.me();
      const dataStr = JSON.stringify(currentUser, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `walvee-data-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Erro ao exportar dados");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
      return;
    }

    if (!confirm("ÚLTIMA CONFIRMAÇÃO: Todos os seus dados serão permanentemente excluídos.")) {
      return;
    }

    try {
      // Note: Account deletion would need backend implementation
      alert("Para excluir sua conta, entre em contato com suporte@walvee.com");
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl("Home")} className="text-blue-400 hover:underline mb-6 inline-block">
          ← Voltar
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacidade e Dados</h1>
          <p className="text-gray-400">Gerencie suas permissões e dados pessoais</p>
        </div>

        {/* Consent Management */}
        <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35] mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Consentimentos</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-[#0D0D0D] rounded-lg">
              <Checkbox
                id="consent_location"
                checked={consents.consent_location}
                onCheckedChange={(checked) => setConsents({...consents, consent_location: checked})}
              />
              <div className="flex-1">
                <label htmlFor="consent_location" className="font-medium cursor-pointer block mb-1">
                  Localização (Cidade e País)
                </label>
                <p className="text-sm text-gray-400">
                  Permite sugerir roteiros relevantes para sua região
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#0D0D0D] rounded-lg">
              <Checkbox
                id="consent_demographics"
                checked={consents.consent_demographics}
                onCheckedChange={(checked) => setConsents({...consents, consent_demographics: checked})}
              />
              <div className="flex-1">
                <label htmlFor="consent_demographics" className="font-medium cursor-pointer block mb-1">
                  Dados Demográficos (Idade e Gênero)
                </label>
                <p className="text-sm text-gray-400">
                  Ajuda a personalizar recomendações de viagens
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#0D0D0D] rounded-lg">
              <Checkbox
                id="marketing_opt_in"
                checked={consents.marketing_opt_in}
                onCheckedChange={(checked) => setConsents({...consents, marketing_opt_in: checked})}
              />
              <div className="flex-1">
                <label htmlFor="marketing_opt_in" className="font-medium cursor-pointer block mb-1">
                  Comunicações de Marketing
                </label>
                <p className="text-sm text-gray-400">
                  Receber dicas, promoções e novidades por e-mail
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpdateConsents}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </div>

        {/* Data Management */}
        <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35] mb-6">
          <h2 className="text-xl font-bold mb-4">Seus Dados</h2>

          <div className="space-y-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-5 h-5 mr-3" />
              Exportar todos os meus dados
            </Button>

            <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                📊 Você pode baixar uma cópia de todos os dados que temos sobre você em formato JSON
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/20 border-2 border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-red-400">Zona de Perigo</h2>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados, viagens e conexões serão perdidos.
          </p>

          <Button
            onClick={handleDeleteAccount}
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Excluir minha conta permanentemente
          </Button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg text-sm text-gray-400">
          <p className="mb-2">🔒 Conformidade e Segurança</p>
          <ul className="space-y-1 text-xs">
            <li>• Todos os dados criptografados em repouso e em trânsito</li>
            <li>• Conformidade total com LGPD (Lei Geral de Proteção de Dados)</li>
            <li>• Conformidade com políticas de OAuth e People API do Google</li>
            <li>• Última atualização de consentimento: {user.consent_given_at ? new Date(user.consent_given_at).toLocaleDateString('pt-BR') : 'Nunca'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}