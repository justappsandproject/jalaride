import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/tokens.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.elevated = false,
    this.onTap,
    this.color,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final bool elevated;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding ?? const EdgeInsets.all(Tokens.spaceMd),
      decoration: BoxDecoration(
        color: color ?? Tokens.bgSurface,
        borderRadius: BorderRadius.circular(Tokens.radiusCard),
        border: Border.all(color: Tokens.borderSubtle),
        boxShadow: elevated
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Tokens.radiusCard),
        child: card,
      ),
    );
  }
}

class StatChip extends StatelessWidget {
  const StatChip({super.key, required this.value, required this.label, this.accent});

  final String value;
  final String label;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Tokens.bgSurface2,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Tokens.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: accent ?? Tokens.gold500,
            ),
          ),
          Text(label, style: const TextStyle(fontSize: 11, color: Tokens.textSecondary)),
        ],
      ),
    );
  }
}

enum AppButtonVariant { primary, secondary, destructive }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.loading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool loading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    VoidCallback? handle = enabled
        ? () {
            HapticFeedback.lightImpact();
            onPressed!();
          }
        : null;

    final child = loading
        ? const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2, color: Tokens.textPrimary),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
              Text(label),
            ],
          );

    switch (variant) {
      case AppButtonVariant.primary:
        return SizedBox(
          height: Tokens.buttonHeight,
          width: double.infinity,
          child: ElevatedButton(onPressed: handle, child: child),
        );
      case AppButtonVariant.secondary:
        return SizedBox(
          height: Tokens.buttonHeight,
          width: double.infinity,
          child: OutlinedButton(onPressed: handle, child: child),
        );
      case AppButtonVariant.destructive:
        return SizedBox(
          height: Tokens.buttonHeight,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: handle,
            style: ElevatedButton.styleFrom(
              backgroundColor: Tokens.red500,
              foregroundColor: Tokens.textPrimary,
            ),
            child: child,
          ),
        );
    }
  }
}

class ToggleSwitchCard extends StatelessWidget {
  const ToggleSwitchCard({
    super.key,
    required this.online,
    required this.onChanged,
    this.titleOnline = 'You are online',
    this.titleOffline = 'You are offline',
    this.subtitle,
    this.trailing,
  });

  final bool online;
  final ValueChanged<bool> onChanged;
  final String titleOnline;
  final String titleOffline;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      elevated: true,
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: online ? Tokens.green500 : Tokens.red500,
              boxShadow: [
                BoxShadow(
                  color: (online ? Tokens.green500 : Tokens.red500).withValues(alpha: 0.5),
                  blurRadius: 8,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  online ? titleOnline : titleOffline,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                if (subtitle != null)
                  Text(subtitle!, style: const TextStyle(color: Tokens.textSecondary, fontSize: 13)),
              ],
            ),
          ),
          if (trailing != null) ...[trailing!, const SizedBox(width: 8)],
          Switch(
            value: online,
            activeThumbColor: Tokens.green500,
            onChanged: (v) {
              HapticFeedback.selectionClick();
              onChanged(v);
            },
          ),
        ],
      ),
    );
  }
}

class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    this.name,
    this.imageUrl,
    this.size = 56,
    this.verified = false,
  });

  final String? name;
  final String? imageUrl;
  final double size;
  final bool verified;

  @override
  Widget build(BuildContext context) {
    final initials = (name ?? 'JR')
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() : '')
        .join();

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CircleAvatar(
            radius: size / 2,
            backgroundColor: Tokens.bgSurface2,
            backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
            child: imageUrl == null
                ? Text(
                    initials.isEmpty ? 'JR' : initials,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: size * 0.32,
                      color: Tokens.gold100,
                    ),
                  )
                : null,
          ),
          if (verified)
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(color: Tokens.bgBase, shape: BoxShape.circle),
                child: const Icon(Icons.verified, color: Tokens.green500, size: 18),
              ),
            ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.headline,
    required this.subtext,
    this.cta,
  });

  final IconData icon;
  final String headline;
  final String subtext;
  final Widget? cta;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Tokens.spaceXl, horizontal: Tokens.spaceMd),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: Tokens.gold500)
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .fade(begin: 0.5, end: 1)
              .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.05, 1.05)),
          const SizedBox(height: Tokens.spaceMd),
          Text(
            headline,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: Tokens.spaceSm),
          Text(
            subtext,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Tokens.textSecondary, height: 1.4),
          ),
          if (cta != null) ...[const SizedBox(height: Tokens.spaceLg), cta!],
        ],
      ),
    );
  }
}

class RatingStars extends StatelessWidget {
  const RatingStars({super.key, required this.rating, this.size = 16});

  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = rating >= i + 1;
        final half = !filled && rating > i && rating < i + 1;
        return Icon(
          half ? Icons.star_half : (filled ? Icons.star : Icons.star_border),
          size: size,
          color: Tokens.gold500,
        );
      }),
    );
  }
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.height = 16, this.width, this.radius = 8});

  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: Tokens.bgSurface2,
        borderRadius: BorderRadius.circular(radius),
      ),
    )
        .animate(onPlay: (c) => c.repeat())
        .shimmer(duration: 1200.ms, color: Tokens.borderSubtle.withValues(alpha: 0.4));
  }
}

enum StatusTone { success, warning, danger, info, neutral }

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, this.tone = StatusTone.neutral});

  final String label;
  final StatusTone tone;

  Color get _fg {
    switch (tone) {
      case StatusTone.success:
        return Tokens.green500;
      case StatusTone.warning:
        return Tokens.gold500;
      case StatusTone.danger:
        return Tokens.red500;
      case StatusTone.info:
        return Tokens.blue500;
      case StatusTone.neutral:
        return Tokens.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _fg.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: _fg.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(color: _fg, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class SectionRow extends StatelessWidget {
  const SectionRow({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? Tokens.red500 : Tokens.textPrimary;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      minVerticalPadding: 12,
      leading: Icon(icon, color: color),
      title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      subtitle: subtitle != null ? Text(subtitle!, style: const TextStyle(color: Tokens.textSecondary)) : null,
      trailing: destructive ? null : const Icon(Icons.chevron_right, color: Tokens.textTertiary),
      onTap: onTap,
    );
  }
}
