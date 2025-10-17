Geliom - Proje Detay Raporu ve Geliştirme Planı
Doküman Sürümü: 1.0
Son Güncelleme: 17.10.2025
1. Proje Özeti ve Vizyon
1.1. Proje Adı
Geliom
1.2. Proje Vizyonu
İnsanların dijital gürültüden uzak, sadece en yakın çevreleriyle (arkadaşlar ve aile) samimi ve anlık bir şekilde bağlantı kurarak sosyal hayatlarını zahmetsizce organize etmelerini sağlayan bir platform olmak.
1.3. Çözülen Temel Problem
"Ne yapsak?", "Müsait misin?", "Hadi buluşalım!" gibi günlük sosyal koordinasyon sorularını, uzun mesajlaşmalara veya telefon trafiğine gerek kalmadan, tek bir dokunuşla çözmek. Spontane buluşmaları ve planlı etkinlikleri teşvik etmek.
1.4. Hedef Kitle
Birincil: 16-25 yaş arası lise/üniversite öğrencileri ve genç profesyoneller.
İkincil: Yakın aile bağlarına sahip, teknolojiye yatkın yetişkinler.
2. Teknoloji Yığını ve Mimari
Bu teknoloji yığını, hızlı geliştirme (Expo), ölçeklenebilirlik (Supabase) ve sektör standardı araçlarla (Firebase, Adapty) sağlam bir temel oluşturmak için seçilmiştir.
Alan
Teknoloji/Servis
Beklentiler ve Sorumluluklar
Frontend
React Native (Expo)
Hızlı ve cross-platform (iOS/Android) geliştirme. Kolay OTA (Over-the-Air) güncellemeler.
Navigasyon
React Navigation
Ekranlar arası geçişlerin akıcı ve standartlara uygun yönetimi.
State Management
Zustand / Context API
Uygulama genelindeki state'in (kullanıcı bilgileri, gruplar vb.) verimli yönetimi.
Backend (BaaS)
Supabase
Projenin ana backend'i. Tüm veri işlemleri, kimlik doğrulama ve anlık güncellemeler buradan yönetilecek.
Veritabanı
Supabase (PostgreSQL)
İlişkisel veri yapısı, güçlü sorgulama ve veri bütünlüğü. Satır Seviyesi Güvenlik (RLS) ile maksimum güvenlik.
Kimlik Doğrulama
Supabase Auth
Google ile güvenli ve kolay giriş. Kullanıcı yönetimi.
Anlık Veri
Supabase Realtime
Durum ve duygu durumu değişikliklerinin tüm grup üyelerine anında yansıtılması.
Sunucu Fonksiyonları
Supabase Edge Functions
Bildirim gönderme, zamanlanmış etkinlikleri kontrol etme gibi sunucu tarafı mantıkların çalıştırılması.
Push Bildirim
OneSignal
Segmentasyon, zengin bildirimler ve yüksek teslimat oranı. Kullanıcıya özel bildirimlerin yönetimi.
Abonelik Yönetimi
Adapty
App Store/Play Store aboneliklerinin kolay entegrasyonu. Paywall A/B testi, gelir analizi ve kullanıcı segmentasyonu.
Analiz & Hata Takibi
Firebase
Analytics: Kullanıcı davranışlarını (en çok kullanılan özellikler, ekran süreleri vb.) izleyerek ürün kararları alma.
Crashlytics: Uygulama çökmelerini anında tespit edip detaylı raporlar alarak hızlıca düzeltme.

