const { execFileSync } = require("node:child_process");

try {
  const version = execFileSync("xcodebuild", ["-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const match = version.match(/^Xcode (\d+)\.(\d+)/m);
  if (!match) throw new Error("Xcode sürümü belirlenemedi.");
  const [, major, minor] = match.map(Number);
  if (major < 26 || (major === 26 && minor < 4)) {
    throw new Error(`Seçili Xcode ${major}.${minor}; Expo SDK 57 için Xcode 26.4 veya üstü gerekiyor.`);
  }
  execFileSync("xcrun", ["--find", "clang++"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  console.log(`iOS toolchain: Xcode ${major}.${minor}`);
} catch (error) {
  console.error(error.stderr?.toString().trim() || error.message);
  console.error("Xcode kurulumunu/lisansını tamamlayın ve xcode-select veya DEVELOPER_DIR ile uygun sürümü seçin. Ayrıntılar: docs/ios-build.md");
  process.exit(1);
}
