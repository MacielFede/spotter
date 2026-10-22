package app.spotter.wear.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme

/**
 * Maps the generated semantic tokens (ADR 0018) onto the Wear M3 color scheme.
 * This adapter is hand-written per platform (ADR 0046); the colors themselves
 * always come from [SpotterColors].
 */
@Composable
fun SpotterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme(),
        content = content,
    )
}

private fun lightColorScheme(): ColorScheme = with(SpotterColors.Light) {
    colorScheme(
        background = background,
        surface = surface,
        textPrimary = textPrimary,
        textSecondary = textSecondary,
        primary = primary,
        onPrimary = onPrimary,
        danger = danger,
        onDanger = onDanger,
    )
}

private fun darkColorScheme(): ColorScheme = with(SpotterColors.Dark) {
    colorScheme(
        background = background,
        surface = surface,
        textPrimary = textPrimary,
        textSecondary = textSecondary,
        primary = primary,
        onPrimary = onPrimary,
        danger = danger,
        onDanger = onDanger,
    )
}

private fun colorScheme(
    background: androidx.compose.ui.graphics.Color,
    surface: androidx.compose.ui.graphics.Color,
    textPrimary: androidx.compose.ui.graphics.Color,
    textSecondary: androidx.compose.ui.graphics.Color,
    primary: androidx.compose.ui.graphics.Color,
    onPrimary: androidx.compose.ui.graphics.Color,
    danger: androidx.compose.ui.graphics.Color,
    onDanger: androidx.compose.ui.graphics.Color,
): ColorScheme =
    ColorScheme(
        primary = primary,
        primaryDim = primary,
        primaryContainer = surface,
        onPrimary = onPrimary,
        onPrimaryContainer = textPrimary,
        secondary = textSecondary,
        secondaryDim = textSecondary,
        secondaryContainer = surface,
        onSecondary = background,
        onSecondaryContainer = textPrimary,
        tertiary = primary,
        tertiaryDim = primary,
        tertiaryContainer = surface,
        onTertiary = onPrimary,
        onTertiaryContainer = textPrimary,
        surfaceContainerLow = surface,
        surfaceContainer = surface,
        surfaceContainerHigh = surface,
        onSurface = textPrimary,
        onSurfaceVariant = textSecondary,
        outline = textSecondary,
        outlineVariant = surface,
        background = background,
        onBackground = textPrimary,
        error = danger,
        errorDim = danger,
        errorContainer = surface,
        onError = onDanger,
        onErrorContainer = textPrimary,
    )