3. Veritabanı Mimarisi
Veritabanı yapısı, projenin temelini oluşturur. Tüm tablolar, ilişkiler ve güvenlik politikaları supabase_setup.sql betiğinde tanımlanmıştır. Detaylı görsel şema için db_diagram.md dosyasına bakılmalıdır.
Ana Tablolar:
users: Kullanıcı profilleri.
groups: Arkadaş ve aile grupları.
group_members: Kullanıcı-grup ilişkisi.
statuses / user_statuses: Anlık eylem durumları.
moods: Statik duygu durumları.
subscriptions: Kullanıcı abonelik bilgileri.
scheduled_events: Zamanlanmış etkinlikler (Premium).
nicknames, muted_notifications: Sosyal etkileşim tabloları.
4. Özellik Listesi ve Kullanıcı Akışları (Features & Actions)
4.1. Ücretsiz Özellikler (MVP Çekirdeği)
Kullanıcı Yönetimi ve Profil
[ ] Action: Kullanıcı Google hesabı ile uygulamaya giriş yapar.
[ ] Action: İlk girişte kullanıcı için otomatik olarak profil ve custom_user_id oluşturulur.
[ ] Ekran: Profilim Ekranı
[ ] Action: Kullanıcı display_name ve custom_user_id'sini güncelleyebilir.
[ ] Action: Kullanıcı, önceden tanımlı moods listesinden duygu durumunu seçebilir.
[ ] Action: Kullanıcı, duygu durumunun (show_mood) diğerleri tarafından görülüp görülmeyeceğini ayarlayabilir.
Grup Yönetimi
[ ] Ekran: Ana Ekran (Dashboard)
[ ] Action: Kullanıcı, üye olduğu grupları ve aileleri listeler.
[ ] Action: "Grup Oluştur" butonu ile yeni bir grup/aile oluşturur (1 adet grup, 1 adet aile limiti).
[ ] Action: "Gruba Katıl" alanına davet kodu girerek bir gruba dahil olur.
[ ] Ekran: Grup Detayları Ekranı
[ ] Action: Grup üyelerini ve anlık durumlarını/duygularını görür.
[ ] Action: Gruba özel invite_code'u kopyalayıp paylaşabilir.
[ ] Action: Gruptan ayrılabilir.
Sosyal Etkileşim
[ ] Component: Hızlı Eylem Butonları (Ana Ekranda)
[ ] Action: Kullanıcı "Müsaitim", "Meşgulüm" gibi statik statuses listesinden birini seçer.
[ ] Backend: Seçilen durum, user_statuses tablosunu günceller ve Realtime ile anında diğer üyelere yansır.
[ ] Backend: Eğer durum notifies=true ise, Supabase Edge Function tetiklenir ve OneSignal üzerinden gruba bildirim gönderilir.
[ ] Action: Grup Detayları ekranında bir üyenin üzerine basılı tutarak o üyeye özel, sadece kendisinin görebileceği bir nickname atayabilir.
[ ] Action: Grup Detayları ekranında bir üyeden gelen bildirimleri sessize alabilir (muted_notifications).
4.2. Premium Özellikler (Abonelikli)
Abonelik Yönetimi
[ ] Ekran: Premium/Paywall Ekranı
[ ] Action: Kullanıcıya premium özellikler tanıtılır ve abonelik seçenekleri sunulur (aylık/yıllık).
[ ] Backend: Adapty SDK'sı ile satın alma işlemi yönetilir.
[ ] Backend: Başarılı satın alma sonrası Adapty webhook'u veya client tarafı callback ile subscriptions tablosu güncellenir.
[ ] Action: Kullanıcı, profil ekranından mevcut abonelik durumunu ve bitiş tarihini görebilir.
Genişletilmiş Limitler
[ ] Backend: Kullanıcının subscriptions.status'u 'premium' ise grup ve aile oluşturma limitleri kaldırılır.
[ ] Backend: Premium kullanıcıların oluşturduğu grupların member_limit'i daha yüksek olur (örn: 15).
Zamanlanmış Etkinlikler
[ ] Ekran: Etkinlik Oluşturma Ekranı (Premium)
[ ] Action: Kullanıcı bir grup seçerek etkinlik adı, tarihi ve saati belirler.
[ ] Action: Etkinlik için bildirim zamanı ayarlar.
[ ] Backend: scheduled_events tablosuna yeni etkinlik kaydedilir.
[ ] Backend: Zamanlanmış bir Supabase Edge Function (cron job), notification_time'ı gelen etkinlikleri kontrol eder ve zamanı geldiğinde gruba bildirim gönderir.
Özelleştirme
[ ] Action: Premium kullanıcılar, kendilerine özel durum ifadeleri (statuses) oluşturabilir (is_custom=true).
5. Geliştirme Yol Haritası (Fazlar)
Faz 1: Altyapı ve Çekirdek MVP (Sprint 1-2)
Hedef: Kullanıcıların giriş yapıp, grup kurup, anlık durumlarını görebildiği temel bir uygulama.
Görevler:
Tüm servislerin (Supabase, OneSignal, Firebase, Adapty) projelerini oluştur ve konfigürasyonlarını yap.
Expo projesini başlat, navigasyon yapısını kur.
supabase_setup.sql betiğini çalıştırarak veritabanını oluştur.
Supabase Auth ile Google Girişini entegre et. handle_new_user trigger'ının çalıştığını doğrula.
Profil ekranını ve kullanıcı bilgilerini güncelleme işlevini tamamla.
Grup oluşturma, davet kodu ile katılma ve gruptan ayrılma akışını tamamla.
Ana ekranda grup üyelerini ve durumlarını Supabase Realtime ile anlık olarak göster.
Hızlı eylem butonları ile durum güncelleme işlevini tamamla.
Faz 2: Bildirimler ve Sosyal Özellikler (Sprint 3)
Hedef: Uygulamayı daha interaktif ve kişisel hale getirmek.
Görevler:
OneSignal SDK'sını entegre et ve kullanıcı onesignal_player_id'sini users tablosuna kaydet.
Durum güncellendiğinde bildirim gönderecek Supabase Edge Function'ı yaz ve deploy et.
Takma isim (nickname) ekleme ve gösterme özelliğini geliştir.
Kullanıcı bildirimlerini sessize alma (mute) özelliğini geliştir.
Duygu durumu (mood) seçme ve gösterme özelliğini tamamla.
Faz 3: Monetizasyon ve Premium Geçiş (Sprint 4)
Hedef: Uygulamadan gelir elde etme altyapısını kurmak.
Görevler:
Adapty SDK'sını entegre et. App Store Connect ve Google Play Console'da ürünleri tanımla.
Paywall ekranını tasarla ve geliştir.
Satın alma akışını ve abonelik durumu kontrolünü (hem client hem backend) tamamla.
Grup oluşturma ve üye ekleme gibi işlemlerde abonelik durumunu kontrol eden RLS politikalarını veya backend mantığını ekle.
Faz 4: Gelişmiş Premium Özellikler (Sprint 5 ve sonrası)
Hedef: Premium abonelere daha fazla değer sunmak.
Görevler:
Zamanlanmış etkinlik oluşturma ekranını ve akışını geliştir.
Zamanlanmış bildirimler için cron job mantığını Supabase Edge Function ile kur.
Premium kullanıcılar için özel durum (custom status) oluşturma özelliğini geliştir.
Kullanıcı geri bildirimlerine göre yeni özellikler planla (örn: aile tak
