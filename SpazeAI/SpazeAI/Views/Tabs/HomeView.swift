import SwiftUI

struct HomeView: View {
    @ObservedObject var coinManager: CoinManager
    @StateObject private var typeManager = GenerationTypeManager.shared
    @State private var selectedType: GenerationType?
    @State private var selectedCategory: CategoryDetailPayload?
    @Binding var shopTab: Bool

    /// How many items to show per category before the "See more" CTA.
    private let itemsPerCategoryPreview = 4

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {

                        if typeManager.isLoading && typeManager.types.isEmpty {
                            ProgressView()
                                .tint(.white)
                                .padding(.top, 80)
                        } else if typeManager.types.isEmpty {
                            emptyState
                        } else {
                            // ── Trending Stories ─────────────────
                            if !typeManager.trending.isEmpty {
                                trendingSection
                            }

                            // ── Category Sections ────────────────
                            ForEach(typeManager.grouped, id: \.category.id) { group in
                                categorySection(group.category, types: group.types)
                            }
                        }
                    }
                    .padding(.bottom, 30)
                }
                .refreshable {
                    await typeManager.loadTypes()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .foregroundStyle(SpazeTheme.gradientPrimary)
                        Text("SpazeAI")
                            .font(.headline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    CoinBarView(coinManager: coinManager) {
                        shopTab = true
                    }
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .fullScreenCover(item: $selectedType) { type in
                GenerationView(type: type, coinManager: coinManager)
            }
            .fullScreenCover(item: $selectedCategory) { payload in
                CategoryDetailView(
                    category: payload.category,
                    types: payload.types,
                    coinManager: coinManager
                )
            }
            .task {
                if typeManager.types.isEmpty {
                    await typeManager.loadTypes()
                }
            }
        }
    }

    // MARK: - Trending Stories (Instagram-like ring)

    private var trendingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .foregroundStyle(.orange)
                Text("Trending")
                    .font(.title3.bold())
                    .foregroundStyle(SpazeTheme.neutral50)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(typeManager.trending) { type in
                        Button { selectedType = type } label: {
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .stroke(
                                            LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing),
                                            lineWidth: 3
                                        )
                                        .frame(width: 72, height: 72)

                                    TypePreviewCircle(type: type, size: 64)
                                }

                                Text(type.name)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(SpazeTheme.neutral300)
                                    .lineLimit(1)
                                    .frame(width: 72)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }

            Rectangle()
                .fill(SpazeTheme.neutral700.opacity(0.5))
                .frame(height: 0.5)
                .padding(.top, 8)
        }
    }

    // MARK: - Category Section

    @ViewBuilder
    private func categorySection(_ cat: GenerationType.CategoryInfo, types: [GenerationType]) -> some View {
        if cat.id == "trending" {
            // Already shown as stories row — skip entirely
            EmptyView()
        } else {
            let preview = Array(types.prefix(itemsPerCategoryPreview))
            let hasMore = types.count > itemsPerCategoryPreview

            VStack(alignment: .leading, spacing: 14) {
                // Header
                Button {
                    selectedCategory = CategoryDetailPayload(category: cat, types: types)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: cat.icon)
                            .font(.subheadline.bold())
                            .foregroundStyle(SpazeTheme.primary400)
                        Text(cat.title)
                            .font(.headline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)
                        Spacer()
                        Text("\(types.count)")
                            .font(.caption2.bold())
                            .foregroundStyle(SpazeTheme.neutral500)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(SpazeTheme.neutral700.opacity(0.5))
                            .clipShape(Capsule())
                    }
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.top, 24)

                if cat.id == "video" {
                    videoCarousel(preview)
                } else {
                    photoGrid(preview)
                }

                // See more button
                if hasMore {
                    Button {
                        selectedCategory = CategoryDetailPayload(category: cat, types: types)
                    } label: {
                        HStack(spacing: 6) {
                            Text("See all \(types.count)")
                                .font(.subheadline.bold())
                            Image(systemName: "arrow.right")
                                .font(.caption.bold())
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 11)
                        .frame(maxWidth: .infinity)
                        .background(
                            LinearGradient(
                                colors: [
                                    SpazeTheme.nebula,
                                    SpazeTheme.cosmos
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            SpazeTheme.primary400.opacity(0.4),
                                            SpazeTheme.secondary400.opacity(0.4)
                                        ],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ),
                                    lineWidth: 1
                                )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                }
            }
        }
    }

    // MARK: - Photo Grid (staggered 2-col visual cards)

    private func photoGrid(_ types: [GenerationType]) -> some View {
        let left = types.enumerated().filter { $0.offset % 2 == 0 }.map(\.element)
        let right = types.enumerated().filter { $0.offset % 2 != 0 }.map(\.element)

        return HStack(alignment: .top, spacing: 10) {
            VStack(spacing: 10) {
                ForEach(Array(left.enumerated()), id: \.element.id) { idx, type in
                    PhotoCard(type: type, height: idx == 0 ? 200 : 160) {
                        selectedType = type
                    }
                }
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: 10) {
                ForEach(Array(right.enumerated()), id: \.element.id) { idx, type in
                    PhotoCard(type: type, height: idx == 0 ? 160 : 200) {
                        selectedType = type
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 16)
    }

    // MARK: - Video Carousel

    private func videoCarousel(_ types: [GenerationType]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(types) { type in
                    VideoCard(type: type) {
                        selectedType = type
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.slash")
                .font(.largeTitle)
                .foregroundStyle(SpazeTheme.neutral500)
            Text("Couldn't load styles")
                .font(.headline)
                .foregroundStyle(SpazeTheme.neutral200)
            Text("Check your connection and try again")
                .font(.caption)
                .foregroundStyle(SpazeTheme.neutral500)
            Button("Try Again") {
                Task { await typeManager.loadTypes() }
            }
            .foregroundStyle(SpazeTheme.primary400)
            .padding(.top, 4)
        }
        .padding(.top, 80)
    }
}

// MARK: - Type Preview Circle (reusable)

struct TypePreviewCircle: View {
    let type: GenerationType
    let size: CGFloat

    var body: some View {
        if let url = type.previewAfterUrl, let imageUrl = URL(string: url) {
            AsyncImage(url: imageUrl) { image in
                image.resizable().aspectRatio(contentMode: .fill)
            } placeholder: {
                gradientIcon
            }
            .frame(width: size, height: size)
            .clipShape(Circle())
        } else if let example = type.examples.first, let img = UIImage(named: example.after) {
            Image(uiImage: img)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size, height: size)
                .clipShape(Circle())
        } else {
            gradientIcon
        }
    }

    private var gradientIcon: some View {
        Circle()
            .fill(LinearGradient(colors: type.gradient.map { $0.opacity(0.4) }, startPoint: .topLeading, endPoint: .bottomTrailing))
            .frame(width: size, height: size)
            .overlay(Text(type.icon).font(.system(size: size * 0.4)))
    }
}

// MARK: - Photo Card (tall, image-first with glass overlay)

struct PhotoCard: View {
    let type: GenerationType
    let height: CGFloat
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottom) {
                // Background
                GeometryReader { geo in
                    ZStack {
                        LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)

                        if let url = type.previewAfterUrl, let imageUrl = URL(string: url) {
                            AsyncImage(url: imageUrl) { image in
                                image.resizable().aspectRatio(contentMode: .fill)
                                    .frame(width: geo.size.width, height: geo.size.height)
                            } placeholder: {
                                EmptyView()
                            }
                        } else if let example = type.examples.first, let img = UIImage(named: example.after) {
                            Image(uiImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: geo.size.width, height: geo.size.height)
                        } else {
                            Text(type.icon)
                                .font(.system(size: 44))
                                .opacity(0.6)
                        }
                    }
                    .clipped()
                }
                .frame(height: height)

                // Glass overlay at bottom
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(type.name)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(1)

                        Spacer()

                        // Coin badge
                        HStack(spacing: 3) {
                            Image(systemName: "bitcoinsign.circle.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(.yellow)
                            Text("\(type.coinCost)")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(.yellow)
                        }
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(.black.opacity(0.4))
                        .clipShape(Capsule())
                    }

                    Text(type.description)
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.7))
                        .lineLimit(1)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.7), .black.opacity(0.85)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(.white.opacity(0.08), lineWidth: 1)
            )
            .shadow(color: type.gradient.first?.opacity(0.2) ?? .clear, radius: 8, y: 4)
        }
    }
}

