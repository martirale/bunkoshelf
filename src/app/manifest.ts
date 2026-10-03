import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bunko Shelf",
    short_name: "Bunko Shelf",
    start_url: "/es",
    display: "standalone",
    background_color: "#f7f2ec",
    theme_color: "#f7f2ec",
    icons: [
      {
        src: "/icons/bunkoshelf-icon-any.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/bunkoshelf-icon-maskable.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
