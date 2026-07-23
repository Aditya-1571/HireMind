import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HireMind",
    short_name: "HireMind",
    description:
      "AI interview preparation with resume-aware questions, answer evaluation, reports, and progress history.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