// MARK: - Video Card (horizontal, cinematic)

struct VideoCard: View {
    let type: GenerationType
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottomLeading) {
                // Background
                ZStack {
                    LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)

                    if let url = type.previewAfterUrl, let imageUrl = URL(string: url) {
                        AsyncImage(url: imageUrl) { image in
                            image.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            VStack(spacing: 6) {
                                Text(type.icon).font(.system(size: 36))
                                ProgressView().tint(.white)
                            }
                        }
                    } else if let example = type.examples.first, let img = UIImage(named: example.after) {
                        Image(uiImage: img)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } else {
                        VStack(spacing: 8) {
                            Text(type.icon)
                                .font(.system(size: 36))
                            Image(systemName: "play.circle.fill")
                                .font(.title)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }

                    // Play button overlay
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Image(systemName: "play.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(.white)
                                .offset(x: 2)
                        )
                        .opacity(0.9)
                }
                .frame(width: 160, height: 120)
                .clipped()

                // Video badge + info
                VStack(alignment: .leading, spacing: 0) {
                    // Top right badge
                    HStack {
                        Spacer()
                        HStack(spacing: 3) {
                            Image(systemName: "video.fill")
                                .font(.system(size: 7))
                            Text("VIDEO")
                                .font(.system(size: 7, weight: .heavy))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(
                            LinearGradient(colors: type.gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .clipShape(Capsule())
                    }
                    .padding(6)

                    Spacer()

                    // Bottom info
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(type.name)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                            Text(type.description)
                                .font(.system(size: 9))
                                .foregroundStyle(.white.opacity(0.6))
                                .lineLimit(1)
                        }

                        Spacer()

                        HStack(spacing: 2) {
                            Image(systemName: "bitcoinsign.circle.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(.yellow)
                            Text("\(type.coinCost)")
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundStyle(.yellow)
                        }
                    }
                    .padding(8)
                    .background(
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.8)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                .frame(width: 160, height: 120)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(.white.opacity(0.08), lineWidth: 1)
            )
            .shadow(color: type.gradient.first?.opacity(0.25) ?? .clear, radius: 8, y: 4)
        }
    }
}
