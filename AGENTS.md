# GymPad (Spor Defterim) - Geliştirme ve Mimari Kuralları

## 1. Dashboard (Ana Sayfa) Dokunulmazlık Kuralları

Ana sayfa (`WorkoutView.tsx`), geleneksel yukarı-aşağı kaydırılan bir web/mobil liste sayfası **DEĞİLDİR**. Bir **Sporcu Kokpiti / Dashboard** olarak tasarlanmıştır.

### Temel Prensipler:
1. **Sıfır Kaydırma ve Kesintisiz Erişilebilirlik (Zero-Scroll & Zero Cut-Off Guarantee):**
   - "Sıfır kaydırma", öğeleri `overflow: hidden` arkasına itip ekranın altında kesmek veya erişilemez bırakmak DEĞİLDİR.
   - Ekrandaki tüm temel öğeler (Üst Başlık, Sporcu Durumu & Seri, Kas Hazırlık Haritası, Son Seans/PR'lar ve Aksiyon Barı) taşmadan, birbirinin üstüne binmeden (çakışmasız) ve aynı anda ekranda %100 görünür ve tıklanabilir olmalıdır.
   - `body.home-dashboard-active` kuralı ve `100dvh` yüksekliği korunmalıdır.
   - Ekstrem cihaz boyutlarında (<480px, aşırı sistem yazı büyüklüğü) hiçbir butonun kaybolmaması için sessiz esnek güvenlik sübabı devrededir.

2. **Dinamik Yükseklik Bütçesi ve Çakışma Önleme (Height Budget & Anti-Collision):**
   - Dashboard bileşenleri dikey alanı esnek flex oranlarıyla (`flex: 1`, `min-h-0`) paylaşmalıdır.
   - Sabit büyük yükseklikler (`h-[300px]` gibi) kesinlikle verilmemelidir.
   - Kart içi metinler ve göstergeler çakışmayı önlemek için `min-w-0`, dinamik `clamp()` ve ölçeklenebilir SVG viewBox kullanmalıdır.
   - Fazla detay veya uzun listeler ana sayfada dikey uzama yapmak yerine **Modallar / Drawer'lar** veya **Mini Sekmeler (Tabs)** içinde sunulmalıdır.

3. **Tam Otomatik Boyutlandırma ve Kompakt Mod (Fully Automatic Adaptive Design):**
   - Kompakt mod kullanıcı tercihine veya manuel butonlara bağlı DEĞİLDİR. Arayüzde gereksiz toggle butonları yer almaz.
   - Cihazın ekran yüksekliği, çözünürlüğü ve oryantasyonuna (`window.innerHeight < 780px`, resize ve orientationchange) göre %100 otomatik devreye girer:
     - SVG göstergeleri (örn. 58px vs 72px)
     - Kas anatomisi silüetleri (örn. 74px vs 104px)
     - Kart iç boşlukları (`p-2` vs `p-3`) ve aralıklar (`gap-1.5` vs `gap-2.5`)
     - Yazı boyutları (`text-[10px]` ve `text-xs`)
   - Yeni eklenecek her kart/bileşen otomatik `isCompact` desteğiyle gelmelidir.

4. **Derin Bilgiler Modala Taşınmalıdır:**
   - Egzersiz detayları, plan düzenlemeleri, geçmiş seans dökümleri ve ayarlar ana sayfayı uzatamaz; daima modal pencere olarak açılmalıdır.

5. **Performans ve Hissiyat (Haptics & Glassmorphism):**
   - Koyu tema, neon vurgular ve dokunmatik geri bildirimler (haptics/audio) korunmalıdır.
