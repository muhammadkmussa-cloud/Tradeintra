export type DerivBotPreset = {
  id: string;
  name: string;
  family: "stake" | "recovery" | "target";
  summary: string;
  risk: string;
  file: string;
};

export const DERIV_BOT_PRESETS: DerivBotPreset[] = [
  {
    id: "1-3-2-6",
    name: "1-3-2-6",
    family: "stake",
    summary:
      "A four-step stake sequence that resets after a win and returns to step one after the cycle.",
    risk: "Four consecutive losses can consume the whole sequence. Set a hard stop.",
    file: "/deriv-presets/1_3_2_6.xml",
  },
  {
    id: "dalembert",
    name: "D’Alembert",
    family: "recovery",
    summary:
      "Increases the stake by one unit after a loss and reduces it by one after a win.",
    risk: "Long losing runs can outgrow the account. Cap the stake and stop-loss.",
    file: "/deriv-presets/dalembert.xml",
  },
  {
    id: "dalembert-max-stake",
    name: "D’Alembert · max stake",
    family: "recovery",
    summary:
      "The D’Alembert sequence with an explicit maximum stake guardrail.",
    risk: "A cap limits runaway stakes but does not remove market risk.",
    file: "/deriv-presets/dalembert_max-stake.xml",
  },
  {
    id: "martingale",
    name: "Martingale",
    family: "recovery",
    summary:
      "Doubles the stake after a loss and resets after a win to recover prior losses.",
    risk: "High risk. A short losing streak can exceed the balance or broker limits.",
    file: "/deriv-presets/martingale.xml",
  },
  {
    id: "martingale-max-stake",
    name: "Martingale · max stake",
    family: "recovery",
    summary: "The Martingale sequence with a maximum stake guardrail.",
    risk: "High risk. The cap can stop the sequence before recovery; losses remain.",
    file: "/deriv-presets/martingale_max-stake.xml",
  },
  {
    id: "oscars-grind",
    name: "Oscar’s Grind",
    family: "target",
    summary:
      "Raises the stake by one unit after a win until the session target is reached.",
    risk: "Recovery can be slow and requires discipline around the session target.",
    file: "/deriv-presets/oscars_grind.xml",
  },
  {
    id: "oscars-grind-max-stake",
    name: "Oscar’s Grind · max stake",
    family: "target",
    summary: "Oscar’s Grind with an explicit maximum stake guardrail.",
    risk: "The target is not guaranteed. Stop at the configured loss limit.",
    file: "/deriv-presets/oscars_grind_max-stake.xml",
  },
  {
    id: "reverse-dalembert",
    name: "Reverse D’Alembert",
    family: "stake",
    summary: "Increases the stake after a win and reduces it after a loss.",
    risk: "Winning streaks reverse quickly. Cap exposure and stop-loss.",
    file: "/deriv-presets/reverse_dalembert.xml",
  },
  {
    id: "reverse-martingale",
    name: "Reverse Martingale",
    family: "stake",
    summary: "Doubles the stake after a win and resets after a loss.",
    risk: "A single loss can give back several wins. Use a hard stop.",
    file: "/deriv-presets/reverse_martingale.xml",
  },
];

export function presetById(id: string) {
  return DERIV_BOT_PRESETS.find((preset) => preset.id === id);
}
