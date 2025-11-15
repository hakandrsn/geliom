import { apiUtils } from "@/api";
import { useCreateGroup, useJoinGroup } from "@/api/groups";
import { KeyboardAwareView } from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupContext } from "@/contexts/GroupContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { GroupWithOwner } from "@/types/database";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GROUP_TYPES = [
  { value: 'family', label: 'Aile' },
  { value: 'friends', label: 'Arkadaşlar' },
  { value: 'work', label: 'İş' },
  { value: 'other', label: 'Diğer' },
];

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const { setSelectedGroup } = useGroupContext();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Header yüksekliği: 56 (default) + safe area top inset
  const headerHeight = 56 + insets.top;

  const [name, setName] = useState('');
  const [type, setType] = useState('family');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Varsayılan üye limiti - değiştirilemez
  const MEMBER_LIMIT = 5;

  // Grup adı validation: sadece harf ve sayı
  const validateGroupName = (text: string): boolean => {
    // Sadece alphanumeric karakterlere izin ver (Türkçe karakterler dahil)
    const alphanumericRegex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]*$/;
    return alphanumericRegex.test(text);
  };

  const handleNameChange = (text: string) => {
    // Sadece alphanumeric karakterlere izin ver
    if (validateGroupName(text)) {
      setName(text);
      setNameError(null);
    }
  };

  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const handleCreateGroup = async () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setNameError('Grup adı gereklidir');
      Alert.alert('Hata', 'Grup adı gereklidir');
      return;
    }

    if (trimmedName.length < 3) {
      setNameError('Grup adı en az 3 karakter olmalıdır');
      Alert.alert('Hata', 'Grup adı en az 3 karakter olmalıdır');
      return;
    }

    if (!validateGroupName(trimmedName)) {
      setNameError('Grup adı sadece harf ve sayı içerebilir');
      Alert.alert('Hata', 'Grup adı sadece harf ve sayı içerebilir');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setIsSubmitting(true);

      // Invite code oluştur
      const inviteCode = apiUtils.generateInviteCode();

      // Grup oluştur
      const group = await createGroupMutation.mutateAsync({
        owner_id: user.id,
        type,
        name: trimmedName,
        invite_code: inviteCode,
        member_limit: MEMBER_LIMIT,
      });

      // Owner'ı grup üyesi olarak ekle
      await joinGroupMutation.mutateAsync({
        group_id: group.id,
        user_id: user.id,
      });

      // Yeni grubu seçili grup yap
      const groupWithOwner: GroupWithOwner = {
        ...group,
        owner: user,
      };
      await setSelectedGroup(groupWithOwner);

      // Home ekranına navigate et (Expo Router ile)
      router.replace('/(drawer)/home');
    } catch (error: any) {
      console.error('Grup oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Grup oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: handleGoBack,
        },
        title: <Typography variant="h6" color={colors.text}>Yeni Grup Oluştur</Typography>,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAwareView 
        contentContainerStyle={styles.contentContainer}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.header}>
          <Typography variant="body" color={colors.secondaryText} style={styles.subtitle}>
            Arkadaşlarınızla ve ailenizle bağlantı kurun
          </Typography>
        </View>

        <View style={styles.form}>
          {/* Grup Adı */}
          <View style={styles.inputGroup}>
            <Typography variant="bodyLarge" color={colors.text} style={styles.label}>
              Grup Adı *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: nameError ? colors.error : colors.stroke,
                },
              ]}
              placeholder="Örn: Ailem"
              placeholderTextColor={colors.secondaryText}
              value={name}
              onChangeText={handleNameChange}
              maxLength={50}
            />
            {nameError && (
              <Typography variant="caption" color={colors.error} style={styles.errorText}>
                {nameError}
              </Typography>
            )}
            {!nameError && name.length > 0 && name.length < 3 && (
              <Typography variant="caption" color={colors.secondaryText} style={styles.hintText}>
                En az 3 karakter gerekli ({name.length}/3)
              </Typography>
            )}
          </View>

          {/* Grup Tipi */}
          <View style={styles.inputGroup}>
            <Typography variant="bodyLarge" color={colors.text} style={styles.label}>
              Grup Tipi
            </Typography>
            <View style={styles.typeContainer}>
              {GROUP_TYPES.map((groupType) => (
                <GeliomButton
                  key={groupType.value}
                  state={type === groupType.value ? 'active' : 'passive'}
                  size="medium"
                  onPress={() => setType(groupType.value)}
                  disabled={isSubmitting}
                >
                  {groupType.label}
                </GeliomButton>
              ))}
            </View>
          </View>

          {/* Üye Limiti Bilgisi */}
          <View style={styles.infoContainer}>
            <Typography variant="body" color={colors.secondaryText}>
              Maksimum Üye : <Typography variant="bodyLarge" color={colors.text} style={styles.infoValue}>{MEMBER_LIMIT} kişi</Typography>
            </Typography>
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <GeliomButton
              state={isSubmitting ? 'loading' : 'active'}
              layout="full-width"
              size="large"
              icon="checkmark-circle"
              onPress={handleCreateGroup}
              disabled={isSubmitting || !name.trim() || name.trim().length < 3}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Grup Oluştur'}
            </GeliomButton>
          </View>
        </View>
      </KeyboardAwareView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 24,
    paddingBottom: 100, // Klavye için ekstra padding
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    opacity: 0.8,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    marginTop: 4,
  },
  hintText: {
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoContainer: {
  },
  infoValue: {
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
});

