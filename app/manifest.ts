import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pohoda — weather, clearly",
    short_name: "Pohoda",
    description:
      "Hourly, 7-day and 30-day weather with animated skies and eight icon sets.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b1020",
    theme_color: "#070c18",
    categories: ["weather", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
