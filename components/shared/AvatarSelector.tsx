import { useTheme } from '@/contexts/ThemeContext';
import { getAvailableAvatars, getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import GeliomButton from './GeliomButton';
import Typography from './Typography';

interface AvatarSelectorProps {
  visible: boolean;
  currentAvatar: string | null | undefined;
  onSelect: (avatar: string | null) => void;
  onClose: () => void;
}

export default function AvatarSelector({ visible, currentAvatar, onSelect, onClose }: AvatarSelectorProps) {
  const { colors } = useTheme();
  const avatars = getAvailableAvatars();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);

  // Modal açıldığında currentAvatar'ı selectedAvatar'a set et
  useEffect(() => {
    if (visible) {
      setSelectedAvatar(currentAvatar || null);
    }
  }, [visible, currentAvatar]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable
          onPress={(e: GestureResponderEvent) => e.stopPropagation()}
          style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
        >
          <View style={styles.header}>
            <Typography variant="h5" color={colors.text}>
              Avatar Seç
            </Typography>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.avatarGrid}
            showsVerticalScrollIndicator={false}
          >
            {avatars.map((avatar) => {
              const isSelected = selectedAvatar === avatar;
              return (
                <Pressable
                  key={avatar}
                  onPress={() => setSelectedAvatar(avatar)}
                  style={[
                    styles.avatarItem,
               
                  ]}
                >
                  <Image
                    source={getAvatarSource(avatar)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Kaydet Butonu */}
          <View style={styles.footer}>
            <GeliomButton
              state="active"
              size="large"
              layout="full-width"
              onPress={() => {
                onSelect(selectedAvatar);
                onClose();
              }}
            >
              Kaydet
            </GeliomButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 16,
  },
  avatarItem: {
    width: '30%',
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
});

