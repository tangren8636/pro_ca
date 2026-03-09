// 主题颜色和样式常量
import { StyleSheet } from 'react-native';

// 颜色系统
export const Colors = {
    // 主色调 - 医疗健康蓝绿
    primary: '#0D7C66',
    primaryLight: '#14B8A6',
    primaryDark: '#065F4E',
    primaryBg: '#E6FAF5',

    // 辅助色
    secondary: '#3B82F6',
    secondaryLight: '#93C5FD',

    // 预警色
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    dangerBg: '#FFF5F5',

    caution: '#F59E0B',
    cautionLight: '#FEF3C7',
    cautionBg: '#FFFBF0',

    success: '#10B981',
    successLight: '#D1FAE5',

    // 中性色
    background: '#F8FAFB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    textPrimary: '#1A1D21',
    textSecondary: '#5F6B7A',
    textTertiary: '#9BA5B1',
    textOnPrimary: '#FFFFFF',

    border: '#E8ECF0',
    borderLight: '#F1F4F8',
    divider: '#F0F2F5',

    // 图表色
    chartPSA: '#0D7C66',
    chartTestosterone: '#3B82F6',
    chartThreshold: '#EF4444',
    chartGrid: '#E8ECF0',

    // 模块图标色
    modulePSA: '#0D7C66',
    moduleTestosterone: '#3B82F6',
    moduleImaging: '#8B5CF6',
    moduleInjection: '#F59E0B',
    moduleReport: '#EC4899',
};

// 阴影
export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
};

// 圆角
export const Radius = {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
};

// 间距
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// 字体大小
export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    title: 32,
};

// 通用样式
export const CommonStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    cardElevated: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.medium,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    bodyText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.large,
    },
    inputContainer: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryBg,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.small,
    },
    primaryButtonText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: FontSize.lg,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyText: {
        fontSize: FontSize.md,
        color: Colors.textTertiary,
        marginTop: Spacing.md,
    },
});
