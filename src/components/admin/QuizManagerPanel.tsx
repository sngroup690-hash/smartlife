"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import type { QuizQuestion, ModuleQuiz } from "@/lib/quiz-store";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

function genId() {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

type ModuleInfo = { id: string; titre: string };

const inputCls =
  "w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E8B800] transition-colors text-sm";

function QuestionEditor({
  question,
  onChange,
  onDelete,
  index,
}: {
  question: QuizQuestion;
  onChange: (q: QuizQuestion) => void;
  onDelete: () => void;
  index: number;
}) {
  function setOption(i: number, val: string) {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts });
  }

  function addOption() {
    if (question.options.length >= 4) return;
    onChange({ ...question, options: [...question.options, ""] });
  }

  function removeOption(i: number) {
    if (question.options.length <= 2) return;
    const opts = question.options.filter((_, idx) => idx !== i);
    const newCorrect = question.correctIndex >= opts.length ? 0 : question.correctIndex === i ? 0 : question.correctIndex > i ? question.correctIndex - 1 : question.correctIndex;
    onChange({ ...question, options: opts, correctIndex: newCorrect });
  }

  return (
    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[#E8B800] text-xs font-bold mt-2 shrink-0">Q{index + 1}</span>
        <input
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          className={`${inputCls} flex-1`}
          placeholder="Énoncé de la question…"
        />
        <button onClick={onDelete} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg transition-colors shrink-0 mt-1">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="space-y-2 pl-5">
        <p className="text-gray-500 text-xs">Options de réponse</p>
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...question, correctIndex: i })}
              className={`w-5 h-5 rounded-full border flex-shrink-0 transition-all flex items-center justify-center ${
                question.correctIndex === i
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-gray-500 hover:border-emerald-500"
              }`}
              title="Marquer comme bonne réponse"
            >
              {question.correctIndex === i && <CheckCircle size={12} className="text-white" />}
            </button>
            <input
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              className={inputCls}
              placeholder={`Option ${i + 1}${i === question.correctIndex ? " ✓ (correcte)" : ""}`}
            />
            {question.options.length > 2 && (
              <button onClick={() => removeOption(i)} className="p-1 text-gray-700 hover:text-red-400 rounded transition-colors shrink-0">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
        {question.options.length < 4 && (
          <button onClick={addOption} className="text-[#E8B800] text-xs hover:text-[#27A827] transition-colors flex items-center gap-1">
            <Plus size={11} /> Ajouter une option
          </button>
        )}
      </div>

      <div className="pl-5">
        <input
          value={question.explication ?? ""}
          onChange={(e) => onChange({ ...question, explication: e.target.value })}
          className={inputCls}
          placeholder="Explication après la réponse (optionnel)"
        />
      </div>
    </div>
  );
}

export function QuizManagerPanel({ formationId }: { formationId: string }) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [quizData, setQuizData] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [videoRes, quizRes] = await Promise.all([
        fetch(`/api/formation/${formationId}/videos`),
        fetch(`/api/formation/${formationId}/quiz`),
      ]);
      const videoData = await videoRes.json();
      const quizJson = await quizRes.json();

      const rawModules: { id: string; titre: string }[] = (videoData.modules ?? []).map(
        (m: { id: string; titre: string }) => ({ id: m.id, titre: m.titre })
      );
      setModules(rawModules);

      const map: Record<string, QuizQuestion[]> = {};
      for (const mod of rawModules) map[mod.id] = [];
      for (const mq of (quizJson.modules ?? []) as ModuleQuiz[]) {
        map[mq.moduleId] = mq.questions;
      }
      setQuizData(map);
      setExpandedModules(new Set(rawModules.map((m) => m.id)));
    } finally {
      setLoading(false);
    }
  }

  function addQuestion(moduleId: string) {
    const q: QuizQuestion = {
      id: genId(),
      question: "",
      options: ["", ""],
      correctIndex: 0,
    };
    setQuizData((prev) => ({ ...prev, [moduleId]: [...(prev[moduleId] ?? []), q] }));
  }

  function updateQuestion(moduleId: string, idx: number, q: QuizQuestion) {
    setQuizData((prev) => {
      const qs = [...(prev[moduleId] ?? [])];
      qs[idx] = q;
      return { ...prev, [moduleId]: qs };
    });
  }

  function deleteQuestion(moduleId: string, idx: number) {
    setQuizData((prev) => {
      const qs = (prev[moduleId] ?? []).filter((_, i) => i !== idx);
      return { ...prev, [moduleId]: qs };
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      const modulesPayload: ModuleQuiz[] = Object.entries(quizData)
        .filter(([, qs]) => qs.length > 0)
        .map(([moduleId, questions]) => ({ moduleId, questions }));

      await fetch(`/api/formation/${formationId}/quiz?password=${ADMIN_PASSWORD}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: modulesPayload }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Chargement des modules…
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="py-6 text-center text-gray-600 text-sm">
        Aucun module vidéo trouvé. Ajoutez d&apos;abord des modules dans &quot;Vidéos&quot;.
      </div>
    );
  }

  const totalQuestions = Object.values(quizData).reduce((n, qs) => n + qs.length, 0);

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs">{totalQuestions} question{totalQuestions !== 1 ? "s" : ""} au total</p>
        <button
          onClick={saveAll}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-[#E8B800] hover:bg-[#27A827] text-black disabled:opacity-50"
          }`}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Enregistré !" : saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {modules.map((mod, modIdx) => {
        const questions = quizData[mod.id] ?? [];
        const isExpanded = expandedModules.has(mod.id);
        return (
          <div key={mod.id} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs shrink-0">Module {modIdx + 1}</span>
                <span className="text-white text-sm font-medium">{mod.titre}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-3 border-t border-white/5">
                {questions.length === 0 && (
                  <p className="text-gray-600 text-xs text-center py-3">Aucune question pour ce module.</p>
                )}
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={i}
                    onChange={(updated) => updateQuestion(mod.id, i, updated)}
                    onDelete={() => deleteQuestion(mod.id, i)}
                  />
                ))}
                <button
                  onClick={() => addQuestion(mod.id)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-[#E8B800]/40 text-[#E8B800] hover:bg-[#E8B800]/5 rounded-xl text-xs transition-all w-full justify-center"
                >
                  <Plus size={13} /> Ajouter une question
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
