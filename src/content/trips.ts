import type { Trip } from "../lib/trips";

// Placeholder trips carried over from the old site. Routes are sparse
// hand-placed points, not real GPS tracks; replace them with GPX exports.
// Photos are placeholders too.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const trips: Trip[] = [
  {
    id: "xiamen",
    title: "海边的周末",
    place: "厦门",
    start: "2025-06-20",
    end: "2025-06-23",
    route: [
      { date: "2025-06-20", coordinates: [[118.089, 24.479], [118.076, 24.461], [118.063, 24.449]] },
      { date: "2025-06-21", coordinates: [[118.063, 24.449], [118.082, 24.439], [118.104, 24.462], [118.126, 24.485]] },
    ],
    tickets: [
      {
        id: "gulangyu-ferry", kind: "rail", width: 520, ratio: 2.3, rotate: 1,
        face: { from: "厦门", to: "鼓浪屿", fromEn: "Xiamen", toEn: "Gulangyu", train: "轮渡", date: "2025年06月20日", time: "17:40", seat: "上层", price: "¥35.0", serial: "Z0620A091705", note: "限乘当日当班次" },
        title: "鼓浪屿往返船票",
        essay: "傍晚的风把船票吹得一直响。我们没有赶着去任何景点，只沿着海边慢慢走，直到最后一班船的广播响起。",
        photos: [photo("photo-1507525428034-b723cf961d3e"), photo("photo-1500534314209-a25ddb2bd429")],
      },
      {
        id: "wanshi-garden", kind: "admission", width: 300, ratio: 1.9, rotate: -1.5,
        face: { venue: "万石植物园", venueEn: "Xiamen Botanical Garden", date: "2025.06.21", price: "¥30", serial: "A-250621-184", type: "成人票" },
        title: "万石植物园",
        essay: "雨停以后，温室玻璃上还挂着水珠。我们绕了远路，也因此遇见了一条没人经过的小径。",
        photos: [photo("photo-1470770841072-f978cf4d019e")],
      },
    ],
  },
  {
    id: "suzhou",
    title: "雨里的古城",
    place: "苏州",
    start: "2024-10-02",
    end: "2024-10-05",
    route: [
      { date: "2024-10-03", coordinates: [[120.621, 31.319], [120.63, 31.312], [120.641, 31.305]] },
      { date: "2024-10-04", coordinates: [[120.641, 31.305], [120.617, 31.298], [120.605, 31.311], [120.614, 31.325]] },
    ],
    tickets: [
      {
        id: "suzhou-museum", kind: "admission", width: 460, ratio: 2.1, rotate: -1,
        face: { venue: "苏州博物馆西馆", venueEn: "Suzhou Museum West", date: "2024.10.04", price: "¥0", serial: "SZM-241004-1830", type: "夜场 18:30" },
        title: "苏州博物馆西馆",
        essay: "闭馆前的最后一小时人很少。走出展厅时，雨已经停了，屋檐下只剩滴水的声音。",
        photos: [photo("photo-1449157291145-7efd050a4d0e")],
      },
    ],
  },
  {
    id: "hokkaido",
    title: "去看一场雪",
    place: "北海道",
    start: "2024-01-06",
    end: "2024-01-13",
    route: [
      { date: "2024-01-06", coordinates: [[141.354, 43.062], [141.192, 43.149], [140.994, 43.197]] },
      { date: "2024-01-09", coordinates: [[140.994, 43.197], [140.766, 42.551], [140.728, 42.314]] },
    ],
    tickets: [
      {
        id: "otaru-rail", kind: "rail", width: 480, ratio: 2.3, rotate: -1,
        face: { from: "札幌", to: "小樽", fromEn: "Sapporo", toEn: "Otaru", train: "快速", date: "2024年01月10日", time: "15:12", seat: "自由席", price: "¥750", serial: "JR0110A152733", note: "当日限り有効" },
        title: "去小樽的列车",
        essay: "列车离开札幌后，窗外慢慢只剩白色。我们把便当放在窗边，像两个第一次坐火车的小孩。",
        photos: [photo("photo-1473445361085-b9a07f55608b"), photo("photo-1464822759023-fed622ff2c3b")],
      },
    ],
  },
];
