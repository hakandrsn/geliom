import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

/** "1.0.0 (12)" — native sürüm ve build numarası; yoksa app.json'daki sürüm. */
export function getAppVersionLabel(): string {
  const version =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "0.0.0";
  const build = Application.nativeBuildVersion;
  return build ? `${version} (${build})` : version;
}

/** Destek mesajına eklenen kısa cihaz özeti. */
export function getAppInfoString(): string {
  const os = `${Platform.OS} ${Device.osVersion ?? ""}`.trim();
  const model = Device.modelName ?? "bilinmeyen cihaz";
  return `Geliom ${getAppVersionLabel()} · ${os} · ${model}`;
}
