import { Brand } from './brand';

const tintColor = Brand.primary;

export default {
  light: {
    text: Brand.textPrimary,
    background: Brand.backgroundDark,
    tint: tintColor,
    tabIconDefault: Brand.textSecondary,
    tabIconSelected: Brand.accent,
  },
  dark: {
    text: Brand.textPrimary,
    background: Brand.backgroundDark,
    tint: tintColor,
    tabIconDefault: Brand.textSecondary,
    tabIconSelected: Brand.accent,
  },
};
