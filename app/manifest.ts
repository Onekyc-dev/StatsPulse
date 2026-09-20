import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StatPulse",
    short_name: "StatPulse",
    description: "See beneath the surface. Match intelligence, lineups, absences and model outlooks for the Premier League.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050b0d",
    theme_color: "#050b0d",
    categories: ["sports"],
    icons: [
      { src: "/images/logo/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/logo/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/logo/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Matches", url: "/matches" },
      { name: "Predictions", url: "/predictions" }
    ]
  };
}
