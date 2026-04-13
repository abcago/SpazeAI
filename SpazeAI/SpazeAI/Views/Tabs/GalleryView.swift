import SwiftUI

struct GalleryView: View {
    @ObservedObject var galleryManager: GalleryManager
    @State private var selectedImage: GeneratedImage?

    private let columns = [
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                if galleryManager.images.isEmpty {
                    emptyState
                } else {
                    ScrollView(showsIndicators: false) {
                        LazyVGrid(columns: columns, spacing: 3) {
                            ForEach(galleryManager.images) { item in
                                GalleryThumbnail(item: item) {
                                    selectedImage = item
                                }
                            }
                        }
                        .padding(.top, 4)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Gallery")
                        .font(.headline.bold())
                        .foregroundStyle(SpazeTheme.neutral50)
                }
                if !galleryManager.images.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Text("\(galleryManager.images.count) creations")
                            .font(.caption)
                            .foregroundStyle(SpazeTheme.neutral500)
                    }
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .sheet(item: $selectedImage) { item in
                GalleryDetailView(item: item, galleryManager: galleryManager)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 50))
                .foregroundStyle(SpazeTheme.neutral600)

            Text("Your gallery is empty")
                .font(.headline)
                .foregroundStyle(SpazeTheme.neutral200)

            Text("Every photo you generate will appear here.\nTime to create your first masterpiece!")
                .font(.subheadline)
                .foregroundStyle(SpazeTheme.neutral500)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 30)
    }
}

struct GalleryThumbnail: View {
    let item: GeneratedImage
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottomLeading) {
                if let image = item.image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(1, contentMode: .fill)
                        .clipped()
                } else {
                    Rectangle()
                        .fill(SpazeTheme.nebula)
                        .aspectRatio(1, contentMode: .fill)
                        .overlay(
                            Image(systemName: "photo")
                                .foregroundStyle(SpazeTheme.neutral600)
                        )
                }

                // Type label
                Text(item.generationTypeName)
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(Color.black.opacity(0.6))
                    .clipShape(RoundedRectangle(cornerRadius: 3))
                    .padding(4)
            }
        }
    }
}

struct GalleryDetailView: View {
    let item: GeneratedImage
    @ObservedObject var galleryManager: GalleryManager
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteAlert = false
    @State private var showPublishSheet = false
    @State private var publishCaption = ""
    @State private var isPublishing = false
    @State private var publishSuccess = false
    @State private var publishError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.void_.ignoresSafeArea()

                VStack(spacing: 20) {
                    if let image = item.image {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)

                        VStack(spacing: 6) {
                            Text(item.generationTypeName)
                                .font(.headline.bold())
                                .foregroundStyle(SpazeTheme.neutral50)

                            Text(item.createdAt.formatted(date: .long, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(SpazeTheme.neutral500)
                        }

                        HStack(spacing: 14) {
                            Button {
                                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: "square.and.arrow.down")
                                        .font(.title3)
                                    Text("Save")
                                        .font(.caption2)
                                }
                                .foregroundStyle(SpazeTheme.secondary400)
                                .frame(width: 65, height: 60)
                                .background(RoundedRectangle(cornerRadius: 12).fill(SpazeTheme.nebula))
                            }

                            ShareLink(item: Image(uiImage: image), preview: SharePreview(item.generationTypeName, image: Image(uiImage: image))) {
                                VStack(spacing: 4) {
                                    Image(systemName: "square.and.arrow.up")
                                        .font(.title3)
                                    Text("Share")
                                        .font(.caption2)
                                }
                                .foregroundStyle(SpazeTheme.primary400)
                                .frame(width: 65, height: 60)
                                .background(RoundedRectangle(cornerRadius: 12).fill(SpazeTheme.nebula))
                            }

                            // Publish to Feed
                            if item.serverGenerationId != nil {
                                Button {
                                    showPublishSheet = true
                                } label: {
                                    VStack(spacing: 4) {
                                        Image(systemName: publishSuccess ? "checkmark.circle.fill" : "globe")
                                            .font(.title3)
                                        Text(publishSuccess ? "Live" : "Publish")
                                            .font(.caption2)
                                    }
                                    .foregroundStyle(publishSuccess ? SpazeTheme.success : SpazeTheme.accent400)
                                    .frame(width: 65, height: 60)
                                    .background(RoundedRectangle(cornerRadius: 12).fill(SpazeTheme.nebula))
                                }
                                .disabled(publishSuccess)
                            }

                            Button {
                                showDeleteAlert = true
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: "trash")
                                        .font(.title3)
                                    Text("Delete")
                                        .font(.caption2)
                                }
                                .foregroundStyle(SpazeTheme.error)
                                .frame(width: 65, height: 60)
                                .background(RoundedRectangle(cornerRadius: 12).fill(SpazeTheme.nebula))
                            }
                        }
                    }

                    Spacer()
                }
                .padding(.top, 20)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(SpazeTheme.neutral400)
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("Delete this image?", isPresented: $showDeleteAlert) {
                Button("Delete", role: .destructive) {
                    galleryManager.delete(item)
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently remove the image from your gallery. This can't be undone.")
            }
            .sheet(isPresented: $showPublishSheet) {
                PublishToFeedSheet(
                    item: item,
                    caption: $publishCaption,
                    isPublishing: $isPublishing,
                    onPublish: { caption in
                        await publishToFeed(caption: caption)
                    }
                )
                .presentationDetents([.medium])
            }
        }
        .preferredColorScheme(.dark)
    }

    private func publishToFeed(caption: String) async {
        guard let generationId = item.serverGenerationId else { return }
        isPublishing = true
        do {
            _ = try await APIService.shared.publishToFeed(
                generationId: generationId,
                caption: caption.isEmpty ? nil : caption
            )
            publishSuccess = true
            showPublishSheet = false
        } catch {
            publishError = error.localizedDescription
        }
        isPublishing = false
    }
}

// MARK: - Publish Sheet

struct PublishToFeedSheet: View {
    let item: GeneratedImage
    @Binding var caption: String
    @Binding var isPublishing: Bool
    let onPublish: (String) async -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.void_.ignoresSafeArea()

                VStack(spacing: 20) {
                    // Preview
                    if let image = item.image {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 180)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    // Caption
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Add a caption (optional)")
                                .font(.caption.bold())
                                .foregroundStyle(SpazeTheme.neutral400)
                            Spacer()
                            Text("\(caption.count)/500")
                                .font(.caption2)
                                .foregroundStyle(SpazeTheme.neutral600)
                        }
                        TextField("Tell us about this creation…", text: $caption, axis: .vertical)
                            .textFieldStyle(.plain)
                            .lineLimit(3...5)
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(SpazeTheme.nebula)
                            )
                            .foregroundStyle(SpazeTheme.neutral50)
                            .onChange(of: caption) { _, newValue in
                                if newValue.count > 500 {
                                    caption = String(newValue.prefix(500))
                                }
                            }
                    }

                    // Publish button
                    Button {
                        Task { await onPublish(caption) }
                    } label: {
                        HStack(spacing: 8) {
                            if isPublishing {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "globe")
                                Text("Share With The World")
                                    .bold()
                            }
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(SpazeTheme.gradientAccent)
                        )
                    }
                    .disabled(isPublishing)

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("Publish to Discover")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(SpazeTheme.neutral400)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
