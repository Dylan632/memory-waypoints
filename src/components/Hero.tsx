import type { SiteLink } from "../content/site";
import type { SortOrder } from "../lib/trips";
import { LinkIcon } from "./LinkIcon";

type Props = {
  title: string;
  subtitle: string;
  links: SiteLink[];
  order: SortOrder;
  onOrderChange(order: SortOrder): void;
};

export function Hero({ title, subtitle, links, order, onOrderChange }: Props) {
  return <header className="hero">
    <h1>{title}</h1>
    <p className="hero__subtitle">{subtitle}</p>
    {links.length > 0 && <nav className="hero__links" aria-label="联系方式">
      {links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}><LinkIcon name={link.icon} /></a>)}
    </nav>}
    <div className="sort-toggle" role="group" aria-label="排序">
      <button type="button" aria-pressed={order === "newest"} onClick={() => onOrderChange("newest")}>最新</button>
      <button type="button" aria-pressed={order === "oldest"} onClick={() => onOrderChange("oldest")}>最早</button>
    </div>
  </header>;
}
