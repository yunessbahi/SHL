/*
const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/;
const OG_TITLE_REGEX = /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/;
const DESCRIPTION_REGEX = /<meta[^>]*name="description"[^>]*content="([^"]+)"/;
const OG_DESCRIPTION_REGEX =
  /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/;
const OG_IMAGE_REGEX = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/;

export const glimpse = async (url: string) => {
  const response = await fetch(url);
  const data = await response.text();
  const titleMatch = data.match(TITLE_REGEX) || data.match(OG_TITLE_REGEX);
  const descriptionMatch =
    data.match(DESCRIPTION_REGEX) || data.match(OG_DESCRIPTION_REGEX);
  const imageMatch = data.match(OG_IMAGE_REGEX);

  return {
    title: titleMatch?.at(1) ?? null,
    description: descriptionMatch?.at(1) ?? null,
    image: imageMatch?.at(1) ?? null,
  };
};*/
const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/;
const OG_TITLE_REGEX = /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/;
const DESCRIPTION_REGEX = /<meta[^>]*name="description"[^>]*content="([^"]+)"/;
const OG_DESCRIPTION_REGEX =
  /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/;
const OG_IMAGE_REGEX = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/;

export const glimpse = async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GlimpseBot/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "force-cache", // Cache the response
      next: { revalidate: 3600 }, // Revalidate every hour (Next.js specific)
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.text();
    const titleMatch = data.match(TITLE_REGEX) || data.match(OG_TITLE_REGEX);
    const descriptionMatch =
      data.match(DESCRIPTION_REGEX) || data.match(OG_DESCRIPTION_REGEX);
    const imageMatch = data.match(OG_IMAGE_REGEX);

    return {
      title: titleMatch?.at(1) ?? null,
      description: descriptionMatch?.at(1) ?? null,
      image: imageMatch?.at(1) ?? null,
    };
  } catch (error) {
    console.error("Glimpse fetch error:", error);

    // Return fallback data
    return {
      title: url,
      description: "Unable to fetch preview",
      image: null,
    };
  }
};
