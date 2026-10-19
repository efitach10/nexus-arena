export function youtubeId(raw: string) {
  try {
    const url = new URL(raw);
    if (
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtube-nocookie.com",
      ].includes(url.hostname)
    )
      return null;
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1).split("/")[0]
        : url.searchParams.get("v") ||
          url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
