import React, { useState, useEffect, useRef } from "react";
import supabase from '@/lib/supabaseClient';

interface ChipEditorProps {
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  badgeClass?: string;
  ariaLabel?: string;
  suggestionType?: "tag" | "genre";
}

export default function ChipEditor({
  items = [],
  placeholder,
  onAdd,
  onRemove,
  badgeClass = "",
  ariaLabel = "",
  suggestionType = "tag"
}: ChipEditorProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchSuggestions(q: string) {
    if (!q || q.trim().length === 0) { setSuggestions([]); return; }
    setLoadingSug(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .ilike('name', `%${q}%`)
        .eq('type', suggestionType)
        .limit(10);
      if (error) throw error;
      setSuggestions((data || []).map(x => x.name));
      setHighlight(-1);
    } catch (err) {
      console.error('fetchSuggestions', err);
      setSuggestions([]);
    } finally { setLoadingSug(false); }
  }

  async function ensureTagExists(name: string): Promise<string | null> {
    const n = (name || "").trim();
    if (!n) return null;
    try {
      const { data: found, error: fErr } = await supabase
        .from('tags')
        .select('id,name')
        .ilike('name', n)
        .eq('type', suggestionType)
        .limit(1)
        .maybeSingle();
      if (fErr) throw fErr;
      if (found) return found.name;

      const { data: ins, error: insErr } = await supabase
        .from('tags')
        .insert([{ name: n, type: suggestionType }])
        .select()
        .maybeSingle();
      if (insErr) {
        // race: try read again
        const { data: retry } = await supabase
          .from('tags')
          .select('id,name')
          .ilike('name', n)
          .eq('type', suggestionType)
          .limit(1)
          .maybeSingle();
        return retry?.name ?? n;
      }
      return ins?.name ?? n;
    } catch (err) {
      console.error('ensureTagExists', err);
      return name;
    }
  }

  function commitValue(v: string) {
    if (!v || !v.trim()) return;
    (async () => {
      const name = await ensureTagExists(v.trim());
      if (name) onAdd(name);
      setValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlight(-1);
    })();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && suggestions[highlight]) commitValue(suggestions[highlight]);
      else commitValue(value);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlight(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlight(-1);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    setShowSuggestions(true);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchSuggestions(v), 180);
  }

  function handlePickSuggestion(name: string) { commitValue(name); }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) { setShowSuggestions(false); setHighlight(-1); }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div aria-label={ariaLabel} style={{ position: 'relative' }} ref={containerRef}>
      <div className="chips">
        {items.map((it) => (
          <span key={it} className={`chip ${badgeClass}`}>
            {it}
            <button className="chipRemove" title={`Eliminar ${it}`} onClick={() => onRemove(it)} aria-label={`Eliminar ${it}`}>×</button>
          </span>
        ))}
      </div>

      <input
        className="chipInput"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => { if (value) fetchSuggestions(value); setShowSuggestions(true); }}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
      />

      {showSuggestions && (loadingSug || suggestions.length > 0 || value.trim()) && (
        <div className="chip-suggestions" role="listbox" style={{
          position: 'absolute', zIndex: 50, background: 'var(--card-bg,#0b0b0b)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginTop: 6,
          width: '100%', maxHeight: 220, overflowY: 'auto', padding: '6px'
        }}>
          {loadingSug && <div className="suggestionItem">Buscando...</div>}
          {!loadingSug && suggestions.length === 0 && value.trim() && (<div className="suggestionItem suggestion-empty">Crear «{value.trim()}»</div>)}
          {!loadingSug && suggestions.map((s, idx) => (
            <button key={s} type="button" className={`suggestionItem ${highlight === idx ? 'highlight' : ''}`}
              onMouseDown={(ev) => { ev.preventDefault(); handlePickSuggestion(s); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', background: highlight === idx ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {s}
            </button>
          ))}
          {!loadingSug && (!suggestions || suggestions.length === 0) && value.trim() && (
            <button type="button" onMouseDown={(ev) => { ev.preventDefault(); handlePickSuggestion(value.trim()); }}
              className="suggestionItem create-new" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              Crear «{value.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
