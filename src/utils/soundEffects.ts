import { playSound, SoundType as ModernSoundType } from './soundEngine';

export type SoundType =
  | 'complete'
  | 'rankup'
  | 'coin'
  | 'timer'
  | 'click'
  | 'warning'
  | 'unseal'
  | 'stamp'
  | 'potion'
  | 'trash'
  | ModernSoundType;

/**
 * Backward compatibility wrapper for legacy sound calls
 */
export function playSoundEffect(type: SoundType, enabled = true) {
  if (!enabled || typeof window === 'undefined') return;

  // Map legacy names to new Dark Fantasy procedural sounds
  let targetType: ModernSoundType = 'ui_click';

  switch (type) {
    case 'complete':
      targetType = 'quest_medium';
      break;
    case 'rankup':
      targetType = 'rank_up';
      break;
    case 'coin':
      targetType = 'coin_purchase';
      break;
    case 'timer':
      targetType = 'quest_easy';
      break;
    case 'click':
      targetType = 'ui_click';
      break;
    case 'warning':
    case 'trash':
      targetType = 'error_block';
      break;
    case 'unseal':
      targetType = 'scroll_open';
      break;
    case 'stamp':
      targetType = 'quest_create';
      break;
    case 'potion':
      targetType = 'item_use';
      break;
    default:
      targetType = type as ModernSoundType;
      break;
  }

  playSound(targetType, enabled);
}
