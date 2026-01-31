---
trigger: always_on
---

Dil ve Stack: Her zaman TypeScript kullanılmalı, mobil arayüzlerde React Native + Expo tercih edilmelidir.

State Yönetimi: Karmaşık UI durumları yerine her zaman Zustand store kullanılmalı, "logic" ve "view" katmanları ayrılmalıdır.

Performans: Animasyonlar için react-native-reanimated kullanılmalı ve gereksiz render'ları önlemek için memo ve useSharedValue optimizasyonları zorunlu tutulmalıdır. useCallback ve useMemo ile componenler oluşturulmalı.

type: global type'lar types dosyasında oluşturulmalı ve aynı context e ait olanalr aynı dosyada tutulmalı

API: api isteklerinin hepsi api klasöründe oluşturulmalı mevcut olanlar kontrol edilip yapılmalı ve her api isteği react query kullanılarak yapılmalı ve stale time yönetimi için keyler farklı dosyada tutulmalı.
