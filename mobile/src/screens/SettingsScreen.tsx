/**
 * SettingsScreen - User settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { colors, typography, spacing, borderRadius } from '../theme';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { settings, updateSubtitleSettings, updateVideoSettings, updateAppSettings } = useSettings();
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Subtitle Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subtitles</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Subtitles</Text>
            <Switch
              value={settings.subtitles.enabled}
              onValueChange={(value) => updateSubtitleSettings({ enabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setFontSizeModalVisible(true)}
          >
            <Text style={styles.settingLabel}>Font Size</Text>
            <Text style={styles.valueText}>{settings.subtitles.fontSize}px ›</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Color</Text>
            <View style={[styles.colorSwatch, { backgroundColor: settings.subtitles.color }]} />
          </View>
        </View>

        {/* Video Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video</Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setQualityModalVisible(true)}
          >
            <Text style={styles.settingLabel}>Quality</Text>
            <Text style={styles.valueText}>{settings.video.quality} ›</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Autoplay</Text>
            <Switch
              value={settings.video.autoplay}
              onValueChange={(value) => updateVideoSettings({ autoplay: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={settings.app.darkMode}
              onValueChange={(value) => updateAppSettings({ darkMode: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={settings.app.notifications}
              onValueChange={(value) => updateAppSettings({ notifications: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.valueText}>{settings.app.language.toUpperCase()} ›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Font Size Modal */}
      <Modal visible={fontSizeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Font Size</Text>
            {[12, 14, 16, 18, 20, 22, 24].map((size) => (
              <TouchableOpacity
                key={size}
                style={styles.modalOption}
                onPress={() => {
                  updateSubtitleSettings({ fontSize: size });
                  setFontSizeModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{size}px</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setFontSizeModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quality Modal */}
      <Modal visible={qualityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Video Quality</Text>
            {['auto', '360p', '480p', '720p', '1080p'].map((quality) => (
              <TouchableOpacity
                key={quality}
                style={styles.modalOption}
                onPress={() => {
                  updateVideoSettings({ quality: quality as any });
                  setQualityModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{quality}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setQualityModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={languageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Language</Text>
            {[
              { code: 'en', name: 'English' },
              { code: 'es', name: 'Spanish' },
              { code: 'fr', name: 'French' },
              { code: 'de', name: 'German' },
              { code: 'it', name: 'Italian' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.modalOption}
                onPress={() => {
                  updateAppSettings({ language: lang.code });
                  updateSubtitleSettings({ language: lang.code });
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setLanguageModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
  },
  valueText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.text,
  },
  modalCancel: {
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

