import { useCreateJoinRequest, useGroupByInviteCode } from '@/api/groups';
import KeyboardAwareView from '@/components/KeyboardAwareView';
import { BaseLayout, GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGroupScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 56 + insets.top;

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Davet kodu ile grubu bul
  const { data: group, isLoading: isLoadingGroup, refetch: refetchGroup } = useGroupByInviteCode(
    inviteCode.trim().toUpperCase()
  );

  const createJoinRequest = useCreateJoinRequest();

  const handleJoinRequest = async () => {
    if (!inviteCode.trim()) {
      setCodeError('Davet kodu gerekli');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!group) {
      setCodeError('Geçersiz davet kodu');
      return;
    }

    try {
      setIsSubmitting(true);
      setCodeError(null);

      await createJoinRequest.mutateAsync({
        group_id: group.id,
        requester_id: user.id,
      });

      Alert.alert(
        'İstek Gönderildi',
        `${group.name} grubuna katılma isteğiniz gönderildi. Grup kurucusu onayladığında gruba katılacaksınız.`,
        [
          {
            text: 'Tamam',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      setCodeError(error.message || 'İstek gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (text: string) => {
    // Sadece büyük harf ve rakam kabul et
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(cleaned);
    setCodeError(null);
    
    // Eğer kod 8 karakter ise otomatik arama yap
    if (cleaned.length === 8) {
      refetchGroup();
    }
  };

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: <Typography variant="h5" color={colors.text}>Gruba Katıl</Typography>,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAwareView contentContainerStyle={styles.contentContainer} keyboardVerticalOffset={headerHeight}>
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Typography variant="h3" color={colors.text} style={{ marginTop: 24, marginBottom: 8 }}>
            Davet Kodu ile Katıl
          </Typography>
          <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center' }}>
            Grup kurucusundan aldığınız 8 haneli davet kodunu girin
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Typography variant="label" color={colors.text} style={{ marginBottom: 8 }}>
              Davet Kodu
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: codeError ? colors.error : group ? colors.success : colors.stroke,
                },
              ]}
              placeholder="ABC12345"
              placeholderTextColor={colors.secondaryText + '80'}
              value={inviteCode}
              onChangeText={handleCodeChange}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {codeError && (
              <Typography variant="caption" color={colors.error} style={{ marginTop: 4 }}>
                {codeError}
              </Typography>
            )}
            {group && !codeError && (
              <Typography variant="caption" color={colors.success} style={{ marginTop: 4 }}>
                ✓ {group.name} grubu bulundu
              </Typography>
            )}
          </View>

          {group && (
            <View style={[styles.groupInfo, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
              <View style={styles.groupInfoHeader}>
                <View style={[styles.groupIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons
                    name={group.type === 'family' ? 'home' : group.type === 'work' ? 'briefcase' : 'people'}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.groupInfoText}>
                  <Typography variant="h5" color={colors.text} numberOfLines={1}>
                    {group.name}
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    {group.type === 'family' ? 'Aile' : group.type === 'friends' ? 'Arkadaşlar' : group.type === 'work' ? 'İş' : 'Diğer'} • Kurucu: {group.owner?.display_name || 'Bilinmiyor'}
                  </Typography>
                </View>
              </View>
            </View>
          )}

          <GeliomButton
            state={isSubmitting ? 'loading' : group ? 'active' : 'disabled'}
            layout="full-width"
            size="large"
            icon="send"
            onPress={handleJoinRequest}
            disabled={!group || isSubmitting}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Katılma İsteği Gönder'}
          </GeliomButton>
        </View>
      </KeyboardAwareView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    fontFamily: 'Comfortaa-Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  groupInfo: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfoText: {
    flex: 1,
  },
});

