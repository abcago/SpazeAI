import SwiftUI
import PhotosUI
import AVKit

struct GenerationView: View {
    let type: GenerationType
    @ObservedObject var coinManager: CoinManager
    @StateObject private var viewModel = ImageGeneratorViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Type header
                        GenerationHeader(type: type)

                        // Example showcase
                        if !type.examples.isEmpty {
                            ExampleShowcase(type: type)
                        }

                        // Photo input - single or dual
                        if type.inputMode == .twoPhotos {
                            TwoPhotoPickerSection(viewModel: viewModel, type: type)
                        } else {
                            SinglePhotoPickerSection(viewModel: viewModel, type: type)
                        }

                        // Generate button
                        GenerateActionButton(viewModel: viewModel, type: type)

                        // Results
                        if type.inputMode == .twoPhotos {
                            if let mother = viewModel.lastMotherBaby, let father = viewModel.lastFatherBaby {
                                TwoPhotoResultPreview(
                                    motherBaby: mother,
                                    fatherBaby: father,
                                    typeName: type.name
                                )
                            }
                        } else if let videoURL = viewModel.lastVideoURL {
                            VideoResultPreview(
                                videoURL: videoURL,
                                thumbnail: viewModel.lastGeneratedImage,
                                typeName: type.name
                            )
                        } else if let result = viewModel.lastGeneratedImage {
                            ResultPreview(image: result, typeName: type.name)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 40)
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
                ToolbarItem(placement: .topBarTrailing) {
                    CoinBarView(coinManager: coinManager) {}
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("Something Went Wrong", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An unexpected error occurred. Please try again.")
            }
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Generation Header

struct GenerationHeader: View {
    let type: GenerationType

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 72, height: 72)

                Image(systemName: type.icon)
                    .font(.system(size: 30))
                    .foregroundStyle(.white)
            }

            Text(type.name)
                .font(.title2.bold())
                .foregroundStyle(SpazeTheme.neutral50)

            Text(type.description)
                .font(.subheadline)
                .foregroundStyle(SpazeTheme.neutral400)
                .multilineTextAlignment(.center)

            HStack(spacing: 4) {
                Image(systemName: "circle.fill")
                    .font(.caption2)
                    .foregroundStyle(.yellow)
                Text("\(type.coinCost) Coin")
                    .font(.caption.bold())
                    .foregroundStyle(SpazeTheme.neutral300)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(Capsule().fill(SpazeTheme.cosmos))
        }
        .padding(.top)
    }
}

// MARK: - Single Photo Picker

struct SinglePhotoPickerSection: View {
    @ObservedObject var viewModel: ImageGeneratorViewModel
    let type: GenerationType
    @State private var selectedItem: PhotosPickerItem?

    var body: some View {
        PhotosPicker(selection: $selectedItem, matching: .images) {
            ZStack {
                RoundedRectangle(cornerRadius: 24)
                    .fill(SpazeTheme.nebula)
                    .frame(height: 280)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(
                                viewModel.inputImage != nil
                                    ? LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                                    : LinearGradient(colors: [SpazeTheme.starDust, SpazeTheme.starDust], startPoint: .top, endPoint: .bottom),
                                lineWidth: viewModel.inputImage != nil ? 2 : 1
                            )
                    )

                if let image = viewModel.inputImage {
                    GeometryReader { geo in
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: geo.size.width, height: 280)
                            .clipped()
                    }
                    .frame(height: 280)
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                } else {
                    VStack(spacing: 14) {
                        Image(systemName: "person.crop.rectangle.badge.plus")
                            .font(.system(size: 44))
                            .foregroundStyle(
                                LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                        Text("Tap to Add Your Photo")
                            .font(.headline)
                            .foregroundStyle(SpazeTheme.neutral200)

                        VStack(spacing: 4) {
                            Text("📸 Best results with:")
                                .font(.caption.bold())
                                .foregroundStyle(SpazeTheme.neutral400)
                            Text("Front-facing • Clear face • Good light")
                                .font(.caption2)
                                .foregroundStyle(SpazeTheme.neutral500)
                        }
                    }
                }
            }
        }
        .onChange(of: selectedItem) { _, newItem in
            Task { @MainActor in
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    viewModel.inputImage = uiImage
                }
            }
        }
    }
}

// MARK: - Two Photo Picker (Parent Baby + Person+Car flows)

struct TwoPhotoPickerSection: View {
    @ObservedObject var viewModel: ImageGeneratorViewModel
    let type: GenerationType

