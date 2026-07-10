import { BaseLayout, Typography } from '@/components/shared';
import { ListItem } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';

export default function HelpSupportScreen() {
  const { colors } = useTheme();

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

          {/* İletişim Seçenekleri */}
          <View style={styles.cardContainer}>
            <ListItem
              icon="mail"
              title="E-posta"
              subtitle="support@geliom.app"
              onPress={handleEmailSupport}
            />
            <ListItem
              icon="logo-whatsapp"
              iconColor="#25D366"
              title="WhatsApp"
              subtitle="Hızlı destek"
              onPress={handleWhatsAppSupport}
            />
            <ListItem
              icon="help-circle"
              title="SSS"
              subtitle="Sık sorulan sorular"
              onPress={handleFAQ}
            />
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
    marginBottom: 32,
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

