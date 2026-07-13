import type { Coordinate } from "./lib/trips.js";

export type TicketVariant = "scenic" | "rail" | "museum" | "cinema" | "scan";
export type TicketTemplateVariant = Exclude<TicketVariant, "scan">;

export type Ticket = {
  id: string;
  title: string;
  subtitle: string;
  serial: string;
  date: string;
  price: string;
  variant: TicketVariant;
  templateVariant?: TicketTemplateVariant;
  accent: string;
  width: number;
  ratio: number;
  offset: number;
  rotation: number;
  image?: string;
  story: string;
  photos: string[];
};

export function switchTicketMode(ticket: Ticket, mode: "scan" | "template"): Ticket {
  const templateVariant = ticket.variant === "scan" ? ticket.templateVariant ?? "museum" : ticket.variant;
  return { ...ticket, templateVariant, variant: mode === "scan" ? "scan" : templateVariant };
}

export type Trip = {
  id: string;
  destination: string;
  country: string;
  dateLabel: string;
  startDate: string;
  routeColor: string;
  mapTone: "night" | "paper" | "mist";
  route: Coordinate[];
  tickets: Ticket[];
};

const photos = {
  coast: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=84",
  street: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=84",
  mountain: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=84",
  train: "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1400&q=84",
  city: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1400&q=84",
  sunset: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=84",
};

export const trips: Trip[] = [
  {
    id: "xiamen", destination: "海边的周末", country: "厦门", dateLabel: "2025年6月20日 – 6月23日", startDate: "2025-06-20", routeColor: "#dc7449", mapTone: "night",
    route: [[118.089, 24.479], [118.076, 24.461], [118.063, 24.449], [118.082, 24.439], [118.104, 24.462], [118.126, 24.485]],
    tickets: [
      { id: "island-ferry", title: "鼓浪屿往返船票", subtitle: "XIAMEN · GULANGYU", serial: "XM-0620-0917", date: "2025.06.20", price: "¥35", variant: "scenic", accent: "#215a71", width: 554, ratio: 2.66, offset: -18, rotation: 1.2, image: photos.coast, story: "傍晚的风把船票吹得一直响。我们没有赶着去任何景点，只沿着海边慢慢走，直到最后一班船的广播响起。", photos: [photos.coast, photos.sunset] },
      { id: "botanical-garden", title: "万石植物园", subtitle: "BOTANICAL GARDEN", serial: "A-250621-184", date: "2025.06.21", price: "双人票", variant: "museum", accent: "#55724c", width: 348, ratio: 1.58, offset: 72, rotation: -1.8, story: "雨停以后，温室玻璃上还挂着水珠。我们绕了远路，也因此遇见了一条没人经过的小径。", photos: [photos.street] },
    ],
  },
  {
    id: "suzhou", destination: "雨里的古城", country: "苏州", dateLabel: "2024年10月2日 – 10月5日", startDate: "2024-10-02", routeColor: "#2f6f8f", mapTone: "mist",
    route: [[120.621, 31.319], [120.63, 31.312], [120.641, 31.305], [120.617, 31.298], [120.605, 31.311], [120.614, 31.325]],
    tickets: [
      { id: "canal-boat", title: "平江河手摇船", subtitle: "PINGJIANG CANAL", serial: "PJ-1003-22", date: "2024.10.03", price: "贰位", variant: "rail", accent: "#8c3e30", width: 430, ratio: 2.18, offset: -54, rotation: -1.3, story: "船篷外一直下着小雨，河边店铺的灯映在水上。船夫唱到第二段时，我们才发现整条河都安静了。", photos: [photos.street, photos.city] },
      { id: "museum-night", title: "苏州博物馆西馆", subtitle: "EVENING ADMISSION", serial: "SZM-241004", date: "2024.10.04", price: "18:30", variant: "museum", accent: "#1e2528", width: 300, ratio: 1.2, offset: 65, rotation: 2.1, story: "闭馆前的最后一小时人很少。走出展厅时，雨已经停了，屋檐下只剩滴水的声音。", photos: [photos.city] },
    ],
  },
  {
    id: "hokkaido", destination: "去看一场雪", country: "北海道", dateLabel: "2024年1月6日 – 1月13日", startDate: "2024-01-06", routeColor: "#1f668e", mapTone: "paper",
    route: [[141.354, 43.062], [141.192, 43.149], [140.994, 43.197], [140.766, 42.551], [140.728, 42.314]],
    tickets: [
      { id: "snow-rail", title: "雪国列车七日券", subtitle: "NORTH LINE · 7 DAYS", serial: "JR-0106-7281", date: "2024.01.06", price: "ORDINARY", variant: "rail", accent: "#315c64", width: 316, ratio: 2.03, offset: -34, rotation: 1.5, story: "列车离开札幌后，窗外慢慢只剩白色。我们把便当放在窗边，像两个第一次坐火车的小孩。", photos: [photos.train, photos.mountain] },
      { id: "snow-cinema", title: "小樽雪灯之路", subtitle: "WINTER LIGHT PASS", serial: "OT-0110-1945", date: "2024.01.10", price: "TWO", variant: "cinema", accent: "#a84334", width: 520, ratio: 2.5, offset: 22, rotation: -1.1, image: photos.mountain, story: "天黑以后，运河边的雪灯一盏一盏亮起来。手套里攥着的这张票，回到酒店时已经被体温烘得发软。", photos: [photos.mountain, photos.sunset] },
    ],
  },
];
