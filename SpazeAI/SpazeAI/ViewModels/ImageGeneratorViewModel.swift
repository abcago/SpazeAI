import Foundation
import SwiftUI
import AVFoundation

@MainActor
final class ImageGeneratorViewModel: ObservableObject {
    @Published var inputImage: UIImage?
    @Published var secondImage: UIImage?
    @Published var isGenerating: Bool = false
    @Published var errorMessage: String?
    @Published var showError: Bool = false
    @Published var progress: String = ""
    @Published var lastGeneratedImage: UIImage?
    @Published var lastMotherBaby: UIImage?
    @Published var lastFatherBaby: UIImage?
    @Published var showResult: Bool = false
    @Published var lastVideoURL: URL?

    var selectedType: GenerationType?

    private let api = APIService.shared
    private let coinManager = CoinManager.shared
    private let galleryManager = GalleryManager.shared

    func generate(type: GenerationType) async {
        if type.inputMode == .twoPhotos {
            await generateFromTwoPhotos(type: type)
        } else {
            await generateFromSinglePhoto(type: type)
        }
    }

    /// Sync local coin balance from server
    func syncCoins() async {
        if let me = try? await api.getMe() {
            coinManager.setCoins(me.coinBalance ?? coinManager.coins)
        }
    }

    private func generateFromSinglePhoto(type: GenerationType) async {
        guard let image = inputImage else {
            errorMessage = "Please select a photo to continue."
            showError = true
            return
        }

        selectedType = type
        isGenerating = true
        progress = "Creating your \(type.name)…"
        errorMessage = nil

        do {
            let generation = try await api.createGeneration(typeId: type.id, image: image)

            progress = "Almost there… polishing pixels"

            let completed = try await api.pollGeneration(
                id: generation.id,
                interval: 2.0,
                timeout: Double(type.estimatedSeconds + 60)
            )

            if completed.status == "failed" {
                throw APIError.serverError(completed.errorMessage ?? "Generation failed. Please try again.")
            }

            guard let resultUrl = completed.resultImageUrl else {
                throw APIError.serverError("Result image not found. Please try again.")
            }

            let isVideo = resultUrl.hasSuffix(".mp4") || resultUrl.contains("video")
                || type.category == "video"

            if isVideo {
                let videoURL = try await api.downloadVideo(from: resultUrl)
                lastVideoURL = videoURL

                // Generate thumbnail from video for gallery
                let thumbnail = generateVideoThumbnail(from: videoURL)
                if let thumb = thumbnail, let fileName = GeneratedImage.saveImage(thumb) {
                    let generated = GeneratedImage(
                        generationTypeId: type.id,
                        generationTypeName: type.name,
                        imageFileName: fileName,
                        serverGenerationId: completed.id
                    )
                    galleryManager.add(generated)
                }

                lastGeneratedImage = thumbnail
            } else {
                let resultImage = try await api.downloadImage(from: resultUrl)

                if let fileName = GeneratedImage.saveImage(resultImage) {
                    let generated = GeneratedImage(
                        generationTypeId: type.id,
                        generationTypeName: type.name,
                        imageFileName: fileName,
                        serverGenerationId: completed.id
                    )
                    galleryManager.add(generated)
                }

                lastGeneratedImage = resultImage
                lastVideoURL = nil
            }

            // Sync coin balance from server
            await syncCoins()

            lastMotherBaby = nil
            lastFatherBaby = nil
            showResult = true
            progress = ""
        } catch let error as APIError where error == .insufficientCoins {
            errorMessage = "You're out of coins. Visit the Shop to top up and keep creating."
            showError = true
            progress = ""
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            progress = ""
        }

        isGenerating = false
    }

    private func generateFromTwoPhotos(type: GenerationType) async {
        guard let mother = inputImage else {
            errorMessage = "Please select the first photo to continue."
            showError = true
            return
        }
        guard let father = secondImage else {
            errorMessage = "Please select the second photo to continue."
            showError = true
            return
        }

        selectedType = type
        isGenerating = true
        progress = "Mixing the magic…"
        errorMessage = nil

        do {
            let generation = try await api.createGeneration(
                typeId: type.id,
                image: mother,
                image2: father
            )

            progress = "Almost there… polishing pixels"

            let completed = try await api.pollGeneration(
                id: generation.id,
                interval: 2.0,
                timeout: Double(type.estimatedSeconds + 60)
            )

            if completed.status == "failed" {
                throw APIError.serverError(completed.errorMessage ?? "Generation failed. Please try again.")
            }

            guard let resultUrl = completed.resultImageUrl else {
                throw APIError.serverError("Result image not found. Please try again.")
            }

            let motherBaby = try await api.downloadImage(from: resultUrl)

            // Sync coin balance from server
            await syncCoins()

            if let fileName1 = GeneratedImage.saveImage(motherBaby) {
                galleryManager.add(GeneratedImage(
                    generationTypeId: type.id,
                    generationTypeName: "\(type.name) - Anneden",
                    imageFileName: fileName1,
                    serverGenerationId: completed.id
                ))
            }

            var fatherBaby: UIImage? = nil
            if let resultUrl2 = completed.resultImageUrl2 {
                fatherBaby = try await api.downloadImage(from: resultUrl2)
                if let fb = fatherBaby, let fileName2 = GeneratedImage.saveImage(fb) {
                    galleryManager.add(GeneratedImage(
                        generationTypeId: type.id,
                        generationTypeName: "\(type.name) - Babadan",
                        imageFileName: fileName2,
                        serverGenerationId: completed.id
                    ))
                }
            }

            lastMotherBaby = motherBaby
            lastFatherBaby = fatherBaby
            lastGeneratedImage = nil
            showResult = true
            progress = ""
        } catch let error as APIError where error == .insufficientCoins {
            errorMessage = "You're out of coins. Visit the Shop to top up and keep creating."
            showError = true
            progress = ""
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            progress = ""
        }

        isGenerating = false
    }

    func clearInput() {
        inputImage = nil
        secondImage = nil
        lastGeneratedImage = nil
        lastMotherBaby = nil
        lastFatherBaby = nil
        lastVideoURL = nil
    }

    private func generateVideoThumbnail(from url: URL) -> UIImage? {
        let asset = AVAsset(url: url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 1024, height: 1024)
        do {
            let cgImage = try generator.copyCGImage(at: .zero, actualTime: nil)
            return UIImage(cgImage: cgImage)
        } catch {
            return nil
        }
    }
}
