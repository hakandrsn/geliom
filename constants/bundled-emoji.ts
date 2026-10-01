/**
 * Uygulamaya gömülü emoji görselleri — varsayılan durum/ruh hali emojileri
 * ve Premium karşılama modalındakiler.
 * İlk açılışta ve çevrimdışıyken de anında görünsünler diye ağdan değil
 * paketten gelir. Geri kalan katalog API'den (`/api/static/emoji`) yüklenir.
 */
export const BUNDLED_EMOJI: Record<string, number> = {
  "1f7e2": require("../assets/emoji/1f7e2.png"), // 🟢
  "26d4": require("../assets/emoji/26d4.png"), // ⛔
  "1f4bc": require("../assets/emoji/1f4bc.png"), // 💼
  "1f4da": require("../assets/emoji/1f4da.png"), // 📚
  "1f5d3": require("../assets/emoji/1f5d3.png"), // 🗓️
  "1f697": require("../assets/emoji/1f697.png"), // 🚗
  "1f3c3": require("../assets/emoji/1f3c3.png"), // 🏃
  "1f634": require("../assets/emoji/1f634.png"), // 😴
  "1f60a": require("../assets/emoji/1f60a.png"), // 😊
  "1f60c": require("../assets/emoji/1f60c.png"), // 😌
  "26a1": require("../assets/emoji/26a1.png"), // ⚡
  "1f929": require("../assets/emoji/1f929.png"), // 🤩
  "1f971": require("../assets/emoji/1f971.png"), // 🥱
  "1f623": require("../assets/emoji/1f623.png"), // 😣
  "1f614": require("../assets/emoji/1f614.png"), // 😔
  "1f610": require("../assets/emoji/1f610.png"), // 😐
  "1f4bb": require("../assets/emoji/1f4bb.png"), // 💻
  "1f389": require("../assets/emoji/1f389.png"), // 🎉
  "1f91d": require("../assets/emoji/1f91d.png"), // 🤝
  "1f680": require("../assets/emoji/1f680.png"), // 🚀
  "1f3a8": require("../assets/emoji/1f3a8.png"), // 🎨
  "270f": require("../assets/emoji/270f.png"), // ✏️
};
