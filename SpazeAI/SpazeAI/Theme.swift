import SwiftUI

enum SpazeTheme {
    // Core palette
    static let void_ = Color(hex: "#0A0A0F")
    static let deepSpace = Color(hex: "#12121C")
    static let nebula = Color(hex: "#1A1A2E")
    static let cosmos = Color(hex: "#242442")
    static let starDust = Color(hex: "#2E2E52")

    // Primary - Electric Violet
    static let primary100 = Color(hex: "#F0E6FF")
    static let primary300 = Color(hex: "#B07AFF")
    static let primary400 = Color(hex: "#8B3DFF")
    static let primary500 = Color(hex: "#7C2FFF")
    static let primary600 = Color(hex: "#6A1FE8")
    static let primary700 = Color(hex: "#5518B8")

    // Secondary - Plasma Cyan
    static let secondary300 = Color(hex: "#5CE1FF")
    static let secondary400 = Color(hex: "#1CCFFF")
    static let secondary500 = Color(hex: "#00B8E6")

    // Accent - Supernova Magenta
    static let accent300 = Color(hex: "#FF66C2")
    static let accent400 = Color(hex: "#FF33AD")
    static let accent500 = Color(hex: "#E6008A")

    // Neutral
    static let neutral50 = Color(hex: "#FAFAFF")
    static let neutral100 = Color(hex: "#E8E8F0")
    static let neutral200 = Color(hex: "#C8C8D8")
    static let neutral300 = Color(hex: "#A0A0B8")
    static let neutral400 = Color(hex: "#787898")
    static let neutral500 = Color(hex: "#585878")
    static let neutral600 = Color(hex: "#3C3C58")
    static let neutral700 = Color(hex: "#282840")

    // Semantic
    static let success = Color(hex: "#00E68A")
    static let warning = Color(hex: "#FFB829")
    static let error = Color(hex: "#FF4D6A")

    // Gradients
    static let gradientPrimary = LinearGradient(
        colors: [primary500, secondary400],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let gradientAccent = LinearGradient(
        colors: [accent400, primary500],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let gradientNebula = LinearGradient(
        colors: [void_, nebula, cosmos],
        startPoint: .top,
        endPoint: .bottom
    )

    static let gradientAurora = LinearGradient(
        colors: [success, secondary400, primary500],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
