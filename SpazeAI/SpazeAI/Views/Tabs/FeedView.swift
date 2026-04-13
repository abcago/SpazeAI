import SwiftUI

struct FeedView: View {
    @State private var posts: [APIFeedPost] = []
    @State private var isLoading = false
    @State private var currentPage = 1
    @State private var hasMore = true
    @State private var selectedPost: APIFeedPost?
    @State private var selectedProfileUserId: String?

    private let api = APIService.shared

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                if posts.isEmpty && !isLoading {
                    emptyState
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVStack(spacing: 0) {
                            ForEach(Array(posts.enumerated()), id: \.element.id) { index, post in
                                FeedPostCard(
                                    post: post,
                                    onLike: { await toggleLike(post: post, at: index) },
                                    onProfileTap: { selectedProfileUserId = post.userId }
                                )

                                if index < posts.count - 1 {
                                    Divider()
                                        .background(SpazeTheme.neutral700)
                                }

                                // Load more
                                if index == posts.count - 3 && hasMore && !isLoading {
                                    Color.clear
                                        .frame(height: 1)
                                        .onAppear { Task { await loadMore() } }
                                }
                            }

                            if isLoading {
                                ProgressView()
                                    .tint(SpazeTheme.primary400)
                                    .padding()
                            }
                        }
                    }
                    .refreshable { await refresh() }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Discover")
                        .font(.headline.bold())
                        .foregroundStyle(SpazeTheme.neutral50)
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .sheet(item: $selectedProfileUserId) { userId in
                ProfileView(userId: userId)
            }
            .task { await loadInitial() }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "rectangle.stack.person.crop")
                .font(.system(size: 50))
                .foregroundStyle(SpazeTheme.neutral600)

            Text("Be the first to share")
                .font(.headline)
                .foregroundStyle(SpazeTheme.neutral200)

            Text("Create something amazing on the Create tab,\nthen publish it from your gallery.")
                .font(.subheadline)
                .foregroundStyle(SpazeTheme.neutral500)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 30)
    }

    private func loadInitial() async {
        guard posts.isEmpty else { return }
        await refresh()
    }

    private func refresh() async {
        isLoading = true
        currentPage = 1
        do {
            let response = try await api.getFeed(page: 1)
            posts = response.data
            hasMore = response.pagination.page < response.pagination.totalPages
        } catch {
            print("Feed load error: \(error)")
        }
        isLoading = false
    }

    private func loadMore() async {
        guard hasMore, !isLoading else { return }
        isLoading = true
        let nextPage = currentPage + 1
        do {
            let response = try await api.getFeed(page: nextPage)
            posts.append(contentsOf: response.data)
            currentPage = nextPage
            hasMore = response.pagination.page < response.pagination.totalPages
        } catch {
            print("Feed load more error: \(error)")
        }
        isLoading = false
    }

    private func toggleLike(post: APIFeedPost, at index: Int) async {
        do {
            let response = try await api.toggleLike(postId: post.id)
            if index < posts.count {
                let old = posts[index]
                posts[index] = APIFeedPost(
                    id: old.id,
                    caption: old.caption,
                    likesCount: response.likesCount,
                    createdAt: old.createdAt,
                    userId: old.userId,
                    userName: old.userName,
                    userAvatarUrl: old.userAvatarUrl,
                    generationId: old.generationId,
                    resultImageUrl: old.resultImageUrl,
                    resultImageUrl2: old.resultImageUrl2,
                    generationTypeId: old.generationTypeId,
                    generationTypeName: old.generationTypeName,
                    isLiked: response.liked
                )
            }
        } catch {
            print("Like error: \(error)")
        }
    }
}

// MARK: - Feed Post Card

struct FeedPostCard: View {
    let post: APIFeedPost
    let onLike: () async -> Void
    let onProfileTap: () -> Void
    @State private var imageLoaded: UIImage?
    @State private var isLiking = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header - User info
            Button(action: onProfileTap) {
                HStack(spacing: 10) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(SpazeTheme.primary500.opacity(0.2))
                            .frame(width: 36, height: 36)
                        Text(String(post.userName.prefix(1)).uppercased())
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(SpazeTheme.primary400)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(post.userName)
                            .font(.subheadline.bold())
                            .foregroundStyle(SpazeTheme.neutral50)

                        Text(post.generationTypeName)
                            .font(.caption2)
                            .foregroundStyle(SpazeTheme.neutral500)
                    }

                    Spacer()

                    Text(timeAgo(post.createdAt))
                        .font(.caption2)
                        .foregroundStyle(SpazeTheme.neutral600)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
            }

            // Image
            if let image = imageLoaded {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .background(SpazeTheme.deepSpace)
            } else {
                Rectangle()
                    .fill(SpazeTheme.deepSpace)
                    .aspectRatio(1, contentMode: .fit)
                    .overlay(
                        ProgressView()
                            .tint(SpazeTheme.neutral600)
                    )
            }

            // Actions & Caption
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 16) {
                    // Like button
                    Button {
                        guard !isLiking else { return }
                        isLiking = true
                        Task {
                            await onLike()
                            isLiking = false
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: post.isLiked ? "heart.fill" : "heart")
                                .font(.title3)
                                .foregroundStyle(post.isLiked ? SpazeTheme.accent400 : SpazeTheme.neutral300)
                            if post.likesCount > 0 {
                                Text("\(post.likesCount)")
                                    .font(.subheadline)
                                    .foregroundStyle(SpazeTheme.neutral300)
                            }
                        }
                    }

                    Spacer()

                    // Type badge
                    Text(post.generationTypeName)
                        .font(.caption2.bold())
                        .foregroundStyle(SpazeTheme.primary300)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(SpazeTheme.primary500.opacity(0.15))
                        .clipShape(Capsule())
                }

                if let caption = post.caption, !caption.isEmpty {
                    HStack(spacing: 4) {
                        Text(post.userName)
                            .font(.subheadline.bold())
                        Text(caption)
                            .font(.subheadline)
                    }
                    .foregroundStyle(SpazeTheme.neutral200)
                    .lineLimit(3)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
        }
        .background(SpazeTheme.void_)
        .task { await loadImage() }
    }

    private func loadImage() async {
        guard let urlString = post.resultImageUrl else { return }
        do {
            let image = try await APIService.shared.downloadImage(from: urlString)
            await MainActor.run { imageLoaded = image }
        } catch {
            print("Image load error: \(error)")
        }
    }

    private func timeAgo(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: dateString) else {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: dateString) else { return "" }
            return relativeTime(from: date)
        }
        return relativeTime(from: date)
    }

    private func relativeTime(from date: Date) -> String {
        let seconds = Int(-date.timeIntervalSinceNow)
        if seconds < 60 { return "now" }
        if seconds < 3600 { return "\(seconds / 60)m" }
        if seconds < 86400 { return "\(seconds / 3600)h" }
        if seconds < 604800 { return "\(seconds / 86400)d" }
        return "\(seconds / 604800)w"
    }
}

// MARK: - Make String identifiable for sheet

extension String: @retroactive Identifiable {
    public var id: String { self }
}
