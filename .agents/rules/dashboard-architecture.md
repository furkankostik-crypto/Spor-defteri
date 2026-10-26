---
description: Ana sayfa kokpit (dashboard) sıfır kaydırma mimari kuralları ve UI sözleşmesi
always_on: true
---

# Dashboard (Ana Sayfa) UI ve Mimari Sözleşmesi

Bu proje kapsamında **Ana Sayfa (`WorkoutView.tsx`)** için aşağıdaki katı kurallar geçerlidir:

1. **Sıfır Kaydırma ve Tam Erişilebilirlik Kuralı (Zero-Scroll & Zero Cut-Off):**
   - Ana sayfa bir web listesi değil, tek ekranlı bir kokpittir (cockpit dashboard).
   - "Sıfır kaydırma", öğeleri `overflow: hidden` ile ekranın altında kesmek veya yok etmek DEĞİLDİR.
   - Kullanıcı sayfadaki her bir kartı, göstergeyi ve en alttaki "Antrenmanı Başlat" aksiyon butonunu taşma ve birbirinin üstüne binme (çakışma) olmadan %100 görebilmeli ve dokunabilmelidir.
   - Ekstrem cihaz yüksekliklerinde (<480px vb.) kullanıcının hiçbir butondan mahrum kalmaması için sessiz esnek erişim güvencesi (`dashboard-scroll-safe`) korunur.

2. **Yükseklik Kontratı & Bütçesi:**
   - Sayfa dikey alanı 4 ana bölüme paylaştırılmıştır:
     - **Header**: ~32-38px (Logo, Tarih, Düzen Modu Butonu, Burger Menü)
     - **Kart 1 (Sporcu & Seri & Hacim)**: ~%20-25 dikey bütçe
     - **Kart 2 (Kas Hazırlık Haritası)**: ~%25-28 dikey bütçe (`BodyReadinessMap`)
     - **Kart 3 (Son Seans / PR & Kilometre Taşları)**: ~%24-28 dikey bütçe (Sekmeli yapı)
     - **Kart 4 (Aksiyon Başlatıcı)**: ~%10 dikey bütçe (Kompakt 42-46px ana buton)
   - Hiçbir bileşen ana sayfada kontrolsüz dikey genişleme yapamaz.

3. **Tam Otomatik Boyutlandırma (`isCompact`):**
   - Kompakt mod kullanıcı tercihine veya manuel butonlara bağlı DEĞİLDİR; arayüzde manuel layout toggle butonu yer almaz.
   - Cihaz ekran yüksekliği ve yönü (`screenHeight < 780` veya orientationchange) değiştiğinde sistem otomatik olarak `isCompact = true` yapar.
   - Eklenen veya düzenlenen tüm UI parçaları `isCompact` prop veya değişkenine göre otomatik ölçeklenebilir (responsive padding, font, icon boyutu) tasarlanmalıdır.

4. **Detaylar Modallarda Gösterilir:**
   - Çok sayıda egzersiz içeren geçmiş seanslar, plan seçimi, ayarlar ve kas detay analizleri doğrudan ana sayfaya basılmaz; `modal-backdrop` üzerinden tam ekran / popup modal olarak açılır.
