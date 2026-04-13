import SwiftUI

/// Payload for navigating from HomeView to CategoryDetailView.
struct CategoryDetailPayload: Identifiable {
    let id = UUID()
    let category: GenerationType.CategoryInfo
    let types: [GenerationType]
}

/// Full-screen detail view that lists all generation types in a single
/// category. Uses a different visual approach than HomeView:
///   • Featured hero card at the top (the first type, full-width, large)
///   • Vertical scrolling list of magazine-style cards beneath
///   • Cinematic dark gradient background
///   • Big readable typography, before/after preview where available
///
/// Tap any card to open the generation flow for that type.
struct CategoryDetailView: View {
    let category: GenerationType.CategoryInfo
    let types: [GenerationType]
    @ObservedObject var coinManager: CoinManager
    @Environment(\.dismiss) private var dismiss
    @State private var selectedType: GenerationType?

    var body: some View {
        NavigationStack {
            ZStack {
                // Cinematic background
                ZStack {
                    SpazeTheme.void_.ignoresSafeArea()
                    LinearGradient(
                        colors: [
                            categoryAccent.opacity(0.25),
                            SpazeTheme.void_,
                            SpazeTheme.deepSpace
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .ignoresSafeArea()
                }

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        // ── Header
                        header
                            .padding(.horizontal, 20)
                            .padding(.top, 8)

                        // ── Featured hero card (first type)
                        if let featured = types.first {
                            FeaturedHeroCard(type: featured) {
                                selectedType = featured
                            }
                            .padding(.horizontal, 16)
                        }

                        // ── Section divider
                        if types.count > 1 {
                            HStack(spacing: 10) {
                                Rectangle()
                                    .fill(SpazeTheme.neutral700)
                                    .frame(height: 1)
                                Text("ALL \(types.count)")
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundStyle(SpazeTheme.neutral500)
                                    .tracking(2)
                                Rectangle()
                                    .fill(SpazeTheme.neutral700)
                                    .frame(height: 1)
                            }
                            .padding(.horizontal, 20)
                            .padding(.top, 8)
                        }

                        // ── Magazine-style list (rest of the items)
                        VStack(spacing: 14) {
                            ForEach(Array(types.dropFirst().enumerated()), id: \.element.id) { index, type in
                                MagazineCard(
                                    type: type,
                                    index: index + 2,
                                    total: types.count
                                ) {
                                    selectedType = type
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(SpazeTheme.neutral400)
                    }
                }
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: category.icon)
                            .foregroundStyle(categoryAccent)
                        Text(category.title)
                            .font(.headline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    CoinBarView(coinManager: coinManager) {}
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .fullScreenCover(item: $selectedType) { type in
                GenerationView(type: type, coinManager: coinManager)
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(categoryAccent.opacity(0.2))
                        .frame(width: 52, height: 52)
                    Image(systemName: category.icon)
                        .font(.title2)
                        .foregroundStyle(categoryAccent)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(category.title.uppercased())
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(SpazeTheme.neutral500)
                        .tracking(1.5)
                    Text("\(types.count) styles")
                        .font(.title2.bold())
                        .foregroundStyle(SpazeTheme.neutral50)
                }
                Spacer()
            }
        }
    }

    // MARK: - Helpers

    private var categoryAccent: Color {
        // Pull a representative gradient colour from the first type
        types.first?.gradient.first ?? SpazeTheme.primary400
    }
}

// MARK: - Featured Hero Card

private struct FeaturedHeroCard: View {
    let type: GenerationType
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottomLeading) {
                // Image background
                GeometryReader { geo in
                    ZStack {
                        LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                        if let url = type.previewAfterUrl, let imageUrl = URL(string: url) {
                            AsyncImage(url: imageUrl) { image in
                                image.resizable().aspectRatio(contentMode: .fill)
                                    .frame(width: geo.size.width, height: geo.size.height)
                            } placeholder: {
                                Text(type.icon).font(.system(size: 64)).opacity(0.6)
                            }
                        } else {
                            Text(type.icon).font(.system(size: 64)).opacity(0.6)
                        }
                    }
                    .clipped()
                }
                .frame(height: 320)

                // Featured ribbon
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 9))
                            Text("FEATURED")
                                .font(.system(size: 9, weight: .heavy))
                                .tracking(1)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(
                            LinearGradient(colors: type.gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Capsule())

                        Spacer()
                    }
                    .padding(14)

                    Spacer()
                }
                .frame(height: 320)

                // Bottom info
                VStack(alignment: .leading, spacing: 8) {
                    Text(type.name)
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    Text(type.description)
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.8))
                        .lineLimit(2)

                    HStack(spacing: 10) {
                        // Coin badge
                        HStack(spacing: 4) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 8))
                                .foregroundStyle(.yellow)
                            Text("\(type.coinCost) coins")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(.black.opacity(0.5))
                        .clipShape(Capsule())

                        // Time badge
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 8))
                            Text("~\(type.estimatedSeconds)s")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(.black.opacity(0.5))
                        .clipShape(Capsule())

                        Spacer()

                        // Try button
                        HStack(spacing: 4) {
                            Text("Try")
                                .font(.system(size: 12, weight: .bold))
                            Image(systemName: "arrow.right")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            LinearGradient(colors: type.gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Capsule())
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.85), .black.opacity(0.95)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(.white.opacity(0.12), lineWidth: 1)
            )
            .shadow(color: type.gradient.first?.opacity(0.4) ?? .clear, radius: 20, y: 10)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Magazine-style horizontal card

private struct MagazineCard: View {
    let type: GenerationType
    let index: Int
    let total: Int
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Square image on the left
                ZStack {
                    LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    if let url = type.previewAfterUrl, let imageUrl = URL(string: url) {
                        AsyncImage(url: imageUrl) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Text(type.icon).font(.system(size: 32)).opacity(0.6)
                        }
                    } else {
                        Text(type.icon).font(.system(size: 32)).opacity(0.6)
                    }
                }
                .frame(width: 120, height: 120)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(.white.opacity(0.08), lineWidth: 1)
                )

                // Right: text + meta
                VStack(alignment: .leading, spacing: 6) {
                    // Index marker
                    Text("#\(index) / \(total)")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(SpazeTheme.neutral500)
                        .tracking(1)

                    // Title
                    Text(type.name)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(SpazeTheme.neutral50)
                        .lineLimit(1)

                    // Description
                    Text(type.description)
                        .font(.system(size: 12))
                        .foregroundStyle(SpazeTheme.neutral400)
                        .lineLimit(2)

                    Spacer()

                    // Bottom meta row
                    HStack(spacing: 8) {
                        HStack(spacing: 3) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 7))
                                .foregroundStyle(.yellow)
                            Text("\(type.coinCost)")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(.yellow)
                        }

                        HStack(spacing: 3) {
                            Image(systemName: "clock")
                                .font(.system(size: 9))
                            Text("~\(type.estimatedSeconds)s")
                                .font(.system(size: 10, weight: .medium))
                        }
                        .foregroundStyle(SpazeTheme.neutral500)

                        Spacer()

                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(
                                LinearGradient(colors: type.gradient, startPoint: .leading, endPoint: .trailing)
                            )
                    }
                }
                .padding(.vertical, 4)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(SpazeTheme.deepSpace.opacity(0.7))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(
                        LinearGradient(
                            colors: type.gradient.map { $0.opacity(0.25) },
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}
