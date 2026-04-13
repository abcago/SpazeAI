import SwiftUI

struct ProfileView: View {
    let userId: String
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authManager: AuthManager

    @State private var profile: APIUserProfile?
    @State private var posts: [APIFeedPost] = []
    @State private var isLoading = true
    @State private var isEditingProfile = false
    @State private var currentPage = 1
    @State private var hasMore = true

    private let api = APIService.shared
    private let columns = [
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2),
        GridItem(.flexible(), spacing: 2)
    ]

    private var isOwnProfile: Bool {
        authManager.currentUser?.id == userId
    }

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                if isLoading && profile == nil {
                    ProgressView()
                        .tint(SpazeTheme.primary400)
                } else if let profile {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 20) {
                            profileHeader(profile)
                            statsRow(profile)
                            postsGrid
                        }
                        .padding(.bottom, 20)
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(SpazeTheme.neutral400)
                }
                if isOwnProfile {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            isEditingProfile = true
                        } label: {
                            Image(systemName: "pencil")
                                .foregroundStyle(SpazeTheme.primary400)
                        }
                    }
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .sheet(isPresented: $isEditingProfile) {
                EditProfileView(
                    currentName: profile?.name ?? "",
                    currentBio: profile?.bio ?? ""
                ) { name, bio in
                    await updateProfile(name: name, bio: bio)
                }
            }
            .task { await loadProfile() }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Profile Header

    private func profileHeader(_ profile: APIUserProfile) -> some View {
        VStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [SpazeTheme.primary500, SpazeTheme.secondary400],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                Text(String(profile.name.prefix(1)).uppercased())
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text(profile.name)
                .font(.title2.bold())
                .foregroundStyle(SpazeTheme.neutral50)

            if let bio = profile.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundStyle(SpazeTheme.neutral400)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .padding(.top, 10)
    }

    // MARK: - Stats Row

    private func statsRow(_ profile: APIUserProfile) -> some View {
        HStack(spacing: 0) {
            statItem(value: "\(profile.postCount ?? 0)", label: "Posts")
            Divider()
                .frame(height: 30)
                .background(SpazeTheme.neutral700)
            statItem(value: "\(profile.totalLikes ?? 0)", label: "Likes")
            Divider()
                .frame(height: 30)
                .background(SpazeTheme.neutral700)
            statItem(value: "\(profile.totalGenerations)", label: "Creations")
        }
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(SpazeTheme.nebula.opacity(0.6))
        )
        .padding(.horizontal, 20)
    }

    private func statItem(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline.bold())
                .foregroundStyle(SpazeTheme.neutral50)
            Text(label)
                .font(.caption)
                .foregroundStyle(SpazeTheme.neutral500)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Posts Grid

    private var postsGrid: some View {
        Group {
            if posts.isEmpty && !isLoading {
                VStack(spacing: 12) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.system(size: 36))
                        .foregroundStyle(SpazeTheme.neutral600)
                    Text(isOwnProfile ? "No posts yet" : "Nothing here yet")
                        .font(.subheadline)
                        .foregroundStyle(SpazeTheme.neutral500)
                    if isOwnProfile {
                        Text("Publish your first creation from the Gallery")
                            .font(.caption)
                            .foregroundStyle(SpazeTheme.neutral600)
                    }
                }
                .padding(.top, 40)
            } else {
                LazyVGrid(columns: columns, spacing: 2) {
                    ForEach(posts) { post in
                        ProfilePostThumbnail(post: post)
                    }
                }
                .padding(.horizontal, 2)
            }
        }
    }

    // MARK: - Data Loading

    private func loadProfile() async {
        isLoading = true
        do {
            async let profileFetch = api.getProfile(userId: userId)
            async let postsFetch = api.getUserPosts(userId: userId, page: 1)

            let (p, postsResponse) = try await (profileFetch, postsFetch)
            profile = p
            posts = postsResponse.data
            hasMore = postsResponse.pagination.page < postsResponse.pagination.totalPages
        } catch {
            print("Profile load error: \(error)")
        }
        isLoading = false
    }

    private func updateProfile(name: String, bio: String) async {
        do {
            let updated = try await api.updateProfile(name: name, bio: bio)
            profile = updated
        } catch {
            print("Profile update error: \(error)")
        }
    }
}

// MARK: - Profile Post Thumbnail

struct ProfilePostThumbnail: View {
    let post: APIFeedPost
    @State private var image: UIImage?

    var body: some View {
        ZStack {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(1, contentMode: .fill)
                    .clipped()
            } else {
                Rectangle()
                    .fill(SpazeTheme.deepSpace)
                    .aspectRatio(1, contentMode: .fill)
                    .overlay(
                        ProgressView()
                            .tint(SpazeTheme.neutral600)
                            .scaleEffect(0.7)
                    )
            }

            // Likes overlay
            if post.likesCount > 0 {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        HStack(spacing: 2) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 8))
                            Text("\(post.likesCount)")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.black.opacity(0.6))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                        .padding(4)
                    }
                }
            }
        }
        .task {
            guard let url = post.resultImageUrl else { return }
            do {
                let loaded = try await APIService.shared.downloadImage(from: url)
                await MainActor.run { image = loaded }
            } catch {}
        }
    }
}

// MARK: - Edit Profile Sheet

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @State var name: String
    @State var bio: String
    let onSave: (String, String) async -> Void
    @State private var isSaving = false

    init(currentName: String, currentBio: String, onSave: @escaping (String, String) async -> Void) {
        _name = State(initialValue: currentName)
        _bio = State(initialValue: currentBio)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.void_.ignoresSafeArea()

                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Name")
                            .font(.caption.bold())
                            .foregroundStyle(SpazeTheme.neutral400)
                        TextField("Your name", text: $name)
                            .textFieldStyle(.plain)
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(SpazeTheme.nebula)
                            )
                            .foregroundStyle(SpazeTheme.neutral50)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Bio")
                                .font(.caption.bold())
                                .foregroundStyle(SpazeTheme.neutral400)
                            Spacer()
                            Text("\(bio.count)/300")
                                .font(.caption2)
                                .foregroundStyle(SpazeTheme.neutral600)
                        }
                        TextEditor(text: $bio)
                            .scrollContentBackground(.hidden)
                            .padding(10)
                            .frame(height: 100)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(SpazeTheme.nebula)
                            )
                            .foregroundStyle(SpazeTheme.neutral50)
                            .onChange(of: bio) { _, newValue in
                                if newValue.count > 300 {
                                    bio = String(newValue.prefix(300))
                                }
                            }
                    }

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(SpazeTheme.neutral400)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isSaving = true
                        Task {
                            await onSave(name, bio)
                            isSaving = false
                            dismiss()
                        }
                    } label: {
                        if isSaving {
                            ProgressView()
                                .tint(SpazeTheme.primary400)
                        } else {
                            Text("Save")
                                .bold()
                                .foregroundStyle(SpazeTheme.primary400)
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
