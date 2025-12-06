import { BaseLayout, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HelpSupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@geliom.app?subject=Destek Talebi');
  };

  const handleWhatsAppSupport = () => {
    // WhatsApp destek numarası (örnek)
    Linking.openURL('https://wa.me/1234567890');
  };

  const handleFAQ = () => {
    Alert.alert('SSS', 'Sık Sorulan Sorular sayfası yakında eklenecek');
  };

  return (
    <BaseLayout
      headerShow={true}
      backgroundColor={colors.background}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Typography variant="h3" color={colors.text} style={styles.title}>
            Size Nasıl Yardımcı Olabiliriz?
          </Typography>

          <Typography variant="body" color={colors.secondaryText} style={styles.description}>
            Sorularınız veya sorunlarınız için bizimle iletişime geçebilirsiniz.
          </Typography>

          {/* İletişim Kartları */}
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
              onPress={handleEmailSupport}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="mail" size={24} color={colors.primary} />
              </View>
              <Typography variant="h5" color={colors.text} style={styles.cardTitle}>
                E-posta
              </Typography>
              <Typography variant="caption" color={colors.secondaryText} style={styles.cardDescription}>
                support@geliom.app
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
              onPress={handleWhatsAppSupport}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Typography variant="h5" color={colors.text} style={styles.cardTitle}>
                WhatsApp
              </Typography>
              <Typography variant="caption" color={colors.secondaryText} style={styles.cardDescription}>
                Hızlı destek
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
              onPress={handleFAQ}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.tertiary + '20' }]}>
                <Ionicons name="help-circle" size={24} color={colors.tertiary} />
              </View>
              <Typography variant="h5" color={colors.text} style={styles.cardTitle}>
                SSS
              </Typography>
              <Typography variant="caption" color={colors.secondaryText} style={styles.cardDescription}>
                Sık sorulan sorular
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Uygulama Bilgileri */}
          <View style={[styles.infoBox, { backgroundColor: colors.secondaryBackground, borderColor: colors.stroke }]}>
            <Typography variant="h6" color={colors.text} style={styles.infoTitle}>
              Uygulama Bilgileri
            </Typography>
            <View style={styles.infoRow}>
              <Typography variant="body" color={colors.secondaryText}>Sürüm:</Typography>
              <Typography variant="body" color={colors.text}>1.0.0</Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography variant="body" color={colors.secondaryText}>Platform:</Typography>
              <Typography variant="body" color={colors.text}>iOS / Android</Typography>
            </View>
          </View>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 32,
    lineHeight: 22,
  },
  cardContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardDescription: {
    textAlign: 'center',
  },
  infoBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});

