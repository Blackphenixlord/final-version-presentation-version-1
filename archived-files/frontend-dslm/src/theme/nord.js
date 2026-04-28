const NORD = {
  // Polar Night (nord0–nord3)
  nord0: "#2E3440",
  nord1: "#3B4252",
  nord2: "#434C5E",
  nord3: "#4C566A",

  // Snow Storm (nord4–nord6)
  nord4: "#D8DEE9",
  nord5: "#E5E9F0",
  nord6: "#ECEFF4",

  // Frost (nord7–nord10)
  nord7: "#8FBCBB",
  nord8: "#88C0D0",
  nord9: "#81A1C1",
  nord10: "#5E81AC",

  // Aurora (nord11–nord15)
  nord11: "#BF616A",
  nord12: "#D08770",
  nord13: "#EBCB8B",
  nord14: "#A3BE8C",
  nord15: "#B48EAD",

  // Semantic aliases (dark UI):
  // - backgrounds/areas: Polar Night
  // - text: Snow Storm
  // - primary accents: Frost
  // - state colors: Aurora
  bg: "#2E3440", // nord0
  panel: "#3B4252", // nord1 (elevated surfaces)
  panel2: "#434C5E", // nord2 (inputs/secondary surfaces)
  panel3: "#4C566A", // nord3 (raised/alternate surfaces)

  text: "#ECEFF4", // nord6 (highest-contrast text)
  muted: "#E5E9F0", // nord5 (secondary text)
  subtle: "#D8DEE9", // nord4 (tertiary/labels)

  line: "#4C566A", // nord3 (borders/dividers)

  // Frost accents
  teal: "#8FBCBB", // nord7
  blue: "#88C0D0", // nord8 (primary accent)
  blue2: "#81A1C1", // nord9 (secondary accent)
  blue3: "#5E81AC", // nord10 (tertiary accent)

  // Aurora states
  red: "#BF616A", // nord11 (error)
  orange: "#D08770", // nord12 (caution/advanced)
  yellow: "#EBCB8B", // nord13 (warning)
  green: "#A3BE8C", // nord14 (success)
  purple: "#B48EAD", // nord15 (uncommon)
};

export default NORD;