    private var connectorIcon: String {
        // Use a plus sign for compositions, heart for parent_baby
        type.id == "parent_baby" ? "heart.fill" : "plus"
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 16) {
                ParentPhotoCard(
                    title: type.photo1Label,
                    icon: type.photo1Icon,
                    image: $viewModel.inputImage,
                    accentColor: SpazeTheme.accent400
                )

                // Connector in middle
                ZStack {
                    Circle()
                        .fill(SpazeTheme.cosmos)
                        .frame(width: 44, height: 44)
                        .overlay(
                            Circle().stroke(SpazeTheme.starDust, lineWidth: 1)
                        )
                    Image(systemName: connectorIcon)
                        .font(.title3)
                        .foregroundStyle(SpazeTheme.gradientAccent)
                }
                .offset(y: -10)

                ParentPhotoCard(
                    title: type.photo2Label,
                    icon: type.photo2Icon,
                    image: $viewModel.secondImage,
                    accentColor: SpazeTheme.secondary400
                )
            }

            // Instructional helper
            HStack(spacing: 6) {
                Image(systemName: "info.circle.fill")
                    .font(.caption2)
                Text("Use clear, well-lit photos for the best results")
                    .font(.caption2)
            }
            .foregroundStyle(SpazeTheme.neutral500)
            .padding(.top, 4)
        }
    }
}

struct ParentPhotoCard: View {
    let title: String
    let icon: String
    @Binding var image: UIImage?
    let accentColor: Color
    @State private var selectedItem: PhotosPickerItem?

    var body: some View {
        VStack(spacing: 8) {
            PhotosPicker(selection: $selectedItem, matching: .images) {
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(SpazeTheme.nebula)
                        .frame(height: 180)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(
                                    image != nil ? accentColor.opacity(0.5) : SpazeTheme.starDust,
                                    lineWidth: image != nil ? 2 : 1
                                )
                        )

                    if let image {
                        GeometryReader { geo in
                            Image(uiImage: image)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: geo.size.width, height: 180)
                                .clipped()
                        }
                        .frame(height: 180)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    } else {
                        VStack(spacing: 12) {
                            Image(systemName: icon)
                                .font(.system(size: 32))
                                .foregroundStyle(accentColor.opacity(0.6))
                            Image(systemName: "plus.circle.fill")
                                .font(.title3)
                                .foregroundStyle(accentColor.opacity(0.4))
                        }
                    }
                }
            }
            .onChange(of: selectedItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        image = uiImage
                    }
                }
            }

            Text(title)
                .font(.caption.bold())
                .foregroundStyle(SpazeTheme.neutral300)
                .textCase(.uppercase)
                .tracking(1)
        }
    }
}

// MARK: - Example Showcase

struct ExampleShowcase: View {
    let type: GenerationType

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.caption)
                Text("Example Results")
                    .font(.caption.bold())
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .foregroundStyle(SpazeTheme.neutral400)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(type.examples.enumerated()), id: \.offset) { _, example in
                        ExampleBeforeAfterCard(example: example, gradient: type.gradient)
                    }
                }
            }
        }
    }
}

struct ExampleBeforeAfterCard: View {
    let example: ExampleMedia
    let gradient: [Color]

    private var beforeImage: UIImage? {
        UIImage(named: example.before)
    }

    private var afterImage: UIImage? {
        UIImage(named: example.after)
    }

    var body: some View {
        // Only show if at least the after image exists
        if beforeImage != nil || afterImage != nil {
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    // Before
                    ZStack {
                        if let img = beforeImage {
                            Image(uiImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } else {
                            SpazeTheme.nebula
                            Image(systemName: "person.fill")
                                .font(.title2)
                                .foregroundStyle(SpazeTheme.neutral500)
                        }
                    }
                    .frame(width: 110, height: 140)
                    .clipped()

                    // Arrow
                    ZStack {
                        LinearGradient(colors: gradient, startPoint: .top, endPoint: .bottom)
                            .frame(width: 28)
                        Image(systemName: "chevron.right")
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                    }
                    .frame(width: 28, height: 140)

                    // After
                    ZStack {
                        if let img = afterImage {
                            Image(uiImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } else {
                            SpazeTheme.nebula
                            Image(systemName: "sparkles")
                                .font(.title2)
                                .foregroundStyle(SpazeTheme.neutral500)
                        }
                    }
                    .frame(width: 110, height: 140)
                    .clipped()
                }

                // Labels
                HStack(spacing: 0) {
                    Text("Before")
                        .frame(width: 110)
                    Spacer().frame(width: 28)
                    Text("After")
                        .frame(width: 110)
                }
                .font(.caption2.bold())
                .foregroundStyle(SpazeTheme.neutral400)
                .textCase(.uppercase)
                .tracking(0.5)
                .padding(.vertical, 6)
                .background(SpazeTheme.deepSpace)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(SpazeTheme.starDust.opacity(0.4), lineWidth: 1)
            )
        }
    }
}

