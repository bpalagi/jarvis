'use client'

import { useState, useEffect } from 'react'
import { getPersonalizePrompt, updatePersonalizePrompt, PersonalizePrompt } from '@/utils/api'

export default function PersonalizePage() {
  const [prompt, setPrompt] = useState<PersonalizePrompt | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const promptData = await getPersonalizePrompt();
        setPrompt(promptData);
        setEditorContent(promptData.prompt);
      } catch (error) {
        console.error("Failed to fetch personalize prompt:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!prompt || saving || !isDirty) return;
    
    try {
      setSaving(true);
      await updatePersonalizePrompt({ 
        prompt: editorContent 
      });

      setPrompt(prev => 
        prev ? { ...prev, prompt: editorContent } : null
      );
      setIsDirty(false);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save personalize prompt. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100">
        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personalize</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isDirty && !saving
                    ? 'bg-gray-500 text-white cursor-default'
                    : saving 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {!isDirty && !saving ? 'Saved' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white">
        <div className="h-full px-8 py-6 flex flex-col">
          <textarea
            value={editorContent}
            onChange={handleEditorChange}
            className="w-full flex-1 text-sm text-gray-900 border-0 resize-none focus:outline-none bg-transparent font-mono leading-relaxed"
            placeholder="Enter your custom prompt here..."
          />
        </div>
      </div>
    </div>
  );
}