/**
 * Filters Component - Filter videos by various criteria
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { VideoFilters } from '../data/mockData';

interface FiltersProps {
  filters: VideoFilters;
  onApply: (filters: VideoFilters) => void;
  onReset: () => void;
}

export const Filters: React.FC<FiltersProps> = ({ filters, onApply, onReset }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<VideoFilters>(filters);

  const handleApply = () => {
    onApply(tempFilters);
    setModalVisible(false);
  };

  const handleReset = () => {
    onReset();
    setTempFilters({});
    setModalVisible(false);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof VideoFilters]
  ).length;

  const languages = ['All', 'EN', 'ES', 'FR', 'DE', 'IT'];
  const durationRanges = [
    { label: 'All', value: undefined },
    { label: 'Under 30 min', value: 1800 },
    { label: '30-60 min', value: 3600 },
    { label: '1-2 hours', value: 7200 },
    { label: 'Over 2 hours', value: undefined },
  ];
  const ratingOptions = [4.5, 4.0, 3.5, 3.0, 2.5];

  return (
    <View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterIcon}>⚙️</Text>
        <Text style={styles.filterText}>Filters</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Language Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Language</Text>
                <View style={styles.optionsRow}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.optionChip,
                        tempFilters.language === lang && styles.optionChipActive,
                        lang === 'All' && !tempFilters.language && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, language: lang === 'All' ? undefined : lang })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.language === lang && styles.optionTextActive,
                          lang === 'All' && !tempFilters.language && styles.optionTextActive,
                        ]}
                      >
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Duration</Text>
                <View style={styles.optionsColumn}>
                  {durationRanges.map((range, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.optionButton,
                        tempFilters.max_duration === range.value && styles.optionButtonActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, max_duration: range.value })
                      }
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          tempFilters.max_duration === range.value && styles.optionLabelActive,
                        ]}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minimum Rating</Text>
                <View style={styles.optionsRow}>
                  {ratingOptions.map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.optionChip,
                        tempFilters.min_rating === rating && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, min_rating: rating })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.min_rating === rating && styles.optionTextActive,
                        ]}
                      >
                        {rating.toFixed(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Artist Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Artist</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search artist..."
                  placeholderTextColor={colors.textTertiary}
                  value={tempFilters.artist}
                  onChangeText={(text) => setTempFilters({ ...tempFilters, artist: text || undefined })}
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  filterText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalBody: {
    maxHeight: 500,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionsColumn: {
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.text,
  },
  optionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  textInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

