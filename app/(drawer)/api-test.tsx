import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
    apiUtils,
    supabase,
    useCreateGroup,
    useCreateMood,
    useCreateStatus,
    useCreateUser,
    useCurrentUser,
    useDeleteGroup,
    useDeleteMood,
    useDeleteStatus,
    useDeleteUser,
    useGroups,
    useJoinGroup,
    useLeaveGroup,
    useMoods,
    useStatuses,
    useUpdateGroup,
    useUpdateMood,
    useUpdateStatus,
    useUpdateUser,
    useUsers,
    type CreateGroup,
    type CreateMood,
    type CreateStatus,
    type CreateUser,
} from '../../api';
import { BaseLayout, Button, CustomText as Text } from '../../components/shared';

// ==========================================
// 🔧 TEST VERİLERİ - BURADAN DEĞİŞTİREBİLİRSİN
// ==========================================
const TEST_DATA = {
  // 👤 Kullanıcı Test Verisi (Auth ile oluşturulacak)
  auth: {
    email: `test.user.${Date.now()}.${Math.floor(Math.random() * 1000)}@gmail.com`, // Timestamp + random
    password: 'TestPassword123!',
  },
  user: {
    custom_user_id: 'test_user_' + Date.now(), // Unique ID için timestamp ekle
    display_name: 'Test Kullanıcı',
    photo_url: 'https://example.com/photo.jpg',
    show_mood: true,
  } as CreateUser,
  
  // 😊 Mood Test Verisi
  mood: {
    text: 'Mutlu',
    emoji: '😊',
  } as CreateMood,
  
  // 👥 Grup Test Verisi
  group: {
    owner_id: '', // Otomatik doldurulacak (current user)
    name: 'Test Grubu ' + new Date().toLocaleTimeString('tr-TR'),
    type: 'public',
    invite_code: '', // Otomatik generate edilecek
    member_limit: 50,
  } as CreateGroup,
  
  // 📋 Status Test Verisi
  status: {
    text: 'Çalışıyor ' + new Date().toLocaleTimeString('tr-TR'),
    notifies: true,
    is_custom: true,
    owner_id: '', // Otomatik doldurulacak (current user)
  } as CreateStatus,
};

// ==========================================
// 🎯 TEST AYARLARI
// ==========================================
const TEST_CONFIG = {
  // Test sonuçlarında gösterilecek maksimum log sayısı
  maxLogCount: 50,
  
  // Test butonları için renkler
  colors: {
    create: '#4CAF50',    // Yeşil
    update: '#2196F3',    // Mavi
    delete: '#f44336',    // Kırmızı
    utility: '#FF9800',   // Turuncu
    runAll: '#9C27B0',    // Mor
  },
};