// MARK: - Generate Button

struct GenerateActionButton: View {
    @ObservedObject var viewModel: ImageGeneratorViewModel
    let type: GenerationType
    @State private var elapsedSeconds: Int = 0
    @State private var timer: Timer?

    private var hasResult: Bool {
        viewModel.lastGeneratedImage != nil || viewModel.lastMotherBaby != nil
    }

    var body: some View {
        Button {
            if hasResult {
                viewModel.clearInput()
            } else {
                startTimer()
                Task {
                    await viewModel.generate(type: type)
                    stopTimer()
                }
            }
        } label: {
            ZStack {
                if viewModel.isGenerating {
                    VStack(spacing: 6) {
                        HStack(spacing: 12) {
                            ProgressView().tint(.white)
                            Text(viewModel.progress)
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                        }
                        // Progress bar with estimated time
                        ProgressView(value: min(Double(elapsedSeconds), Double(type.estimatedSeconds)), total: Double(type.estimatedSeconds))
                            .tint(.white)
                            .padding(.horizontal, 24)
                        Text("About \(max(type.estimatedSeconds - elapsedSeconds, 1))s remaining")
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                } else if hasResult {
                    HStack(spacing: 10) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.title3)
                        Text("Try Another Photo")
                            .font(.headline.bold())
                    }
                    .foregroundStyle(.white)
                } else {
                    HStack(spacing: 10) {
                        Image(systemName: "wand.and.stars")
                            .font(.title3)
                        Text("Generate")
                            .font(.headline.bold())
                    }
                    .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: viewModel.isGenerating ? 72 : 56)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        hasResult
                            ? AnyShapeStyle(LinearGradient(colors: [SpazeTheme.success, SpazeTheme.secondary400], startPoint: .topLeading, endPoint: .bottomTrailing))
                            : canGenerate
                                ? AnyShapeStyle(LinearGradient(colors: type.gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                                : AnyShapeStyle(SpazeTheme.neutral600)
                    )
            )
            .shadow(color: canGenerate || hasResult ? type.gradient.first!.opacity(0.3) : .clear, radius: 20, y: 8)
            .animation(.easeInOut(duration: 0.3), value: viewModel.isGenerating)
            .animation(.easeInOut(duration: 0.3), value: hasResult)
        }
        .disabled(!canGenerate && !hasResult)
    }

    private var canGenerate: Bool {
        if viewModel.isGenerating { return false }
        if hasResult { return false }
        if type.inputMode == .twoPhotos {
            return viewModel.inputImage != nil && viewModel.secondImage != nil
        }
        return viewModel.inputImage != nil
    }

    private func startTimer() {
        elapsedSeconds = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            elapsedSeconds += 1
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}

// MARK: - Two Photo Result Preview

struct TwoPhotoResultPreview: View {
    let motherBaby: UIImage
    let fatherBaby: UIImage
    let typeName: String
    @State private var showFullScreen: UIImage?

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Label("Result", systemImage: "checkmark.circle.fill")
                    .font(.caption.bold())
                    .foregroundStyle(SpazeTheme.success)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
            }

            HStack(spacing: 12) {
                VStack(spacing: 6) {
                    Image(uiImage: motherBaby)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .onTapGesture { showFullScreen = motherBaby }

                    Text("Mom's Side")
                        .font(.caption2.bold())
                        .foregroundStyle(SpazeTheme.accent400)
                        .textCase(.uppercase)
                        .tracking(0.5)
                }

                VStack(spacing: 6) {
                    Image(uiImage: fatherBaby)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .onTapGesture { showFullScreen = fatherBaby }

                    Text("Dad's Side")
                        .font(.caption2.bold())
                        .foregroundStyle(SpazeTheme.secondary400)
                        .textCase(.uppercase)
                        .tracking(0.5)
                }
            }

