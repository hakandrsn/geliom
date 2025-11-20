import { apiUtils } from "@/api";
import { useCreateGroup, useJoinGroup } from "@/api/groups";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupContext } from "@/contexts/GroupContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { GroupWithOwner } from "@/types/database";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GROUP_TYPES = [
  { value: 'family', label: 'Aile', icon: 'home', desc: 'Ev halkı için' },
  { value: 'friends', label: 'Arkadaşlar', icon: 'people', desc: 'En yakınlar için' },
  { value: 'work', label: 'İş', icon: 'briefcase', desc: 'Ekip için' },
  { value: 'other', label: 'Diğer', icon: 'shapes', desc: 'Özel gruplar' },
];

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const { setSelectedGroup } = useGroupContext();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Hook'ları component'in en üst seviyesinde tanımla
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();
  
  const headerHeight = 56 + insets.top;

  const [name, setName] = useState('');
  const [type, setType] = useState('family');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  
  const MEMBER_LIMIT = 5;

  const handleCreateGroup = async () => {
    if (!name.trim() || name.trim().length < 3) {
      setNameError('En az 3 karakter gerekli');
      return;
    }
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      const inviteCode = apiUtils.generateInviteCode();
      const group = await createGroupMutation.mutateAsync({
        owner_id: user.id,
        type,
        name: name.trim(),
        invite_code: inviteCode,
        member_limit: MEMBER_LIMIT,
      });
      await joinGroupMutation.mutateAsync({ group_id: group.id, user_id: user.id });
      
      const groupWithOwner: GroupWithOwner = { ...group, owner: user };
      await setSelectedGroup(groupWithOwner);
      router.replace('/(drawer)/home');
    } catch (error: any) {
      console.error('Grup oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Grup oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: { icon: <Ionicons name="arrow-back" size={24} color={colors.text} />, onPress: () => router.back() },
        title: <Typography variant="h5" color={colors.text}>Yeni Birlik Kur</Typography>,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAwareView contentContainerStyle={styles.contentContainer} keyboardVerticalOffset={headerHeight}>
        <View style={styles.headerSection}>
          <Typography variant="h3" color={colors.primary} style={{ marginBottom: 8 }}>
            {name ? name : 'İsimsiz Grup'}
          </Typography>
          <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center' }}>
            Sevdiklerinle anlık durumlarını paylaşmak için özel bir alan.
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Typography variant="label" color={colors.text} style={{ marginBottom: 8 }}>Grup İsmi</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: nameError ? colors.error : colors.stroke }]}
              placeholder="Örn: Canım Ailem"
              placeholderTextColor={colors.secondaryText + '80'}
              value={name}
              onChangeText={(t) => { setName(t); setNameError(null); }}
              maxLength={30}
            />
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="label" color={colors.text} style={{ marginBottom: 12 }}>Grup Tipi</Typography>
            <View style={styles.typeGrid}>
              {GROUP_TYPES.map((groupType) => {
                const isSelected = type === groupType.value;
                return (
                  <TouchableOpacity
                    key={groupType.value}
                    style={[styles.typeCard, { backgroundColor: isSelected ? colors.primary + '10' : colors.cardBackground, borderColor: isSelected ? colors.primary : colors.stroke }]}
                    onPress={() => setType(groupType.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: isSelected ? colors.primary : colors.tertiary }]}>
                      <Ionicons name={groupType.icon as any} size={20} color={isSelected ? colors.white : colors.primary} />
                    </View>
                    <Typography variant="body" fontWeight="semibold" color={colors.text} style={{ marginTop: 8 }}>{groupType.label}</Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <GeliomButton
            state={isSubmitting ? 'loading' : 'active'}
            layout="full-width"
            size="large"
            icon="checkmark-circle"
            onPress={handleCreateGroup}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'Grubu Oluştur'}
          </GeliomButton>
        </View>
      </KeyboardAwareView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: { padding: 24, paddingBottom: 100 },
  headerSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  form: { gap: 28 },
  inputGroup: { gap: 4 },
  input: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, fontFamily: 'Comfortaa-Medium' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: { width: '48%', padding: 12, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});