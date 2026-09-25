import { GROUP_NAME_RULES } from '@/constants/premium';
import React from 'react';
import TextInputSheet from './TextInputSheet';

interface GroupNameBottomSheetProps {
  currentName: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

/** Grup adı düzenleme — ortak TextInputSheet'in ince sarmalayıcısı. */
export default function GroupNameBottomSheet({
  currentName,
  onSave,
  onCancel,
}: GroupNameBottomSheetProps) {
  return (
    <TextInputSheet
      title="Grup Adını Değiştir"
      initialValue={currentName}
      placeholder="Grup adı"
      maxLength={GROUP_NAME_RULES.MAX_LENGTH}
      validate={(value) =>
        value.length < GROUP_NAME_RULES.MIN_LENGTH
          ? `En az ${GROUP_NAME_RULES.MIN_LENGTH} karakter olmalı`
          : value.length > GROUP_NAME_RULES.MAX_LENGTH
            ? `En fazla ${GROUP_NAME_RULES.MAX_LENGTH} karakter olabilir`
            : null
      }
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
