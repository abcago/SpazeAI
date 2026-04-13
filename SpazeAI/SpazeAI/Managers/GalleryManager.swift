import Foundation

@MainActor
final class GalleryManager: ObservableObject {
    @Published var images: [GeneratedImage] = []

    static let shared = GalleryManager()
    private let storageKey = "spaze_gallery"

    private init() {
        load()
    }

    func add(_ image: GeneratedImage) {
        images.insert(image, at: 0)
        save()
    }

    func delete(_ image: GeneratedImage) {
        GeneratedImage.deleteImageFile(image.imageFileName)
        images.removeAll { $0.id == image.id }
        save()
    }

    func deleteAll() {
        for img in images {
            GeneratedImage.deleteImageFile(img.imageFileName)
        }
        images.removeAll()
        save()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(images) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([GeneratedImage].self, from: data) else { return }
        images = decoded
    }
}