export default function ApiTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const { data: users, refetch: refetchUsers } = useUsers();
  const { data: moods, refetch: refetchMoods } = useMoods();
  const { data: groups, refetch: refetchGroups } = useGroups();
  const { data: statuses, refetch: refetchStatuses } = useStatuses();
  const { data: currentUser } = useCurrentUser();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const createMood = useCreateMood();
  const updateMood = useUpdateMood();
  const deleteMood = useDeleteMood();
  
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  
  const createStatus = useCreateStatus();
  const updateStatus = useUpdateStatus();
  const deleteStatus = useDeleteStatus();

  const addTestResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    const result = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => {
      const newResults = [result, ...prev];
      // Maksimum log sayısını aşarsa eski logları sil
      return newResults.slice(0, TEST_CONFIG.maxLogCount);
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // USER TESTS
  const testCreateUser = async () => {
    console.log('🔥 testCreateUser başlatıldı');
    addTestResult(`🔥 Test başlatıldı - ${new Date().toLocaleTimeString()}`);
    
    try {
      setIsLoading(true);
      addTestResult(`⏳ Loading durumu: true`);
      
      // Her seferinde yeni email oluştur (rate limiting'i önlemek için)
      const uniqueEmail = `test.user.${Date.now()}.${Math.floor(Math.random() * 1000)}@gmail.com`;
      const testAuthData = {
        email: uniqueEmail,
        password: TEST_DATA.auth.password,
      };
      
      // Test verilerini kontrol et
      console.log('Test verileri:', testAuthData);
      addTestResult(`📧 Email: ${testAuthData.email}`);
      addTestResult(`🔑 Password uzunluğu: ${testAuthData.password.length}`);
      
      // 1. Önce Auth ile kullanıcı oluştur
      addTestResult(`🚀 Auth kullanıcısı oluşturuluyor: ${testAuthData.email}`);
      
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: testAuthData.email,
        password: testAuthData.password,
      });

      console.log('Auth response:', { authData, authError });
      addTestResult(`📊 Auth response alındı`);

      if (authError) {
        console.error('Auth error:', authError);
        
        // Eğer kullanıcı zaten varsa, bu bir hata değil
        if (authError.message.includes('User already registered')) {
          addTestResult(`ℹ️ Kullanıcı zaten kayıtlı: ${testAuthData.email}`);
          // Mevcut kullanıcı ile giriş yapmayı dene
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testAuthData.email,
            password: testAuthData.password,
          });
          
          if (signInError || !signInData.user) {
            throw new Error(`Mevcut kullanıcı ile giriş yapılamadı: ${signInError?.message}`);
          }
          
          // signInData'yı authData olarak kullan
          authData = signInData;
          addTestResult(`✅ Mevcut kullanıcı ile giriş yapıldı: ${authData.user?.id}`);
        } else {
          addTestResult(`❌ Auth hatası: ${authError.message}`, true);
          throw new Error(`Auth hatası: ${authError.message}`);
        }
      }

      if (!authData.user) {
        addTestResult(`❌ Auth kullanıcısı null`, true);
        throw new Error('Auth kullanıcısı oluşturulamadı');
      }

      addTestResult(`✅ Auth kullanıcısı oluşturuldu: ${authData.user.id}`);
      addTestResult(`📧 Email confirmed: ${authData.user.email_confirmed_at ? 'Evet' : 'Hayır'}`);

      // 2. Önce bu kullanıcı users tablosunda var mı kontrol et
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (existingUser) {
        addTestResult(`ℹ️ Kullanıcı zaten users tablosunda mevcut: ${authData.user.id}`);
      } else {
        // Users tablosuna ekle
        const userData = {
          ...TEST_DATA.user,
          id: authData.user.id, // Auth user ID'sini kullan
          custom_user_id: `test_user_${Date.now()}`, // Her seferinde yeni custom_user_id
        };

        console.log('User data:', userData);
        addTestResult(`👤 Users tablosuna ekleniyor...`);

        const result = await createUser.mutateAsync(userData);
        addTestResult(`✅ Users tablosuna eklendi: ${result.display_name} (ID: ${result.id})`);
      }
      
      // 3. Hemen çıkış yap (test amaçlı)
      await supabase.auth.signOut();
      addTestResult(`✅ Test kullanıcısından çıkış yapıldı`);
      
      refetchUsers();
      addTestResult(`🔄 Users listesi yenilendi`);
      
    } catch (error: any) {
      console.error('Test error:', error);
      addTestResult(`❌ Kullanıcı oluşturma hatası: ${error.message}`, true);
      addTestResult(`❌ Error stack: ${error.stack?.substring(0, 100)}...`, true);
    } finally {
      setIsLoading(false);
      addTestResult(`⏳ Loading durumu: false`);
      console.log('🏁 testCreateUser tamamlandı');
    }
  };

  const testUpdateUser = async () => {
    if (!users || users.length === 0) {
      addTestResult('Güncellenecek kullanıcı bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const user = users[0];
      const result = await updateUser.mutateAsync({
        id: user.id,
        updates: { display_name: `${user.display_name} (Güncellendi)` }
      });
      addTestResult(`Kullanıcı güncellendi: ${result.display_name}`);
      refetchUsers();
    } catch (error: any) {
      addTestResult(`Kullanıcı güncelleme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteUser = async () => {
    if (!users || users.length === 0) {
      addTestResult('Silinecek kullanıcı bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const user = users[users.length - 1]; // Son kullanıcıyı sil
      await deleteUser.mutateAsync(user.id);
      addTestResult(`Kullanıcı silindi: ${user.display_name}`);
      refetchUsers();
    } catch (error: any) {
      addTestResult(`Kullanıcı silme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  // AUTH TEST - Giriş yapma testi
  const testSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Son oluşturulan kullanıcının email'ini kullan (basit test için)
      const testEmail = `test.user.${Date.now()}.${Math.floor(Math.random() * 1000)}@gmail.com`;
      
      addTestResult(`⚠️ Not: Bu test için önce bir kullanıcı oluşturmanız gerekiyor`);
      addTestResult(`Giriş yapılıyor: ${testEmail}`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: TEST_DATA.auth.password,
      });

      if (authError) {
        throw new Error(`Giriş hatası: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Giriş yapılamadı');
      }

      addTestResult(`✅ Başarıyla giriş yapıldı: ${authData.user.email}`);
      
      // Birkaç saniye bekle sonra çıkış yap
      setTimeout(async () => {
        await supabase.auth.signOut();
        addTestResult(`✅ Çıkış yapıldı`);
      }, 2000);
      
    } catch (error: any) {
      addTestResult(`Giriş yapma hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  // MOOD TESTS
  const testCreateMood = async () => {
    try {
      setIsLoading(true);
      const result = await createMood.mutateAsync(TEST_DATA.mood);
      addTestResult(`Mood oluşturuldu: ${result.text} ${result.emoji} (ID: ${result.id})`);
      refetchMoods();
    } catch (error: any) {
      addTestResult(`Mood oluşturma hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateMood = async () => {
    if (!moods || moods.length === 0) {
      addTestResult('Güncellenecek mood bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const mood = moods[0];
      const result = await updateMood.mutateAsync({
        id: mood.id,
        updates: { text: `${mood.text} (Güncellendi)` }
      });
      addTestResult(`Mood güncellendi: ${result.text}`);
      refetchMoods();
    } catch (error: any) {
      addTestResult(`Mood güncelleme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteMood = async () => {
    if (!moods || moods.length === 0) {
      addTestResult('Silinecek mood bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const mood = moods[moods.length - 1];
      await deleteMood.mutateAsync(mood.id);
      addTestResult(`Mood silindi: ${mood.text}`);
      refetchMoods();
    } catch (error: any) {
      addTestResult(`Mood silme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  // GROUP TESTS
  const testCreateGroup = async () => {
    if (!currentUser) {
      addTestResult('Grup oluşturmak için giriş yapmalısınız', true);
      return;
    }

    try {
      setIsLoading(true);
      const groupData = {
        ...TEST_DATA.group,
        owner_id: currentUser.id,
        invite_code: apiUtils.generateInviteCode(),
      };
      const result = await createGroup.mutateAsync(groupData);
      addTestResult(`Grup oluşturuldu: ${result.name} (Kod: ${result.invite_code})`);
      refetchGroups();
    } catch (error: any) {
      addTestResult(`Grup oluşturma hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateGroup = async () => {
    if (!groups || groups.length === 0) {
      addTestResult('Güncellenecek grup bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const group = groups[0];
      const result = await updateGroup.mutateAsync({
        id: group.id,
        updates: { name: `${group.name} (Güncellendi)` }
      });
      addTestResult(`Grup güncellendi: ${result.name}`);
      refetchGroups();
    } catch (error: any) {
      addTestResult(`Grup güncelleme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteGroup = async () => {
    if (!groups || groups.length === 0) {
      addTestResult('Silinecek grup bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const group = groups[groups.length - 1];
      await deleteGroup.mutateAsync(group.id);
      addTestResult(`Grup silindi: ${group.name}`);
      refetchGroups();
    } catch (error: any) {
      addTestResult(`Grup silme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  // STATUS TESTS
  const testCreateStatus = async () => {
    if (!currentUser) {
      addTestResult('Status oluşturmak için giriş yapmalısınız', true);
      return;
    }

    try {
      setIsLoading(true);
      const statusData = {
        ...TEST_DATA.status,
        owner_id: currentUser.id,
      };
      const result = await createStatus.mutateAsync(statusData);
      addTestResult(`Status oluşturuldu: ${result.text} (ID: ${result.id})`);
      refetchStatuses();
    } catch (error: any) {
      addTestResult(`Status oluşturma hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateStatus = async () => {
    if (!statuses || statuses.length === 0) {
      addTestResult('Güncellenecek status bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const status = statuses[0];
      const result = await updateStatus.mutateAsync({
        id: status.id,
        updates: { text: `${status.text} (Güncellendi)` }
      });
      addTestResult(`Status güncellendi: ${result.text}`);
      refetchStatuses();
    } catch (error: any) {
      addTestResult(`Status güncelleme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteStatus = async () => {
    if (!statuses || statuses.length === 0) {
      addTestResult('Silinecek status bulunamadı', true);
      return;
    }

    try {
      setIsLoading(true);
      const status = statuses[statuses.length - 1];
      await deleteStatus.mutateAsync(status.id);
      addTestResult(`Status silindi: ${status.text}`);
      refetchStatuses();
    } catch (error: any) {
      addTestResult(`Status silme hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  // SIMPLE TEST - Log sistemini test et
  const testLogSystem = () => {
    console.log('🧪 Log sistemi test ediliyor');
    addTestResult(`🧪 Log sistemi test - ${new Date().toLocaleTimeString()}`);
    addTestResult(`✅ Bu bir başarılı log`);
    addTestResult(`❌ Bu bir hata logu`, true);
    addTestResult(`📊 Test verileri: Email=${TEST_DATA.auth.email}`);
    addTestResult(`🔢 Timestamp: ${Date.now()}`);
    console.log('✅ Log sistemi testi tamamlandı');
  };

  // UTILITY TESTS
  const testUtilities = async () => {
    try {
      setIsLoading(true);
      addTestResult(`🔧 Utility testleri başlatılıyor...`);
      
      // Test invite code generation
      const inviteCode = apiUtils.generateInviteCode();
      addTestResult(`📨 Davet kodu oluşturuldu: ${inviteCode}`);
      
      // Test current user ID
      const userId = await apiUtils.getCurrentUserId();
      addTestResult(`👤 Mevcut kullanıcı ID: ${userId || 'Giriş yapılmamış'}`);
      
      // Test date formatting
      const formattedDate = apiUtils.formatEventDate(new Date().toISOString());
      addTestResult(`📅 Formatlanmış tarih: ${formattedDate}`);
      
      addTestResult(`✅ Utility testleri tamamlandı`);
      
    } catch (error: any) {
      addTestResult(`❌ Utility test hatası: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addTestResult('🚀 Tüm testler başlatılıyor...');
    
    // Utility testleri
    await testUtilities();
    
    // Auth testleri
    await testCreateUser(); // Bu artık auth ile kayıt yapıyor
    
    // Diğer testler
    await testCreateMood();
    await testCreateStatus();
    await testCreateGroup();
    
    addTestResult('🎉 Tüm testler tamamlandı!');
  };

  return (
    <BaseLayout 
      headerShow={true}
      header={{
        title: <Text variant="h2" style={{ color: 'white' }}>API Test</Text>
      }}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Mevcut Veriler */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>📊 Mevcut Veriler</Text>
          <Text>👥 Kullanıcılar: {users?.length || 0}</Text>
          <Text>😊 Moods: {moods?.length || 0}</Text>
          <Text>👥 Gruplar: {groups?.length || 0}</Text>
          <Text>📋 Statuslar: {statuses?.length || 0}</Text>
          <Text>🔐 Mevcut Kullanıcı: {currentUser?.display_name || 'Giriş yapılmamış'}</Text>
        </View>

        {/* Test Butonları */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>🧪 Test İşlemleri</Text>
          
          {/* Genel Testler */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>Genel</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Tüm Testleri Çalıştır" 
                onPress={runAllTests}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.runAll }}
              />
              <Button 
                title="Sonuçları Temizle" 
                onPress={clearResults}
                style={{ backgroundColor: TEST_CONFIG.colors.utility }}
              />
              <Button 
                title="Log Sistemi Test" 
                onPress={testLogSystem}
                disabled={isLoading}
                style={{ backgroundColor: '#9C27B0' }}
              />
              <Button 
                title="Utility Testleri" 
                onPress={testUtilities}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.utility }}
              />
            </View>
          </View>

          {/* Auth Testleri */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>🔐 Auth Testleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Kullanıcı Kayıt Et" 
                onPress={testCreateUser}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.create }}
              />
              <Button 
                title="Giriş Yap" 
                onPress={testSignIn}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.update }}
              />
            </View>
          </View>

          {/* User Testleri */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>👥 Kullanıcı Testleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Kullanıcı Güncelle" 
                onPress={testUpdateUser}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.update }}
              />
              <Button 
                title="Kullanıcı Sil" 
                onPress={testDeleteUser}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.delete }}
              />
            </View>
          </View>

          {/* Mood Testleri */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>😊 Mood Testleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Mood Oluştur" 
                onPress={testCreateMood}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.create }}
              />
              <Button 
                title="Mood Güncelle" 
                onPress={testUpdateMood}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.update }}
              />
              <Button 
                title="Mood Sil" 
                onPress={testDeleteMood}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.delete }}
              />
            </View>
          </View>

          {/* Group Testleri */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>👥 Grup Testleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Grup Oluştur" 
                onPress={testCreateGroup}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.create }}
              />
              <Button 
                title="Grup Güncelle" 
                onPress={testUpdateGroup}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.update }}
              />
              <Button 
                title="Grup Sil" 
                onPress={testDeleteGroup}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.delete }}
              />
            </View>
          </View>

          {/* Status Testleri */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="h4" style={{ marginBottom: 8 }}>📋 Status Testleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                title="Status Oluştur" 
                onPress={testCreateStatus}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.create }}
              />
              <Button 
                title="Status Güncelle" 
                onPress={testUpdateStatus}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.update }}
              />
              <Button 
                title="Status Sil" 
                onPress={testDeleteStatus}
                disabled={isLoading}
                style={{ backgroundColor: TEST_CONFIG.colors.delete }}
              />
            </View>
          </View>
        </View>

        {/* Test Sonuçları */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>📋 Test Sonuçları ({testResults.length})</Text>
          <View style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: 8, 
            padding: 12,
            maxHeight: 400 
          }}>
            <ScrollView>
              {testResults.length === 0 ? (
                <Text style={{ color: '#888', fontStyle: 'italic' }}>
                  Henüz test çalıştırılmadı...
                </Text>
              ) : (
                testResults.map((result, index) => (
                  <Text 
                    key={index} 
                    style={{ 
                      color: result.includes('❌') ? '#f44336' : '#4CAF50',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      marginBottom: 4
                    }}
                  >
                    {result}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Text style={{ color: 'white', fontSize: 18 }}>⏳ Test çalışıyor...</Text>
          </View>
        )}
      </ScrollView>
    </BaseLayout>
  );
}
