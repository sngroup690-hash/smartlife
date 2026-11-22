"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, List, Image as ImageIcon, Loader2,
  Link as LinkIcon, AlignLeft, AlignCenter, Trash2,
} from "lucide-react";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  adminPassword,
  minHeight = 120,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  adminPassword: string;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [imgToolbar, setImgToolbar] = useState<{ img: HTMLImageElement; top: number; left: number } | null>(null);
  const [customWidth, setCustomWidth] = useState("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  function emit() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  // Save cursor position before toolbar button clicks
  function saveRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  // Restore cursor, then focus
  function restoreRange() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const range = savedRangeRef.current;
    if (range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  function exec(cmd: string, value?: string) {
    restoreRange();
    document.execCommand(cmd, false, value ?? undefined);
    emit();
  }

  // Upload a File object and insert <img> at cursor
  const uploadAndInsert = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-desc-image", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: fd,
      });
      const data = await res.json();
      if (data.url) return data.url;
      alert(data.error ?? "Erreur upload image.");
    } catch {
      alert("Erreur réseau lors de l'upload.");
    }
    return null;
  }, [adminPassword]);

  // Upload base64 data URI (from Word paste / clipboard screenshot)
  async function uploadDataUri(dataUri: string, mimeType: string): Promise<string | null> {
    const res = await fetch(dataUri);
    const blob = await res.blob();
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const file = new File([blob], `pasted.${ext}`, { type: mimeType });
    return uploadAndInsert(file);
  }

  // Button: pick image from PC
  async function handleImageFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image trop lourde (max 5 Mo).");
      return;
    }
    setUploading(true);
    restoreRange();
    const url = await uploadAndInsert(file);
    if (url) {
      document.execCommand(
        "insertHTML", false,
        `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" /><br/>`
      );
      emit();
    }
    setUploading(false);
  }

  // Paste handler: preserve formatting + upload embedded images
  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();

    // 1. Direct image paste (screenshot, copied image file)
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((it) => it.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        setPasting(true);
        const url = await uploadAndInsert(file);
        if (url) {
          document.execCommand(
            "insertHTML", false,
            `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" /><br/>`
          );
          emit();
        }
        setPasting(false);
        return;
      }
    }

    // 2. HTML paste (from website, Word, Google Docs…)
    const html = e.clipboardData.getData("text/html");
    if (html) {
      setPasting(true);
      try {
        const cleaned = await processHtmlPaste(html);
        document.execCommand("insertHTML", false, cleaned);
        emit();
      } finally {
        setPasting(false);
      }
      return;
    }

    // 3. Plain text fallback
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  }

  // Process pasted HTML: upload data-URI images, style external imgs, strip junk
  async function processHtmlPaste(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove script/style/meta/link tags
    doc.querySelectorAll("script,style,meta,link,head").forEach((el) => el.remove());

    // Process images
    const imgs = Array.from(doc.querySelectorAll("img"));
    for (const img of imgs) {
      const src = img.getAttribute("src") ?? "";

      if (src.startsWith("data:image/")) {
        // Base64 embedded image (Word, Google Docs, etc.) → upload
        const mimeMatch = src.match(/^data:(image\/[a-zA-Z+]+);/);
        const mime = mimeMatch?.[1] ?? "image/png";
        try {
          const url = await uploadDataUri(src, mime);
          if (url) {
            img.setAttribute("src", url);
          } else {
            img.remove();
            continue;
          }
        } catch {
          img.remove();
          continue;
        }
      }
      // Style all images uniformly
      img.setAttribute("style", "max-width:100%;border-radius:8px;margin:8px 0;display:block;");
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.removeAttribute("class");
    }

    // Clean Word/Outlook specific attributes but preserve inline bold/italic/color
    doc.querySelectorAll("[class]").forEach((el) => {
      // Keep only img classes removed above; remove others
      if (el.tagName !== "IMG") el.removeAttribute("class");
    });
    doc.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

    return doc.body.innerHTML;
  }

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      const editorRect = editorRef.current!.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      setImgToolbar({
        img,
        top: imgRect.top - editorRect.top - 44,
        left: Math.max(0, imgRect.left - editorRect.left),
      });
    } else {
      setImgToolbar(null);
    }
  }

  function applyImgWidth(pct: number | string) {
    if (!imgToolbar) return;
    const img = imgToolbar.img;
    img.style.width = typeof pct === "number" ? `${pct}%` : pct;
    img.style.maxWidth = "100%";
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.style.height = "auto";
    emit();
  }

  function applyImgAlign(align: "left" | "center" | "right") {
    if (!imgToolbar) return;
    const img = imgToolbar.img;
    if (align === "left") { img.style.float = "left"; img.style.margin = "0 12px 8px 0"; img.style.display = ""; }
    else if (align === "right") { img.style.float = "right"; img.style.margin = "0 0 8px 12px"; img.style.display = ""; }
    else { img.style.float = ""; img.style.margin = "8px auto"; img.style.display = "block"; }
    emit();
  }

  function applyImgOrientation(mode: "paysage" | "portrait" | "carre") {
    if (!imgToolbar) return;
    const img = imgToolbar.img;
    img.style.float = "";
    img.style.margin = "8px auto";
    img.style.display = "block";
    img.removeAttribute("width");
    img.removeAttribute("height");
    if (mode === "paysage") { img.style.width = "100%"; img.style.maxWidth = "100%"; img.style.aspectRatio = "16/9"; img.style.objectFit = "cover"; }
    else if (mode === "portrait") { img.style.width = "50%"; img.style.maxWidth = "50%"; img.style.aspectRatio = "3/4"; img.style.objectFit = "cover"; }
    else { img.style.width = "50%"; img.style.maxWidth = "50%"; img.style.aspectRatio = "1/1"; img.style.objectFit = "cover"; }
    emit();
  }

  function deleteImg() {
    if (!imgToolbar) return;
    imgToolbar.img.remove();
    setImgToolbar(null);
    emit();
  }

  const busy = uploading || pasting;

  return (
    <div className="border border-white/20 rounded-xl overflow-hidden focus-within:border-[#E8B800] transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 bg-white/5 border-b border-white/10 flex-wrap">
        <ToolBtn title="Gras (Ctrl+B)" onPress={() => exec("bold")}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Italique (Ctrl+I)" onPress={() => exec("italic")}>
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn title="Liste à puces" onPress={() => exec("insertUnorderedList")}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Aligner à gauche" onPress={() => exec("justifyLeft")}>
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn title="Centrer" onPress={() => exec("justifyCenter")}>
          <AlignCenter size={13} />
        </ToolBtn>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Heading buttons */}
        {(["H2", "H3"] as const).map((tag) => (
          <button
            key={tag}
            type="button"
            title={tag === "H2" ? "Titre" : "Sous-titre"}
            onMouseDown={(e) => {
              e.preventDefault();
              saveRange();
              exec("formatBlock", tag);
            }}
            className="px-1.5 py-1 rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold"
          >
            {tag}
          </button>
        ))}
        <button
          type="button"
          title="Paragraphe normal"
          onMouseDown={(e) => {
            e.preventDefault();
            saveRange();
            exec("formatBlock", "P");
          }}
          className="px-1.5 py-1 rounded hover:bg-white/10 text-gray-400 hover:text-white text-xs"
        >
          ¶
        </button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Couleur de texte */}
        <label title="Couleur du texte" className="relative cursor-pointer p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white flex items-center gap-1 text-xs">
          <span className="w-3 h-3 rounded-sm border border-white/30" style={{ background: "currentColor" }}>
            <span className="sr-only">A</span>
          </span>
          <span className="text-xs font-bold">A</span>
          <input
            type="color"
            defaultValue="#E8B800"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onMouseDown={(e) => { e.stopPropagation(); saveRange(); }}
            onChange={(e) => { exec("foreColor", e.target.value); }}
          />
        </label>
        <button
          type="button"
          title="Remettre couleur normale"
          onMouseDown={(e) => { e.preventDefault(); saveRange(); exec("foreColor", "#e5e7eb"); }}
          className="px-1 py-1 rounded hover:bg-white/10 text-gray-500 hover:text-white text-xs"
        >
          ✕A
        </button>

        {/* Couleur de fond du texte (surbrillance) */}
        <label
          title="Couleur de fond du texte (surbrillance)"
          className="relative cursor-pointer p-1.5 rounded hover:bg-white/10 flex items-center gap-1 text-xs"
        >
          <span className="font-bold text-[11px] px-0.5 rounded-sm leading-4" style={{ backgroundColor: "#FFD700", color: "#111" }}>A</span>
          <input
            type="color"
            defaultValue="#FFD700"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onMouseDown={(e) => { e.stopPropagation(); saveRange(); }}
            onChange={(e) => { exec("hiliteColor", e.target.value); }}
          />
        </label>
        <button
          type="button"
          title="Supprimer la couleur de fond"
          onMouseDown={(e) => { e.preventDefault(); saveRange(); exec("hiliteColor", "transparent"); }}
          className="px-1 py-1 rounded hover:bg-white/10 text-gray-500 hover:text-white text-xs"
        >
          ✕<span className="font-bold text-[10px] px-0.5 rounded-sm leading-4" style={{ backgroundColor: "#FFD700", color: "#111" }}>A</span>
        </button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Link */}
        <button
          type="button"
          title="Insérer un lien"
          onMouseDown={(e) => {
            e.preventDefault();
            saveRange();
            const url = prompt("URL du lien :");
            if (url) exec("createLink", url);
          }}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-[#E8B800]"
        >
          <LinkIcon size={13} />
        </button>

        {/* Image from PC */}
        <button
          type="button"
          title="Ajouter une image depuis votre PC (max 5 Mo)"
          disabled={busy}
          onMouseDown={(e) => {
            e.preventDefault();
            saveRange();
            fileInputRef.current?.click();
          }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-[#E8B800] text-xs disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
          Image PC
        </button>

        {pasting && (
          <span className="flex items-center gap-1 text-xs text-[#E8B800] ml-1">
            <Loader2 size={11} className="animate-spin" /> Traitement…
          </span>
        )}

        <span className="text-gray-700 text-xs ml-auto">
          Coller depuis Word/Web : Ctrl+V
        </span>
      </div>

      {/* Editable area */}
      <div className="relative">
        {/* Toolbar flottante redimensionnement image */}
        {imgToolbar && (
          <div
            className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 flex flex-col gap-2"
            style={{ top: Math.max(0, imgToolbar.top), left: imgToolbar.left, minWidth: 300 }}
          >
            {/* Ligne 1 : taille rapide + taille libre */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 text-xs w-10 flex-shrink-0 font-medium">Taille</span>
              {([["25%","XS"],["50%","S"],["75%","M"],["100%","L"]] as [string,string][]).map(([pct, label]) => (
                <button key={pct} type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyImgWidth(pct); }}
                  className="px-2.5 py-0.5 text-xs text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-colors">
                  {label}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number" min="5" max="100"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customWidth) applyImgWidth(`${customWidth}%`); } }}
                  placeholder="%" className="w-12 px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                />
                <button type="button"
                  onMouseDown={(e) => { e.preventDefault(); if (customWidth) applyImgWidth(`${customWidth}%`); }}
                  className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 font-semibold transition-colors">
                  OK
                </button>
              </div>
            </div>

            {/* Ligne 2 : orientation */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs w-10 flex-shrink-0 font-medium">Format</span>
              {([
                ["paysage","Paysage 16:9"],
                ["portrait","Portrait 3:4"],
                ["carre","Carré 1:1"],
              ] as ["paysage"|"portrait"|"carre", string][]).map(([mode, label]) => (
                <button key={mode} type="button"
                  onMouseDown={(e) => { e.preventDefault(); applyImgOrientation(mode); }}
                  className="px-2.5 py-0.5 text-xs text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-colors">
                  {label}
                </button>
              ))}
            </div>

            {/* Ligne 3 : alignement */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs w-10 flex-shrink-0 font-medium">Aligner</span>
              {(["left","center","right"] as const).map((a) => (
                <button key={a} type="button" onMouseDown={(e) => { e.preventDefault(); applyImgAlign(a); }}
                  className="px-3 py-0.5 text-xs text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-colors">
                  {a === "left" ? "◀ Gauche" : a === "center" ? "▬ Centre" : "Droite ▶"}
                </button>
              ))}
            </div>

            {/* Ligne 4 : supprimer + fermer */}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
              <button type="button"
                onMouseDown={(e) => { e.preventDefault(); deleteImg(); }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 font-semibold bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                <Trash2 size={11} /> Supprimer l&apos;image
              </button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setImgToolbar(null); }}
                className="text-gray-400 hover:text-gray-700 text-xs px-2 font-medium transition-colors">✕ Fermer</button>
            </div>
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onPaste={handlePaste}
          onMouseUp={saveRange}
          onKeyUp={saveRange}
          onClick={handleEditorClick}
          className="w-full p-3 text-white text-sm focus:outline-none leading-relaxed
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:cursor-pointer
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
            [&_b]:font-bold [&_strong]:font-bold
            [&_i]:italic [&_em]:italic
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#E8B800] [&_h2]:mt-4 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1
            [&_a]:text-[#E8B800] [&_a]:underline
            [&_p]:my-1"
          style={{ minHeight }}
        />
        {!value && placeholder && (
          <div className="absolute top-3 left-3 text-gray-600 text-sm pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ToolBtn({
  title, onPress, children,
}: {
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
    >
      {children}
    </button>
  );
}