            HStack(spacing: 12) {
                Menu {
                    Button {
                        UIImageWriteToSavedPhotosAlbum(motherBaby, nil, nil, nil)
                    } label: {
                        Label("Save Mom's Version", systemImage: "square.and.arrow.down")
                    }
                    Button {
                        UIImageWriteToSavedPhotosAlbum(fatherBaby, nil, nil, nil)
                    } label: {
                        Label("Save Dad's Version", systemImage: "square.and.arrow.down")
                    }
                    Button {
                        UIImageWriteToSavedPhotosAlbum(motherBaby, nil, nil, nil)
                        UIImageWriteToSavedPhotosAlbum(fatherBaby, nil, nil, nil)
                    } label: {
                        Label("Save Both", systemImage: "square.and.arrow.down.on.square")
                    }
                } label: {
                    Label("Save", systemImage: "square.and.arrow.down")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.secondary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }

                ShareLink(
                    items: [Image(uiImage: motherBaby), Image(uiImage: fatherBaby)],
                    preview: { _ in SharePreview(typeName) }
                ) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.primary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(SpazeTheme.deepSpace)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(SpazeTheme.success.opacity(0.3), lineWidth: 1)
                )
        )
        .fullScreenCover(item: Binding(
            get: { showFullScreen.map { FullScreenItem(image: $0) } },
            set: { if $0 == nil { showFullScreen = nil } }
        )) { item in
            FullScreenImageView(image: item.image)
        }
    }
}

struct FullScreenItem: Identifiable {
    let id = UUID()
    let image: UIImage
}

// MARK: - Single Result Preview

struct ResultPreview: View {
    let image: UIImage
    let typeName: String
    @State private var showFullScreen = false

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Label("Result", systemImage: "checkmark.circle.fill")
                    .font(.caption.bold())
                    .foregroundStyle(SpazeTheme.success)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
            }

            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .onTapGesture { showFullScreen = true }

            HStack(spacing: 16) {
                Button {
                    UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                } label: {
                    Label("Save", systemImage: "square.and.arrow.down")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.secondary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }

                ShareLink(item: Image(uiImage: image), preview: SharePreview(typeName, image: Image(uiImage: image))) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.primary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }

                Button {
                    UIPasteboard.general.image = image
                } label: {
                    Label("Copy", systemImage: "doc.on.doc")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.accent400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(SpazeTheme.deepSpace)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(SpazeTheme.success.opacity(0.3), lineWidth: 1)
                )
        )
        .fullScreenCover(isPresented: $showFullScreen) {
            FullScreenImageView(image: image)
        }
    }
}

// MARK: - Full Screen

struct FullScreenImageView: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss
    @State private var scale: CGFloat = 1.0

    var body: some View {
        ZStack {
            SpazeTheme.void_.ignoresSafeArea()
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .scaleEffect(scale)
                .gesture(
                    MagnifyGesture()
                        .onChanged { scale = $0.magnification }
                        .onEnded { _ in withAnimation { scale = 1.0 } }
                )
            VStack {
                HStack {
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(SpazeTheme.neutral400)
                            .padding()
                    }
                }
                Spacer()
            }
        }
        .statusBarHidden()
    }
}

// MARK: - Video Result Preview

struct VideoResultPreview: View {
    let videoURL: URL
    let thumbnail: UIImage?
    let typeName: String
    @State private var showVideoPlayer = false

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Label("Video Ready", systemImage: "checkmark.circle.fill")
                    .font(.caption.bold())
                    .foregroundStyle(SpazeTheme.success)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
            }

            // Thumbnail with play button
            ZStack {
                if let thumb = thumbnail {
                    Image(uiImage: thumb)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(SpazeTheme.nebula)
                        .aspectRatio(16/9, contentMode: .fit)
                }

                // Play button overlay
                Button {
                    showVideoPlayer = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(.black.opacity(0.5))
                            .frame(width: 64, height: 64)
                        Image(systemName: "play.fill")
                            .font(.title)
                            .foregroundStyle(.white)
                    }
                }
            }

            HStack(spacing: 16) {
                Button {
                    showVideoPlayer = true
                } label: {
                    Label("Play", systemImage: "play.circle")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.success)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }

                Button {
                    saveVideoToPhotos()
                } label: {
                    Label("Save", systemImage: "square.and.arrow.down")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.secondary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }

                ShareLink(item: videoURL) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.caption.bold())
                        .foregroundStyle(SpazeTheme.primary400)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Capsule().fill(SpazeTheme.nebula))
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(SpazeTheme.deepSpace)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(SpazeTheme.success.opacity(0.3), lineWidth: 1)
                )
        )
        .fullScreenCover(isPresented: $showVideoPlayer) {
            VideoPlayerView(url: videoURL)
        }
    }

    private func saveVideoToPhotos() {
        UISaveVideoAtPathToSavedPhotosAlbum(videoURL.path, nil, nil, nil)
    }
}

// MARK: - Video Player

struct VideoPlayerView: View {
    let url: URL
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            SpazeTheme.void_.ignoresSafeArea()
            VideoPlayer(player: AVPlayer(url: url))
                .ignoresSafeArea()
            VStack {
                HStack {
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(SpazeTheme.neutral400)
                            .padding()
                    }
                }
                Spacer()
            }
        }
        .statusBarHidden()
    }
}
