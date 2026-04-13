import SwiftUI

struct CoinBarView: View {
    @ObservedObject var coinManager: CoinManager
    var onShopTap: () -> Void

    var body: some View {
        Button(action: onShopTap) {
            HStack(spacing: 6) {
                Image(systemName: "circle.fill")
                    .font(.caption)
                    .foregroundStyle(.yellow)

                Text("\(coinManager.coins)")
                    .font(.subheadline.bold().monospacedDigit())
                    .foregroundStyle(SpazeTheme.neutral50)

                Image(systemName: "plus.circle.fill")
                    .font(.caption)
                    .foregroundStyle(SpazeTheme.primary400)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(SpazeTheme.cosmos)
                    .overlay(
                        Capsule()
                            .stroke(SpazeTheme.starDust, lineWidth: 1)
                    )
            )
        }
    }
}
