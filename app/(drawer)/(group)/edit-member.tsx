import { useDeleteNickname, useNickname, useUpsertNickname } from '@/api/nicknames';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditMemberScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedGroup } = useGroupContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ memberData: string }>();

  const [member, setMember] = useState<GroupMemberWithUser | null>(null);
  const [nickname, setNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Parse member data from params
  useEffect(() => {
    if (params.memberData) {
      try {
        const parsedMember = JSON.parse(params.memberData) as GroupMemberWithUser;
        setMember(parsedMember);
      } catch (error) {
        console.error('Error parsing member data:', error);
        Alert.alert('Hata', 'Üye bilgileri yüklenemedi.');
        router.back();
      }
    }
  }, [params.memberData]);

  // Fetch existing nickname
  const { data: existingNickname, isLoading: nicknameLoading } = useNickname(
    selectedGroup?.id || '',
    user?.id || '',
    member?.user_id || ''
  );

  // Set initial nickname value
  useEffect(() => {
    if (existingNickname?.nickname) {
      setNickname(existingNickname.nickname);
    }
  }, [existingNickname]);

  const upsertNickname = useUpsertNickname();
  const deleteNickname = useDeleteNickname();

  const handleSave = async () => {
    if (!selectedGroup || !user || !member) return;

    const trimmedNickname = nickname.trim();

    // Eğer nickname boşsa, mevcut nickname'i sil
    if (!trimmedNickname) {
      if (existingNickname) {
        setIsSaving(true);
        try {
          await deleteNickname.mutateAsync({
            groupId: selectedGroup.id,
            setterUserId: user.id,
            targetUserId: member.user_id,
          });
          Alert.alert('Başarılı', 'Takma ad kaldırıldı.');
          router.back();
        } catch (error) {
          console.error('Error deleting nickname:', error);
          Alert.alert('Hata', 'Takma ad kaldırılırken bir hata oluştu.');
        } finally {
          setIsSaving(false);
        }
      } else {
        router.back();
      }
      return;
    }

    // Nickname kaydet veya güncelle
    setIsSaving(true);
    try {
      await upsertNickname.mutateAsync({
        group_id: selectedGroup.id,
        setter_user_id: user.id,
        target_user_id: member.user_id,
        nickname: trimmedNickname,
      });
      Alert.alert('Başarılı', 'Takma ad kaydedildi.');
      router.back();
    } catch (error) {
      console.error('Error saving nickname:', error);
      Alert.alert('Hata', 'Takma ad kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    if (!existingNickname) return;

    Alert.alert(
      'Takma Adı Kaldır',
      'Bu kullanıcının takma adını kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            if (!selectedGroup || !user || !member) return;
            setIsSaving(true);
            try {
              await deleteNickname.mutateAsync({
                groupId: selectedGroup.id,
                setterUserId: user.id,
                targetUserId: member.user_id,
              });
              Alert.alert('Başarılı', 'Takma ad kaldırıldı.');
              router.back();
            } catch (error) {
              console.error('Error deleting nickname:', error);
              Alert.alert('Hata', 'Takma ad kaldırılırken bir hata oluştu.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!member || nicknameLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = member.user?.display_name || member.user?.custom_user_id || 'Bilinmeyen';

  return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 16 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Üye Bilgileri - Kompakt */}
          <View style={styles.memberRow}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.tertiary }]}>
              <Image
                source={getAvatarSource(member.user?.avatar)}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.memberInfo}>
              <Typography variant="h5" color={colors.text}>
                {displayName}
              </Typography>
              <Typography variant="caption" color={colors.secondaryText}>
                Takma ad düzenle
              </Typography>
            </View>
          </View>

          {/* Takma Ad Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
                color: colors.text,
              }
            ]}
            placeholder="Takma ad..."
            placeholderTextColor={colors.secondaryText}
            value={nickname}
            onChangeText={setNickname}
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {/* Butonlar */}
          <View style={styles.actions}>
            <GeliomButton
              state="active"
              size="large"
              layout="full-width"
              icon="checkmark-circle"
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </GeliomButton>

            {existingNickname && (
              <GeliomButton
                state="passive"
                size="large"
                layout="full-width"
                icon="trash"
                onPress={handleRemove}
                disabled={isSaving}
              >
                Kaldır
              </GeliomButton>
            )}

            <GeliomButton
              state="passive"
              size="large"
              layout="full-width"
              icon="close-circle"
              onPress={() => router.back()}
              disabled={isSaving}
            >
              İptal
            </GeliomButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  memberInfo: {
    flex: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
});

