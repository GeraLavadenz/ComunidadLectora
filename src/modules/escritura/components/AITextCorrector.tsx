"use client";

import React, { useState } from "react";

type Mode = "correct" | "improve" | "paraphrase";

export default function AITextCorrector({
  initialText = "",
  onApply,
  apiEndpoint = "/api/ai/correct",
  maxTokens = 800,
}: {
  initialText?: string;
  onApply: (newText: string) => void;
  apiEndpoint?: string; // endpoint server que manejará la llamada a la IA
  maxTokens?: number;
}) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<Mode>("correct");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setSuggestion(null);

    const trimmed = (text || "").trim();
    if (!trimmed) {
      setError("No hay texto para enviar a la IA.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, mode, maxTokens }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`IA request failed: ${res.status} ${body}`);
      }

      const payload = await res.json();
      // payload debería tener { result: "texto generado" }
      const resultText = payload?.result ?? "";
      setSuggestion(resultText);
    } catch (err: any) {
      console.error("AI error", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aiTextCorrector" aria-label="Editor IA">
      <div className="aiToolbar">
        <label className={`modeBtn ${mode === "correct" ? "active" : ""}`}>
          <input type="radio" name="ai-mode" value="correct" checked={mode === "correct"} onChange={() => setMode("correct")} />
          Corregir (ortografía / gramática)
        </label>
        <label className={`modeBtn ${mode === "improve" ? "active" : ""}`}>
          <input type="radio" name="ai-mode" value="improve" checked={mode === "improve"} onChange={() => setMode("improve")} />
          Mejorar estilo
        </label>
        <label className={`modeBtn ${mode === "paraphrase" ? "active" : ""}`}>
          <input type="radio" name="ai-mode" value="paraphrase" checked={mode === "paraphrase"} onChange={() => setMode("paraphrase")} />
          Parafrasear
        </label>

        <div className="aiActions">
          <button className="btnGhost" onClick={() => { setText(initialText); setSuggestion(null); }}>Reset</button>
          <button className="btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generando..." : "Generar con IA"}
          </button>
        </div>
      </div>

      <div className="aiEditorRow">
        <textarea
          className="textarea"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe el texto aquí o pega el borrador..."
        />
      </div>

      {error && <div className="aiError" role="alert">{error}</div>}

      <div className="aiSuggestionWrap">
        <h4>Resultado IA</h4>
        {suggestion ? (
          <>
            <pre className="aiSuggestion">{suggestion}</pre>
            <div className="aiSuggestionBtns">
              <button className="btn" onClick={() => { onApply(suggestion); setText(suggestion); setSuggestion(null); }}>
                Aplicar al editor
              </button>
              <button className="btnGhost" onClick={() => setSuggestion(null)}>Cerrar</button>
            </div>
          </>
        ) : (
          <p className="muted">Pulsa "Generar con IA" para obtener una sugerencia.</p>
        )}
      </div>
    </div>
  );
}
