// PDF font configuration for pdfmake
// Using built-in Roboto as fallback; in production replace with Inter + Fraunces
// by loading Base64-encoded font files.

export const pdfFonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

// Note: pdfmake in Node.js uses virtual filesystem (vfs_fonts).
// The actual font loading is done in the template file.
export const PDF_COLORS = {
  cream: "#FAF7F2",
  paper: "#FFFFFF",
  inkDark: "#1C1917",
  inkBody: "#57534E",
  inkMuted: "#A8A29E",
  border: "#E7E5E4",
  accent: "#C2410C",
  success: "#15803D",
  warning: "#B45309",
};
