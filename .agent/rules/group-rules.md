---
trigger: always_on
---

Group state her zaman socket ile dinlenmeli ve tek connection olmalı. datalar zustand ile tutulmalı ve kullanılırken gerekli olan alan alınmalı sadece ör "const status = useSelector(state=>state.status)".

group update etme istekleri react query ile yapılmalı CRUD işlemleri tanımlanım her zaman mevcut olanlar kullanılmalı

zustandda groups lar ve active group olarak tutulmalı, socket ile sadece active group update edilmeli, seçilen group değiştiği zaman active group değişerek yeniveriler alınmalı.
