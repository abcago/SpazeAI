import SwiftUI

struct ShopView: View {
    @ObservedObject var coinManager: CoinManager
    @State private var purchasedPack: CoinPackage?
    @State private var showPurchaseSuccess = false

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        // Current balance
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(
                                        RadialGradient(
                                            colors: [.yellow.opacity(0.3), .clear],
                                            center: .center,
                                            startRadius: 0,
                                            endRadius: 60
                                        )
                                    )
                                    .frame(width: 120, height: 120)

                                VStack(spacing: 4) {
                                    Image(systemName: "circle.fill")
                                        .font(.title)
                                        .foregroundStyle(.yellow)

                                    Text("\(coinManager.coins)")
                                        .font(.system(size: 36, weight: .bold, design: .rounded).monospacedDigit())
                                        .foregroundStyle(SpazeTheme.neutral50)

                                    Text("Coin Bakiye")
                                        .font(.caption)
                                        .foregroundStyle(SpazeTheme.neutral400)
                                }
                            }
                        }
                        .padding(.top)

                        // Packages
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Coin Paketleri")
                                .font(.caption.bold())
                                .foregroundStyle(SpazeTheme.neutral300)
                                .textCase(.uppercase)
                                .tracking(0.5)
                                .padding(.horizontal, 4)

                            ForEach(CoinPackage.packages) { pack in
                                CoinPackageCard(pack: pack) {
                                    // Simulate purchase for now
                                    coinManager.addCoins(pack.coins)
                                    purchasedPack = pack
                                    showPurchaseSuccess = true
                                }
                            }
                        }

                        // Info
                        VStack(spacing: 8) {
                            Text("Coins fuel your creativity")
                                .font(.caption.bold())
                                .foregroundStyle(SpazeTheme.neutral400)

                            Text("Most generations cost 2–4 coins.\nNo subscription needed — pay only for what you use.")
                                .font(.caption)
                                .foregroundStyle(SpazeTheme.neutral600)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.top, 8)
                        .padding(.horizontal, 12)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Image(systemName: "storefront")
                            .foregroundStyle(SpazeTheme.gradientPrimary)
                        Text("Shop")
                            .font(.headline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)
                    }
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("You're all set! 🎉", isPresented: $showPurchaseSuccess) {
                Button("Start Creating") {}
            } message: {
                if let pack = purchasedPack {
                    Text("\(pack.coins) coins added to your account. New balance: \(coinManager.coins) coins. Time to make some magic!")
                }
            }
        }
    }
}

struct CoinPackageCard: View {
    let pack: CoinPackage
    let onPurchase: () -> Void

    var body: some View {
        Button(action: onPurchase) {
            HStack(spacing: 16) {
                // Coin icon
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: pack.gradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)

                    VStack(spacing: 1) {
                        Image(systemName: "circle.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                        Text("\(pack.coins)")
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                    }
                }

                // Info
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text("\(pack.coins) Coins")
                            .font(.subheadline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)

                        if let badge = pack.badge {
                            Text(badge)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(
                                    Capsule().fill(
                                        LinearGradient(
                                            colors: pack.gradient,
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                )
                        }
                    }

                    Text("Create \(pack.coins / 2)+ images")
                        .font(.caption)
                        .foregroundStyle(SpazeTheme.neutral500)
                }

                Spacer()

                // Price
                Text(pack.price)
                    .font(.subheadline.bold())
                    .foregroundStyle(SpazeTheme.primary300)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(SpazeTheme.deepSpace)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(SpazeTheme.starDust.opacity(0.4), lineWidth: 1)
                    )
            )
        }
    }
}
