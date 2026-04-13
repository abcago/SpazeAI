import Foundation
import UIKit

// This service is deprecated — all generation now goes through APIService.
// Kept as a stub to avoid breaking any remaining references.

enum ImageGenerationError: LocalizedError {
    case invalidURL
    case invalidResponse
    case apiError(String)
    case noImageData
    case missingAPIKey
    case timeout
    case missingPhotos
    case insufficientCoins

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL."
        case .invalidResponse: return "Got an unexpected response from the server."
        case .apiError(let message): return "Server error: \(message)"
        case .noImageData: return "We couldn't load the image data."
        case .missingAPIKey: return "API key isn't set up."
        case .timeout: return "This is taking longer than usual. Please try again."
        case .missingPhotos: return "Please select a photo first."
        case .insufficientCoins: return "Not enough coins."
        }
    }
}
