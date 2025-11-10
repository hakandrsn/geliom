import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import React from 'react';
import { ScrollView, View } from "react-native";

export default function ShowroomScreen() {
  const { colors } = useTheme();

  return (
    <BaseLayout
      headerShow={false} // Drawer navigation kendi header'ını kullanacak
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Typography 
          variant="h2" 
          color={colors.text}
          style={{ marginBottom: 6, textAlign: 'center' }}
        >
          🌿 GeliomButton Showroom
        </Typography>
        
        <Typography 
          variant="body" 
          color={colors.secondaryText}
          style={{ marginBottom: 24, textAlign: 'center' }}
        >
          Forest-Sage-Pine temalı ana button sistemi
        </Typography>

        {/* GeliomButton - Ana Button Sistemi */}
        <View style={{ marginBottom: 32 }}>
          <Typography
            variant="h3"
            color={colors.primary}
            style={{ marginBottom: 16 }}
          >
            🌿 GeliomButton - Ana Button Sistemi
          </Typography>
          <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 20 }}>
            Forest (Active), Sage (Passive), Pine (Loading) - Adaçayı tarzı organik tasarım
          </Typography>

          {/* Button States */}
          <View style={{ gap: 16 }}>
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Button Durumları:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <GeliomButton state="active" onPress={() => console.log('Active pressed')}>
                  🌲 Active (Forest)
                </GeliomButton>
                <GeliomButton state="passive" onPress={() => console.log('Passive pressed')}>
                  🌾 Passive (Sage)
                </GeliomButton>
                <GeliomButton state="loading" onPress={() => console.log('Loading pressed')}>
                  🌲 Loading (Pine)
                </GeliomButton>
              </View>
            </View>

            {/* Button Sizes */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Boyutlar (Adaçayı Tarzı Organik):
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <GeliomButton state="active" size="small">
                  Small
                </GeliomButton>
                <GeliomButton state="active" size="medium">
                  Medium
                </GeliomButton>
                <GeliomButton state="active" size="large">
                  Large
                </GeliomButton>
                <GeliomButton state="active" size="xl">
                  XL
                </GeliomButton>
              </View>
            </View>

            {/* Icon Layouts */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Icon Layout'ları:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  layout="icon-left" 
                  icon="leaf"
                  onPress={() => console.log('Icon left')}
                >
                  Sol Icon
                </GeliomButton>
                <GeliomButton 
                  state="passive" 
                  layout="icon-right" 
                  icon="flower"
                  onPress={() => console.log('Icon right')}
                >
                  Sağ Icon
                </GeliomButton>
                <GeliomButton 
                  state="active" 
                  layout="icon-only" 
                  icon="heart"
                  onPress={() => console.log('Icon only')}
                />
              </View>
            </View>

            {/* Size + Layout Combinations */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Boyut + Layout Kombinasyonları:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  size="small"
                  layout="icon-left" 
                  icon="leaf"
                >
                  🌿 Küçük
                </GeliomButton>
                <GeliomButton 
                  state="passive" 
                  size="large"
                  layout="icon-right" 
                  icon="flower"
                >
                  🌸 Büyük
                </GeliomButton>
                <GeliomButton 
                  state="active" 
                  size="xl"
                  layout="icon-left" 
                  icon="leaf"
                >
                  🌳 Extra Large
                </GeliomButton>
              </View>
            </View>

            {/* Icon Only Different Sizes */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Icon-Only Farklı Boyutlar:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  size="small"
                  layout="icon-only" 
                  icon="heart"
                />
                <GeliomButton 
                  state="passive" 
                  size="medium"
                  layout="icon-only" 
                  icon="star"
                />
                <GeliomButton 
                  state="active" 
                  size="large"
                  layout="icon-only" 
                  icon="diamond"
                />
                <GeliomButton 
                  state="loading" 
                  size="xl"
                  layout="icon-only" 
                  icon="flash"
                />
              </View>
            </View>

            {/* Full Width Examples */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Full Width Örnekleri:
              </Typography>
              <View style={{ gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  layout="full-width"
                  icon="checkmark-circle"
                  onPress={() => console.log('Full width active')}
                >
                  🌲 Tam Genişlik Active Button
                </GeliomButton>
                <GeliomButton 
                  state="passive" 
                  layout="full-width"
                  size="large"
                  icon="information-circle"
                  onPress={() => console.log('Full width passive')}
                >
                  🌾 Büyük Passive Button
                </GeliomButton>
              </View>
            </View>

            {/* Mixed State Examples */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Karışık Durum Örnekleri:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  size="small"
                  layout="icon-left" 
                  icon="leaf"
                >
                  🌿 Aktif
                </GeliomButton>
                <GeliomButton 
                  state="passive" 
                  size="medium"
                  layout="icon-right" 
                  icon="pause"
                >
                  ⏸️ Pasif
                </GeliomButton>
                <GeliomButton 
                  state="loading" 
                  size="large"
                  layout="icon-left" 
                  icon="refresh"
                >
                  🔄 Yükleniyor
                </GeliomButton>
              </View>
            </View>

            {/* Disabled Examples */}
            <View>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                Disabled Durumları:
              </Typography>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <GeliomButton 
                  state="active" 
                  disabled
                  icon="ban"
                >
                  Disabled Active
                </GeliomButton>
                <GeliomButton 
                  state="passive" 
                  disabled
                  layout="icon-right"
                  icon="close"
                >
                  Disabled Passive
                </GeliomButton>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Typography 
            variant="h3" 
            color={colors.text}
            style={{ marginBottom: 16 }}
          >
            Diğer Component'ler
          </Typography>
          
          <View style={{
            backgroundColor: colors.disabled,
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <Typography variant="body" color={colors.secondaryText}>
              Daha fazla component yakında...
            </Typography>
          </View>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}
