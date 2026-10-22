"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function HomeAnnouncement() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="home-announcement" role="region" aria-label="Announcement">
      <span className="home-announcement-new">New</span>
      <p>
        A focused studio for the brand behind your market presence.{" "}
        <a href="/about">See the story →</a>
      </p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => setOpen(false)}
      >
        <X size={15} />
      </button>
    </div>
  );
}
