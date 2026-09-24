export type SiteLink = { label: string; href: string; icon: "github" | "x" | "telegram" | "mail" | "instagram" | "weibo" };

export const site = {
  title: "我们的旅行坐标",
  subtitle: "把走过的路，留在地图和票根里",
  /** Shown as an icon row under the subtitle. Leave empty to hide the row. */
  links: [] as SiteLink[],
};
