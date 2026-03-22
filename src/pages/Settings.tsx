import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Save, Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiApi, setAiApi] = useState('gemini');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const savedApi = localStorage.getItem('selected_ai_api') || 'gemini';
    setAiApi(savedApi);
  }, [user, navigate]);

  const handleSave = () => {
    localStorage.setItem('selected_ai_api', aiApi);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-emerald-600" />
          Settings
        </h1>
        <p className="text-stone-600 mt-2">Manage your application preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">AI Provider</h2>
        <p className="text-sm text-stone-600 mb-6">
          Select which AI API you would like to use for reading and analyzing IDs.
        </p>

        <div className="space-y-4">
          <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${aiApi === 'gemini' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:bg-stone-50'}`}>
            <input
              type="radio"
              name="ai_api"
              value="gemini"
              checked={aiApi === 'gemini'}
              onChange={(e) => setAiApi(e.target.value)}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-stone-900">Google Gemini (Default)</span>
              <span className="block text-sm text-stone-500">Fast and accurate ID analysis using Gemini models.</span>
            </div>
          </label>

          <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${aiApi === 'openai' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:bg-stone-50'}`}>
            <input
              type="radio"
              name="ai_api"
              value="openai"
              checked={aiApi === 'openai'}
              onChange={(e) => setAiApi(e.target.value)}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-stone-900">OpenAI (GPT-4o)</span>
              <span className="block text-sm text-stone-500">High-performance vision capabilities.</span>
            </div>
          </label>

          <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${aiApi === 'anthropic' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:bg-stone-50'}`}>
            <input
              type="radio"
              name="ai_api"
              value="anthropic"
              checked={aiApi === 'anthropic'}
              onChange={(e) => setAiApi(e.target.value)}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <div className="ml-3">
              <span className="block text-sm font-medium text-stone-900">Anthropic (Claude 3.5 Sonnet)</span>
              <span className="block text-sm text-stone-500">Advanced reasoning and detail extraction.</span>
            </div>
          </label>
        </div>

        <div className="mt-8 flex items-center">
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Preferences
          </button>
          {saved && (
            <span className="ml-4 flex items-center text-emerald-600 text-sm font-medium animate-in fade-in">
              <Check className="w-4 h-4 mr-1" />
              Settings saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
