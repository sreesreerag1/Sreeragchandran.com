// Sreerag Chandran Unified Portfolio Projects Data
// Dynamically imported using Vite glob imports for robust Vercel and local dev bundling
import portfolioMetadata from "./portfolioMetadata.json";

export interface ProjectImageItem {
  id: string;
  src: string;
  filename: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "landscape" | "portrait" | "square";
}

export interface UnifiedPortfolioProject {
  id: string;
  slug: string;
  folderName: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  images: string[];
  galleryImages: ProjectImageItem[];
  copyright: string;
  order: number;
  disciplines?: string[];
}

export type PortfolioProject = UnifiedPortfolioProject;

// 04 — IMAGE IMPORT SYSTEM (VITE COMPATIBLE)
const rawAssetModules = import.meta.glob<string>(
  "/src/assets/Works/**/*",
  { eager: true, query: "?url", import: "default" }
);

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

function buildProjects(): UnifiedPortfolioProject[] {
  // Group assets by folder name
  const folderMap = new Map<string, { [fileName: string]: string }>();

  for (const [key, url] of Object.entries(rawAssetModules)) {
    if (!IMAGE_EXTENSIONS.test(key) || typeof url !== "string") continue;

    // key format: /src/assets/Works/FOLDER_NAME/FILE_NAME
    const parts = key.split("/");
    const worksIdx = parts.findIndex((p) => p === "Works");
    if (worksIdx === -1 || worksIdx + 2 >= parts.length) continue;

    const folderName = parts[worksIdx + 1];
    const fileName = parts.slice(worksIdx + 2).join("/");

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, {});
    }
    folderMap.get(folderName)![fileName] = url;
  }

  const projects: UnifiedPortfolioProject[] = [];

  for (const [folderName, fileMap] of folderMap.entries()) {
    // 02 — FOLDER SCANNING
    // Format: PROJECT TITLE_SUBHEADING
    // Before "_": Main title
    // After "_": Subtitle
    const splitIdx = folderName.indexOf("_");
    let title = folderName.trim();
    let subtitle = "";
    if (splitIdx !== -1) {
      title = folderName.slice(0, splitIdx).trim();
      subtitle = folderName.slice(splitIdx + 1).trim();
    }

    const fileEntries = Object.entries(fileMap);
    if (fileEntries.length === 0) continue;

    // 03 — THUMBNAIL DETECTION
    // Case-insensitive match for Thumbnail.jpg, Thumbnail.png, Thumbnail.webp, etc.
    const thumbEntry = fileEntries.find(([fileName]) =>
      /^thumbnail\.(jpe?g|png|webp|avif)$/i.test(fileName)
    );

    // If thumbnail is missing, fallback to first image in folder
    const thumbnail = thumbEntry ? thumbEntry[1] : fileEntries[0][1];

    // Non-thumbnail images for gallery (exclude Thumbnail)
    const nonThumbEntries = fileEntries.filter(
      ([fileName]) => !/^thumbnail\.(jpe?g|png|webp|avif)$/i.test(fileName)
    );

    // Natural sort: 1.jpg, 2.jpg, 10.jpg
    nonThumbEntries.sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" })
    );

    const slug = slugify(title + " " + subtitle);
    const meta = (portfolioMetadata as Record<string, any>)[folderName] || {};

    const galleryImages: ProjectImageItem[] = nonThumbEntries.map(([fileName, url], idx) => {
      const imgMeta = meta.imagesMeta?.[fileName] || {};
      const width = imgMeta.width || 1920;
      const height = imgMeta.height || 1080;
      const aspectRatio =
        imgMeta.aspectRatio || Math.round((width / height) * 1000) / 1000;
      const orientation =
        imgMeta.orientation ||
        (aspectRatio > 1.2 ? "landscape" : aspectRatio < 0.85 ? "portrait" : "square");

      return {
        id: `${slug}-${String(idx + 1).padStart(2, "0")}`,
        src: url,
        filename: fileName,
        width,
        height,
        aspectRatio,
        orientation,
      };
    });

    const images = galleryImages.map((img) => img.src);

    projects.push({
      id: slug,
      slug,
      folderName,
      title,
      subtitle,
      thumbnail,
      images,
      galleryImages,
      copyright:
        meta.copyright ||
        "All project ownership and image copyrights remain with the respective brand or company.",
      order: typeof meta.order === "number" ? meta.order : 99,
      disciplines: meta.disciplines || ["Creative Direction", "Experience Design"],
    });
  }

  // Sort projects by order
  projects.sort((a, b) => a.order - b.order);

  return projects;
}

export const PORTFOLIO_PROJECTS: UnifiedPortfolioProject[] = buildProjects();

// 05 — DEBUG IMAGE OBJECT
if (typeof window !== "undefined" || (import.meta as any).env?.DEV) {
  console.log(
    "Portfolio Projects Loaded:",
    PORTFOLIO_PROJECTS.map((p) => ({
      title: p.title,
      subtitle: p.subtitle,
      thumbnail: p.thumbnail,
      images: p.images,
    }))
  );
}

export const getProjectBySlug = (slug: string): UnifiedPortfolioProject | undefined => {
  return PORTFOLIO_PROJECTS.find((p) => p.slug === slug || p.id === slug);
};
