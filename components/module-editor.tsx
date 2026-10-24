"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import type { Config } from "@/lib/studio";
import {
  defaultModuleContent,
  MODULE_DEFINITIONS,
  normalizeModuleContent,
  type Feature,
  type ModuleContent,
  type ModuleKey,
  type Step,
} from "@/lib/studio-modules";

const LINK_OPTIONS = [
  { value: "", label: "No link" },
  { value: "#workspace", label: "The workspace section" },
  { value: "#strategies", label: "The strategy library" },
  { value: "#about", label: "The about section" },
  { value: "#learn", label: "The questions section" },
  { value: "#launch", label: "The trading launch" },
  { value: "/terms", label: "The terms page" },
] as const;

function cleanFeatures(rows: Feature[]) {
  return rows
    .map((row) => ({
      title: row.title.trim(),
      description: row.description.trim(),
    }))
    .filter((row) => row.title && row.description)
    .slice(0, 6);
}
function cleanSteps(rows: Step[]) {
  return rows
    .map((row) => ({
      title: row.title.trim(),
      description: row.description.trim(),
    }))
    .filter((row) => row.title && row.description)
    .slice(0, 5);
}

export function ModuleEditor({
  config,
  update,
  onSectionFocus,
}: {
  config: Config;
  update: (key: keyof Config, value: unknown) => void;
  onSectionFocus?: (key: string) => void;
}) {
  const content = normalizeModuleContent(config.moduleContent);
  const enabled = config.modules;
  const fixedLayout = new Set<ModuleKey>([
    "announcement",
    "header",
    "ticker",
    "footer",
  ]);
  const [rows, setRows] = useState(() => ({
    features: content.features.map((row) => ({ ...row })),
    steps: content.steps.map((row) => ({ ...row })),
    testimonials: content.testimonials.map((row) => ({ ...row })),
    stats: content.stats.map((row) => ({ ...row })),
    faq: content.faq.map((row) => ({ ...row })),
  }));
  const rowsRef = useRef(rows);
  const contentRef = useRef(content);
  const [text, setText] = useState(() => ({
    announcement: content.announcement.text,
    announcementLabel: content.announcement.linkLabel,
    announcementHref: content.announcement.linkHref,
    tradeLabel: content.trade.label,
    tradeHref: content.trade.href,
    about: content.about.text,
  }));
  const [ticker, setTicker] = useState([...content.ticker]);
  const [newTicker, setNewTicker] = useState("");
  const [linkMode, setLinkMode] = useState(
    LINK_OPTIONS.some(
      (option) => option.value === content.announcement.linkHref,
    )
      ? content.announcement.linkHref
      : "custom",
  );
  const [tradeMode, setTradeMode] = useState(
    content.trade.href === "/trade" ? "/trade" : "custom",
  );

  const setContent = (next: ModuleContent) => {
    contentRef.current = next;
    update("moduleContent", next);
  };

  function commitRows(
    key: "features" | "steps" | "testimonials" | "stats" | "faq",
    nextRows:
      | typeof rows.features
      | typeof rows.steps
      | typeof rows.testimonials
      | typeof rows.stats
      | typeof rows.faq,
  ) {
    setRows((previous) => {
      const next = { ...previous, [key]: nextRows } as typeof rows;
      rowsRef.current = next;
      return next;
    });
    if (key === "features")
      setContent({
        ...contentRef.current,
        features: cleanFeatures(nextRows as Feature[]),
      });
    else if (key === "steps")
      setContent({
        ...contentRef.current,
        steps: cleanSteps(nextRows as Step[]),
      });
    else if (key === "testimonials")
      setContent({
        ...contentRef.current,
        testimonials: (nextRows as typeof rows.testimonials)
          .map((row) => ({
            quote: row.quote.trim(),
            name: row.name.trim(),
            role: row.role.trim(),
          }))
          .filter((row) => row.quote && row.name),
      });
    else if (key === "stats")
      setContent({
        ...contentRef.current,
        stats: (nextRows as typeof rows.stats)
          .map((row) => ({
            value: row.value.trim(),
            label: row.label.trim(),
            note: row.note?.trim() || undefined,
          }))
          .filter((row) => row.value && row.label),
      });
    else
      setContent({
        ...contentRef.current,
        faq: (nextRows as typeof rows.faq)
          .map((row) => ({
            question: row.question.trim(),
            answer: row.answer.trim(),
          }))
          .filter((row) => row.question && row.answer),
      });
  }

  function commitText(nextText = text) {
    setContent({
      ...contentRef.current,
      announcement: {
        text: nextText.announcement.trim(),
        linkLabel: nextText.announcementLabel.trim(),
        linkHref: nextText.announcementHref.trim(),
      },
      trade: {
        label: nextText.tradeLabel.trim(),
        href: nextText.tradeHref.trim() || "/trade",
      },
      about: {
        text: nextText.about.trim(),
      },
    });
  }

  function updateText(patch: Partial<typeof text>) {
    const next = { ...text, ...patch };
    setText(next);
    commitText(next);
  }

  function updateRow(
    key: "features" | "steps" | "testimonials" | "stats" | "faq",
    index: number,
    field: string,
    value: string,
  ) {
    const next = (rowsRef.current[key] as Record<string, string>[]).map(
      (row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
    );
    commitRows(key, next as typeof rows.features);
  }

  function toggle(key: ModuleKey, checked: boolean) {
    if (key === "risk") return;
    if (!checked) {
      update(
        "modules",
        enabled.filter((item) => item !== key),
      );
      return;
    }
    const next = enabled.filter((item) => item !== key);
    const riskIndex = next.indexOf("risk");
    next.splice(riskIndex >= 0 ? riskIndex : next.length, 0, key);
    update("modules", next);
  }

  const movable = enabled.filter(
    (key) => key !== "risk" && !fixedLayout.has(key),
  );
  function move(key: ModuleKey, direction: -1 | 1) {
    const position = movable.indexOf(key);
    const targetKey = movable[position + direction];
    if (position < 0 || !targetKey) return;
    const index = enabled.indexOf(key);
    const target = enabled.indexOf(targetKey);
    if (index < 0 || target < 0) return;
    const next = [...enabled];
    [next[index], next[target]] = [next[target], next[index]];
    update("modules", next);
  }

  function addTicker() {
    const value = newTicker.trim().slice(0, 40);
    if (!value || ticker.length >= 12 || ticker.includes(value)) return;
    const next = [...ticker, value];
    setTicker(next);
    setNewTicker("");
    setContent({ ...contentRef.current, ticker: next });
  }

  const availableLinks = LINK_OPTIONS.filter((option) => {
    if (option.value === "#workspace") return enabled.includes("workspace");
    if (option.value === "#strategies") return enabled.includes("strategies");
    if (option.value === "#about") return enabled.includes("about");
    if (option.value === "#learn")
      return enabled.includes("faq") && content.faq.length > 0;
    if (option.value === "#launch") return enabled.includes("trade");
    return true;
  });

  useEffect(() => {
    if (
      text.announcementHref.startsWith("#") &&
      !availableLinks.some((option) => option.value === text.announcementHref)
    ) {
      const next = { ...text, announcementHref: "" };
      setText(next);
      setLinkMode("");
      commitText(next);
    }
  }, [enabled, content.faq.length]);

  return (
    <div className="module-editor">
      <div className="module-editor-grid">
        {[
          ...enabled
            .map((key) => MODULE_DEFINITIONS.find((m) => m.key === key)!)
            .filter(Boolean),
          ...MODULE_DEFINITIONS.filter((m) => !enabled.includes(m.key)),
        ].map((module) => {
          const checked = enabled.includes(module.key);
          return (
            <div
              className={`module-editor-card ${checked ? "enabled" : ""}`}
              key={module.key}
            >
              <label>
                <input
                  type="checkbox"
                  checked={checked || module.key === "risk"}
                  disabled={module.key === "risk"}
                  onChange={(event) => toggle(module.key, event.target.checked)}
                />
                <span>
                  <strong>{module.name}</strong>
                  <small>{module.description}</small>
                </span>
              </label>
              {checked &&
              module.key !== "risk" &&
              !fixedLayout.has(module.key) ? (
                <div className="module-reorder">
                  <button
                    type="button"
                    aria-label={`Move ${module.name} up`}
                    disabled={movable[0] === module.key}
                    onClick={() => move(module.key, -1)}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${module.name} down`}
                    disabled={movable[movable.length - 1] === module.key}
                    onClick={() => move(module.key, 1)}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              ) : checked && fixedLayout.has(module.key) ? (
                <span className="module-fixed">Fixed position</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="module-editor-fields">
        <details
          hidden={!enabled.includes("announcement")}
          onFocusCapture={() => onSectionFocus?.("announcement")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("announcement");
          }}
        >
          <summary>Announcement</summary>
          <p className="editor-help">
            A short message at the top of the page. You can leave the link
            empty.
          </p>
          <label className="field">
            Message
            <input
              value={text.announcement}
              maxLength={180}
              onChange={(event) =>
                updateText({ announcement: event.target.value })
              }
              placeholder="Independent demo · no live trading"
            />
          </label>
          <div className="module-two-col">
            <label className="field">
              Where should it go?
              <select
                value={linkMode}
                onChange={(event) => {
                  const value = event.target.value;
                  setLinkMode(value);
                  if (value !== "custom")
                    updateText({ announcementHref: value });
                }}
              >
                {availableLinks.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">A different link</option>
              </select>
            </label>
            {text.announcementHref ? (
              <label className="field">
                Link text
                <input
                  value={text.announcementLabel}
                  maxLength={40}
                  onChange={(event) =>
                    updateText({ announcementLabel: event.target.value })
                  }
                  placeholder="Read the risk note"
                />
              </label>
            ) : null}
          </div>
          {linkMode === "custom" ? (
            <label className="field">
              Custom link
              <input
                value={text.announcementHref}
                maxLength={200}
                onChange={(event) =>
                  updateText({ announcementHref: event.target.value })
                }
                placeholder="https://example.com or #workspace"
              />
              <small className="field-note">
                Advanced: paste an address only if you need one.
              </small>
            </label>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("ticker")}
          onFocusCapture={() => onSectionFocus?.("ticker")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("ticker");
          }}
        >
          <summary>Labels strip</summary>
          <p className="editor-help">
            Small labels in the moving strip. Add a label and press Enter.
          </p>
          <div className="ticker-chips">
            {ticker.map((label, index) => (
              <span className="ticker-chip" key={`${label}-${index}`}>
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => {
                    const next = ticker.filter(
                      (_, itemIndex) => itemIndex !== index,
                    );
                    setTicker(next);
                    setContent({ ...contentRef.current, ticker: next });
                  }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="ticker-add">
            <input
              aria-label="New label"
              maxLength={40}
              value={newTicker}
              onChange={(event) => setNewTicker(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTicker();
                }
              }}
              placeholder="Add a label"
            />
            <button
              className="btn"
              type="button"
              disabled={!newTicker.trim() || ticker.length >= 12}
              onClick={addTicker}
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </details>

        <details
          hidden={!enabled.includes("features")}
          onFocusCapture={() => onSectionFocus?.("features")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("features");
          }}
        >
          <summary>What your site offers</summary>
          <p className="editor-help">
            Four short cards under the hero. Add up to six.
          </p>
          <div className="editor-repeat">
            {rows.features.map((row, index) => (
              <div className="editor-repeat-item" key={index}>
                <div className="editor-repeat-head">
                  <strong>Card {index + 1}</strong>
                  <button
                    type="button"
                    aria-label={`Remove card ${index + 1}`}
                    onClick={() =>
                      commitRows(
                        "features",
                        rows.features.filter((_, item) => item !== index),
                      )
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <label className="field">
                  Card title
                  <input
                    value={row.title}
                    maxLength={60}
                    onChange={(event) =>
                      updateRow("features", index, "title", event.target.value)
                    }
                    onBlur={() =>
                      commitRows("features", rowsRef.current.features)
                    }
                    placeholder="Risk controls"
                  />
                </label>
                <label className="field">
                  What it says
                  <textarea
                    rows={2}
                    value={row.description}
                    maxLength={180}
                    onChange={(event) =>
                      updateRow(
                        "features",
                        index,
                        "description",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      commitRows("features", rowsRef.current.features)
                    }
                    placeholder="Stake and stop-loss prompts stay visible."
                  />
                </label>
              </div>
            ))}
          </div>
          {rows.features.length < 6 ? (
            <button
              className="editor-add"
              type="button"
              onClick={() => {
                const next = [
                  ...rowsRef.current.features,
                  { title: "", description: "" },
                ];
                rowsRef.current = { ...rowsRef.current, features: next };
                setRows(rowsRef.current);
              }}
            >
              <Plus size={13} /> Add another card
            </button>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("steps")}
          onFocusCapture={() => onSectionFocus?.("steps")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("steps");
          }}
        >
          <summary>How it works</summary>
          <p className="editor-help">Three simple steps. Add up to five.</p>
          <div className="editor-repeat">
            {rows.steps.map((row, index) => (
              <div className="editor-repeat-item" key={index}>
                <div className="editor-repeat-head">
                  <strong>Step {index + 1}</strong>
                  <button
                    type="button"
                    aria-label={`Remove step ${index + 1}`}
                    onClick={() =>
                      commitRows(
                        "steps",
                        rows.steps.filter((_, item) => item !== index),
                      )
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <label className="field">
                  Step title
                  <input
                    value={row.title}
                    maxLength={60}
                    onChange={(event) =>
                      updateRow("steps", index, "title", event.target.value)
                    }
                    placeholder="Review the demo"
                  />
                </label>
                <label className="field">
                  What happens
                  <textarea
                    rows={2}
                    value={row.description}
                    maxLength={180}
                    onChange={(event) =>
                      updateRow(
                        "steps",
                        index,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Open the workspace with simulated data."
                  />
                </label>
              </div>
            ))}
          </div>
          {rows.steps.length < 5 ? (
            <button
              className="editor-add"
              type="button"
              onClick={() => {
                const next = [
                  ...rowsRef.current.steps,
                  { title: "", description: "" },
                ];
                rowsRef.current = { ...rowsRef.current, steps: next };
                setRows(rowsRef.current);
              }}
            >
              <Plus size={13} /> Add another step
            </button>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("stats")}
          onFocusCapture={() => onSectionFocus?.("stats")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("stats");
          }}
        >
          <summary>Stats</summary>
          <p className="editor-help">
            Only add facts you can verify. Empty stats stay hidden.
          </p>
          <div className="editor-repeat">
            {rows.stats.map((row, index) => (
              <div className="editor-repeat-item" key={index}>
                <div className="editor-repeat-head">
                  <strong>Stat {index + 1}</strong>
                  <button
                    type="button"
                    aria-label={`Remove stat ${index + 1}`}
                    onClick={() =>
                      commitRows(
                        "stats",
                        rows.stats.filter((_, item) => item !== index),
                      )
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <div className="module-two-col">
                  <label className="field">
                    Big number
                    <input
                      value={row.value}
                      maxLength={30}
                      onChange={(event) =>
                        updateRow("stats", index, "value", event.target.value)
                      }
                      placeholder="15%"
                    />
                  </label>
                  <label className="field">
                    What it means
                    <input
                      value={row.label}
                      maxLength={60}
                      onChange={(event) =>
                        updateRow("stats", index, "label", event.target.value)
                      }
                      placeholder="platform share"
                    />
                  </label>
                </div>
                <label className="field">
                  Small note (optional)
                  <input
                    value={row.note ?? ""}
                    maxLength={100}
                    onChange={(event) =>
                      updateRow("stats", index, "note", event.target.value)
                    }
                    placeholder="of attributed commission"
                  />
                </label>
              </div>
            ))}
          </div>
          <p className="fine-print">
            Stats stay hidden while this list is empty.
          </p>
          {rows.stats.length < 8 ? (
            <button
              className="editor-add"
              type="button"
              onClick={() => {
                const next = [
                  ...rowsRef.current.stats,
                  { value: "", label: "", note: undefined },
                ];
                rowsRef.current = { ...rowsRef.current, stats: next };
                setRows(rowsRef.current);
              }}
            >
              <Plus size={13} /> Add a stat
            </button>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("testimonials")}
          onFocusCapture={() => onSectionFocus?.("testimonials")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("testimonials");
          }}
        >
          <summary>Testimonials</summary>
          <p className="editor-help">
            Only use real quotes with permission. Empty testimonials stay
            hidden.
          </p>
          <div className="editor-repeat">
            {rows.testimonials.map((row, index) => (
              <div className="editor-repeat-item" key={index}>
                <div className="editor-repeat-head">
                  <strong>Quote {index + 1}</strong>
                  <button
                    type="button"
                    aria-label={`Remove quote ${index + 1}`}
                    onClick={() =>
                      commitRows(
                        "testimonials",
                        rows.testimonials.filter((_, item) => item !== index),
                      )
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <label className="field">
                  Quote
                  <textarea
                    rows={2}
                    value={row.quote}
                    maxLength={400}
                    onChange={(event) =>
                      updateRow(
                        "testimonials",
                        index,
                        "quote",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      commitRows("testimonials", rowsRef.current.testimonials)
                    }
                    placeholder="A clear, calm experience."
                  />
                </label>
                <div className="module-two-col">
                  <label className="field">
                    Name
                    <input
                      value={row.name}
                      maxLength={80}
                      onChange={(event) =>
                        updateRow(
                          "testimonials",
                          index,
                          "name",
                          event.target.value,
                        )
                      }
                      onBlur={() =>
                        commitRows("testimonials", rowsRef.current.testimonials)
                      }
                      placeholder="Ada"
                    />
                  </label>
                  <label className="field">
                    Role
                    <input
                      value={row.role}
                      maxLength={80}
                      onChange={(event) =>
                        updateRow(
                          "testimonials",
                          index,
                          "role",
                          event.target.value,
                        )
                      }
                      onBlur={() =>
                        commitRows("testimonials", rowsRef.current.testimonials)
                      }
                      placeholder="Trader"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="fine-print">
            Testimonials stay hidden while this list is empty.
          </p>
          {rows.testimonials.length < 12 ? (
            <button
              className="editor-add"
              type="button"
              onClick={() => {
                const next = [
                  ...rowsRef.current.testimonials,
                  { quote: "", name: "", role: "" },
                ];
                rowsRef.current = { ...rowsRef.current, testimonials: next };
                setRows(rowsRef.current);
              }}
            >
              <Plus size={13} /> Add a testimonial
            </button>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("faq")}
          onFocusCapture={() => onSectionFocus?.("faq")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("faq");
          }}
        >
          <summary>Questions</summary>
          <p className="editor-help">
            Answers to the questions clients ask most. Empty questions stay
            hidden.
          </p>
          <div className="editor-repeat">
            {rows.faq.map((row, index) => (
              <div className="editor-repeat-item" key={index}>
                <div className="editor-repeat-head">
                  <strong>Question {index + 1}</strong>
                  <button
                    type="button"
                    aria-label={`Remove question ${index + 1}`}
                    onClick={() =>
                      commitRows(
                        "faq",
                        rows.faq.filter((_, item) => item !== index),
                      )
                    }
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <label className="field">
                  Question
                  <input
                    value={row.question}
                    maxLength={180}
                    onChange={(event) =>
                      updateRow("faq", index, "question", event.target.value)
                    }
                    placeholder="Is this live trading?"
                  />
                </label>
                <label className="field">
                  Answer
                  <textarea
                    rows={2}
                    value={row.answer}
                    maxLength={800}
                    onChange={(event) =>
                      updateRow("faq", index, "answer", event.target.value)
                    }
                    placeholder="No. This is a demo-only site."
                  />
                </label>
              </div>
            ))}
          </div>
          <p className="fine-print">
            Questions stay hidden while this list is empty.
          </p>
          {rows.faq.length < 12 ? (
            <button
              className="editor-add"
              type="button"
              onClick={() => {
                const next = [
                  ...rowsRef.current.faq,
                  { question: "", answer: "" },
                ];
                rowsRef.current = { ...rowsRef.current, faq: next };
                setRows(rowsRef.current);
              }}
            >
              <Plus size={13} /> Add a question
            </button>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("trade")}
          onFocusCapture={() => onSectionFocus?.("trade")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("trade");
          }}
        >
          <summary>Trading button</summary>
          <p className="editor-help">
            This is the button that opens the shared demo workspace.
          </p>
          <label className="field">
            Button text
            <input
              value={text.tradeLabel}
              maxLength={40}
              onChange={(event) =>
                updateText({ tradeLabel: event.target.value })
              }
              placeholder="Open demo trading"
            />
          </label>
          <label className="field">
            Where should it go?
            <select
              value={tradeMode}
              onChange={(event) => {
                const value = event.target.value;
                setTradeMode(value);
                if (value !== "custom") updateText({ tradeHref: value });
              }}
            >
              <option value="/trade">Shared demo workspace</option>
              <option value="custom">A different link</option>
            </select>
          </label>
          {tradeMode === "custom" ? (
            <label className="field">
              Custom link
              <input
                value={text.tradeHref}
                maxLength={200}
                onChange={(event) =>
                  updateText({ tradeHref: event.target.value })
                }
                placeholder="https://example.com or /trade"
              />
              <small className="field-note">
                Advanced: paste an address only if you need one.
              </small>
            </label>
          ) : null}
        </details>

        <details
          hidden={!enabled.includes("about")}
          onFocusCapture={() => onSectionFocus?.("about")}
          onToggle={(event) => {
            if (event.currentTarget.open) onSectionFocus?.("about");
          }}
        >
          <summary>About</summary>
          <p className="editor-help">
            A short paragraph about this site. Plain text only.
          </p>
          <label className="field">
            About text
            <textarea
              rows={4}
              maxLength={800}
              value={text.about}
              onChange={(event) => updateText({ about: event.target.value })}
              placeholder="An independent demo site built with Tradeintra."
            />
          </label>
        </details>
      </div>
      <p className="fine-print">
        Default content: {defaultModuleContent.ticker.length} labels. Stats and
        testimonials remain hidden until you add real entries.
      </p>
    </div>
  );
}
