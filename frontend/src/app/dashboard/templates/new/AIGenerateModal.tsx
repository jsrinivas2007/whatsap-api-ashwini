import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/Loader';

interface AIGenerateModalProps {
  type: 'text' | 'image';
  onClose: () => void;
  onUseResult: (result: string) => void;
}

export default function AIGenerateModal({ type, onClose, onUseResult }: AIGenerateModalProps) {
  const [providers, setProviders] = useState<{id: string, name: string}[]>([]);
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const [savedKeys, setSavedKeys] = useState<{id: string, provider: string}[]>([]);
  const useSavedKey = savedKeys.some(k => k.provider === provider);

  useEffect(() => {
    fetch(`/api/ai-generate/providers?type=${type}`)
      .then(r => r.json())
      .then(data => {
        setProviders(data);
        if (data.length > 0) setProvider(data[0].id);
      })
      .catch(console.error);

    fetch('/api/ai-provider-keys', { headers: { 'x-user-id': 'mock-user-id' } })
      .then(r => r.json())
      .then(setSavedKeys)
      .catch(console.error);
  }, [type]);

  const handleGenerate = async () => {
    if (!prompt || !provider) return;
    if (!useSavedKey && !apiKey) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = type === 'text' ? '/api/ai-generate/text' : '/api/ai-generate/image';
      const payload = {
        provider,
        api_key: apiKey,
        use_saved: useSavedKey,
        remember_key: rememberKey && !useSavedKey,
        prompt,
        size: type === 'image' ? size : undefined,
        reference_image: type === 'image' ? (referenceImage || undefined) : undefined
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'mock-user-id' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Generation failed');
      }

      setResult(type === 'text' ? data.result : data.image_reference);

      // If we saved a new key, refresh the saved keys
      if (payload.remember_key) {
        fetch('/api/ai-provider-keys', { headers: { 'x-user-id': 'mock-user-id' } })
          .then(r => r.json())
          .then(setSavedKeys)
          .catch(console.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = async () => {
    if (!result) return;
    if (type === 'text') {
      onUseResult(result);
      onClose();
    } else {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/ai-generate/image/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_reference: result })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to use image');
        onUseResult(data.preview_url); // Simulating return of image handle/url
        onClose();
      } catch (err: any) {
        setError(err.message);
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex w-full max-w-[500px] flex-col rounded-xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles className="h-5 w-5 text-emerald-500" /> Generate with AI
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 p-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-3 rounded-[8px] bg-red-50 p-3 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-[13px] leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground">AI Provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] outline-none focus:border-emerald-500"
            >
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground flex items-center justify-between">
              API Key
              {useSavedKey && <span className="text-[11px] font-medium text-emerald-600">Using saved key</span>}
            </label>
            {!useSavedKey ? (
              <>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] outline-none focus:border-emerald-500"
                />
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input type="checkbox" checked={rememberKey} onChange={e => setRememberKey(e.target.checked)} className="rounded border-border accent-emerald-500" />
                  <span className="text-[12px] text-muted-foreground">Remember this key for next time</span>
                </label>
              </>
            ) : (
              <button type="button" onClick={() => {
                fetch(`/api/ai-provider-keys/${provider}`, { method: 'DELETE', headers: { 'x-user-id': 'mock-user-id' } }).then(() => {
                  setSavedKeys(prev => prev.filter(k => k.provider !== provider));
                });
              }} className="text-left text-[12px] text-red-500 hover:underline w-fit">
                Remove saved key
              </button>
            )}
          </div>

          {type === 'image' && (
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-foreground">Aspect Ratio</label>
              <select value={size} onChange={e => setSize(e.target.value)} className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] outline-none focus:border-emerald-500">
                <option value="1:1">1:1 (Square)</option>
                <option value="16:9">16:9 (Landscape)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={type === 'text' ? 'Describe the header message you want...' : 'Describe the image you want for this template header...'}
              className="h-24 w-full rounded-[8px] border border-border bg-background p-3 text-[13px] outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {type === 'image' && (provider === 'stability' || provider === 'custom') && (
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-foreground">Reference Image (optional)</label>
              <div className="relative flex min-h-[80px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-background p-4 text-center transition-colors hover:bg-muted/50">
                {referenceImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={referenceImage} alt="Reference preview" className="max-h-[100px] rounded-[4px] object-contain" />
                    <button type="button" onClick={() => setReferenceImage(null)} className="text-[11px] font-medium text-red-500 hover:underline">Remove Image</button>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-muted-foreground">Click to browse or drag and drop</p>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setReferenceImage(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {type === 'image' && provider === 'openai' && (
            <p className="text-[11px] text-muted-foreground italic">Note: OpenAI (DALL-E) does not support reference images.</p>
          )}

          {result && (
            <div className="mt-2 flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-foreground">Generated Result</label>
              {type === 'text' ? (
                <div className="rounded-[8px] border border-emerald-500/30 bg-emerald-50 p-3 text-[13px] text-emerald-900 dark:bg-emerald-900/10 dark:text-emerald-300">
                  {result}
                </div>
              ) : (
                <div className="rounded-[8px] border border-border overflow-hidden bg-background flex items-center justify-center p-2">
                  <img src={result} alt="Generated result" className="max-h-[200px] object-contain rounded-[4px]" />
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-border p-4 bg-muted/30">
          {!result ? (
            <button
              disabled={isGenerating || !prompt || !provider || (!useSavedKey && !apiKey)}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-[8px] bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <><ButtonLoader /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate</>}
            </button>
          ) : (
            <>
              <button
                disabled={isGenerating}
                onClick={handleGenerate}
                className="rounded-[8px] border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                disabled={isGenerating}
                onClick={handleUse}
                className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <><ButtonLoader /> Finalizing...</> : 'Use This'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
