import Foundation
import SwiftUI

struct GeneratedImage: Identifiable, Codable {
    let id: UUID
    let generationTypeId: String
    let generationTypeName: String
    let imageFileName: String
    let createdAt: Date
    let serverGenerationId: String?

    init(generationTypeId: String, generationTypeName: String, imageFileName: String, serverGenerationId: String? = nil) {
        self.id = UUID()
        self.generationTypeId = generationTypeId
        self.generationTypeName = generationTypeName
        self.imageFileName = imageFileName
        self.createdAt = Date()
        self.serverGenerationId = serverGenerationId
    }

    /// Load the saved image from disk
    var image: UIImage? {
        let url = Self.storageDirectory.appendingPathComponent(imageFileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }

    /// Save image to disk and return filename
    static func saveImage(_ image: UIImage) -> String? {
        guard let data = image.jpegData(compressionQuality: 0.9) else { return nil }
        let fileName = "\(UUID().uuidString).jpg"
        let url = storageDirectory.appendingPathComponent(fileName)
        try? FileManager.default.createDirectory(at: storageDirectory, withIntermediateDirectories: true)
        try? data.write(to: url)
        return fileName
    }

    static func deleteImageFile(_ fileName: String) {
        let url = storageDirectory.appendingPathComponent(fileName)
        try? FileManager.default.removeItem(at: url)
    }

    static var storageDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("GeneratedImages", isDirectory: true)
    }
}
