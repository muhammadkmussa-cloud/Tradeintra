"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { MAX_LOGO_LENGTH } from "@/lib/studio";

const ACCEPTED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const sizes = [512, 384, 256];
      const qualities = [0.86, 0.72, 0.6];
      for (const size of sizes) {
        const scale = Math.min(1, size / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of qualities) {
          const data = canvas.toDataURL("image/webp", quality);
          if (data.length <= MAX_LOGO_LENGTH) {
            resolve(data);
            return;
          }
        }
      }
      reject(new Error("That logo is too detailed. Try a simpler image."));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be read."));
    };
    image.src = url;
  });
}

export function LogoUpload({
  name,
  value,
  onChange,
  error,
}: {
  name: string;
  value?: string;
  onChange: (logo: string | undefined) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(file: File | undefined) {
    if (!file) return;
    setMessage("");
    if (!ACCEPTED.has(file.type)) {
      setMessage("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setMessage("That image is too large. Choose one under 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const logo = await resize(file);
      onChange(logo);
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "That logo could not be prepared.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="logo-upload">
      <div className="logo-preview" aria-hidden={!value}>
        {value ? (
          <img src={value} alt={`${name || "Site"} logo preview`} />
        ) : (
          <span>{(name || "Your brand").charAt(0)}</span>
        )}
      </div>
      <div className="logo-copy">
        <strong>Your logo</strong>
        <p>PNG, JPG, or WebP. We will resize it for the web.</p>
        <div className="logo-actions">
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void choose(event.dataTransfer.files[0]);
            }}
          >
            {value ? <Upload size={14} /> : <ImagePlus size={14} />}
            {busy ? "Preparing…" : value ? "Replace logo" : "Upload logo"}
          </button>
          {value ? (
            <button
              className="text-link danger"
              type="button"
              disabled={busy}
              onClick={() => {
                onChange(undefined);
                setMessage("");
              }}
            >
              <Trash2 size={13} /> Remove
            </button>
          ) : null}
        </div>
        <input
          ref={input}
          className="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Upload logo"
          onChange={(event) => void choose(event.target.files?.[0])}
        />
        {error || message ? (
          <small className="field-error" role="alert">
            {error || message}
          </small>
        ) : null}
      </div>
    </div>
  );
}
