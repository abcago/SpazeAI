import Foundation
import UIKit

// MARK: - API Configuration

struct APIConfig {
    #if DEBUG
    // Simulator uses localhost, real device needs Mac's IP
    private static let defaultURL = "http://localhost:3001"
    #else
    private static let defaultURL = "https://api.spazeai.com"
    #endif

    static var baseURL: String {
        UserDefaults.standard.string(forKey: "apiBaseURL") ?? defaultURL
    }

    static func setBaseURL(_ url: String) {
        UserDefaults.standard.set(url, forKey: "apiBaseURL")
    }
}

// MARK: - API Response Types

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: APIUser
}

struct APIUser: Codable {
    let id: String
    let email: String?
    let name: String
    let role: String
    let coinBalance: Int?
}

struct APIGenerationType: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let category: String?
    let inputMode: String
    let falModel: String
    let coinCost: Int
    let estimatedSeconds: Int
    let isActive: Bool
    let sortOrder: Int
    let previewBeforeUrl: String?
    let previewAfterUrl: String?
    let metadata: APIGenerationTypeMetadata?
}

struct APIGenerationTypeMetadata: Codable {
    let photo1Label: String?
    let photo2Label: String?
    let photo1Icon: String?
    let photo2Icon: String?
}

struct APIGeneration: Codable, Identifiable {
    let id: String
    let userId: String
    let generationTypeId: String
    let inputImageUrl: String?
    let resultImageUrl: String?
    let resultImageUrl2: String?
    let status: String
    let coinCost: Int
    let errorMessage: String?
    let createdAt: String
}

struct APICoinPackage: Codable, Identifiable {
    let id: String
    let coinAmount: Int
    let priceTRY: Double
    let badge: String?
    let isActive: Bool
}

struct APIFeedPost: Codable, Identifiable {
    let id: String
    let caption: String?
    let likesCount: Int
    let createdAt: String
    let userId: String
    let userName: String
    let userAvatarUrl: String?
    let generationId: String
    let resultImageUrl: String?
    let resultImageUrl2: String?
    let generationTypeId: String
    let generationTypeName: String
    let isLiked: Bool
}

struct APIUserProfile: Codable {
    let id: String
    let name: String
    let bio: String?
    let avatarUrl: String?
    let totalGenerations: Int
    let createdAt: String
    let postCount: Int?
    let totalLikes: Int?
}

struct APIPublishResponse: Codable {
    let id: String
    let userId: String
    let generationId: String
    let caption: String?
    let likesCount: Int
    let createdAt: String
}

struct APILikeResponse: Codable {
    let liked: Bool
    let likesCount: Int
}

struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let pagination: Pagination
}

struct Pagination: Codable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

// MARK: - API Service

actor APIService {
    static let shared = APIService()

    private let session: URLSession
    private var accessToken: String?
    private var refreshToken: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 300
        self.session = URLSession(configuration: config)

        // Restore tokens from keychain/UserDefaults
        self.accessToken = UserDefaults.standard.string(forKey: "accessToken")
        self.refreshToken = UserDefaults.standard.string(forKey: "refreshToken")
    }

    // MARK: - Token Management

    private func saveTokens(access: String, refresh: String) {
        self.accessToken = access
        self.refreshToken = refresh
        UserDefaults.standard.set(access, forKey: "accessToken")
        UserDefaults.standard.set(refresh, forKey: "refreshToken")
    }

    func clearTokens() {
        self.accessToken = nil
        self.refreshToken = nil
        UserDefaults.standard.removeObject(forKey: "accessToken")
        UserDefaults.standard.removeObject(forKey: "refreshToken")
    }

    var isAuthenticated: Bool {
        accessToken != nil
    }

    // MARK: - Auth

    func loginWithEmail(email: String, password: String) async throws -> AuthResponse {
        let body: [String: Any] = ["email": email, "password": password]
        let response: AuthResponse = try await post("/api/auth/login", body: body, authenticated: false)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
        return response
    }

    func register(email: String, password: String, name: String) async throws -> AuthResponse {
        let body: [String: Any] = ["email": email, "password": password, "name": name]
        let response: AuthResponse = try await post("/api/auth/register", body: body, authenticated: false)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
        return response
    }

    func loginWithSocial(provider: String, token: String, email: String?, name: String?) async throws -> AuthResponse {
        var body: [String: Any] = ["provider": provider, "token": token]
        if let email { body["email"] = email }
        if let name { body["name"] = name }
        let response: AuthResponse = try await post("/api/auth/social", body: body, authenticated: false)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
        return response
    }

    /// Link current guest account to a real provider (Apple/Google).
    /// Merges all generations, transactions, and coins into the linked account.
    func linkAccount(provider: String, token: String, email: String?, name: String?) async throws -> AuthResponse {
        var body: [String: Any] = ["provider": provider, "token": token]
        if let email { body["email"] = email }
        if let name { body["name"] = name }
        let response: AuthResponse = try await post("/api/auth/link", body: body, authenticated: true)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
        return response
    }

    /// Ensures the user has an API session. Creates a guest account if needed.
    func ensureAuthenticated() async throws {
        if isAuthenticated {
            // Try to verify existing token
            do {
                _ = try await getMe()
                return
            } catch {
                // Token expired, try refresh
                do {
                    try await refreshAccessToken()
                    return
                } catch {
                    // Refresh also failed, create new guest
                    clearTokens()
                }
            }
        }
        // No valid session — create guest
        _ = try await loginAsGuest()
    }

    func loginAsGuest() async throws -> AuthResponse {
        let body: [String: Any] = ["deviceId": Self.deviceId]
        let response: AuthResponse = try await post("/api/auth/guest", body: body, authenticated: false)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
        return response
    }

    /// Stable per-app/per-vendor device identifier.
    /// Resets only when the user uninstalls all apps from this vendor.
    static var deviceId: String {
        if let id = UIDevice.current.identifierForVendor?.uuidString {
            return id
        }
        // Fallback: persistent UUID stored in UserDefaults
        if let stored = UserDefaults.standard.string(forKey: "spaze_device_id") {
            return stored
        }
        let new = UUID().uuidString
        UserDefaults.standard.set(new, forKey: "spaze_device_id")
        return new
    }

    func refreshAccessToken() async throws {
        guard let rt = refreshToken else { throw APIError.notAuthenticated }
        let body: [String: Any] = ["refreshToken": rt]
        let response: AuthResponse = try await post("/api/auth/refresh", body: body, authenticated: false)
        saveTokens(access: response.accessToken, refresh: response.refreshToken)
    }

    func getMe() async throws -> APIUser {
        return try await get("/api/auth/me")
    }

    func logout() async throws {
        try? await post("/api/auth/logout", body: [:], authenticated: true) as EmptyResponse
        clearTokens()
    }

    // MARK: - Generation Types

    func getGenerationTypes() async throws -> [APIGenerationType] {
        return try await get("/api/generation-types")
    }

    // MARK: - Generations

    func createGeneration(typeId: String, image: UIImage, image2: UIImage? = nil) async throws -> APIGeneration {
        let resized = resizeImage(image, maxDimension: 1024)
        guard let jpegData = resized.jpegData(compressionQuality: 0.8) else {
            throw APIError.invalidImageData
        }

        var body: [String: Any] = [
            "generationTypeId": typeId,
            "inputImage": jpegData.base64EncodedString(),
        ]

        if let image2 {
            let resized2 = resizeImage(image2, maxDimension: 1024)
            guard let jpegData2 = resized2.jpegData(compressionQuality: 0.8) else {
                throw APIError.invalidImageData
            }
            body["inputImage2"] = jpegData2.base64EncodedString()
        }

        return try await post("/api/generations", body: body, authenticated: true)
    }

    func getGeneration(id: String) async throws -> APIGeneration {
        return try await get("/api/generations/\(id)")
    }

    func pollGeneration(id: String, interval: TimeInterval = 2.0, timeout: TimeInterval = 120) async throws -> APIGeneration {
        let start = Date()
        while true {
            let gen = try await getGeneration(id: id)
            if gen.status == "completed" || gen.status == "failed" {
                return gen
            }
            if Date().timeIntervalSince(start) > timeout {
                throw APIError.timeout
            }
            try await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
        }
    }

    func getMyGenerations(page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<APIGeneration> {
        return try await get("/api/generations?page=\(page)&limit=\(limit)")
    }

    // MARK: - Coin Packages

    func getCoinPackages() async throws -> [APICoinPackage] {
        return try await get("/api/coin-packages")
    }

    // MARK: - Transactions

    func getMyTransactions(page: Int = 1) async throws -> PaginatedResponse<Transaction> {
        return try await get("/api/transactions/me?page=\(page)")
    }

    // MARK: - Feed

    func getFeed(page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<APIFeedPost> {
        return try await get("/api/feed?page=\(page)&limit=\(limit)")
    }

    func publishToFeed(generationId: String, caption: String?) async throws -> APIPublishResponse {
        var body: [String: Any] = ["generationId": generationId]
        if let caption, !caption.isEmpty { body["caption"] = caption }
        return try await post("/api/feed", body: body, authenticated: true)
    }

    func toggleLike(postId: String) async throws -> APILikeResponse {
        return try await post("/api/feed/\(postId)/like", body: [:], authenticated: true)
    }

    func deleteFeedPost(postId: String) async throws {
        let url = URL(string: "\(APIConfig.baseURL)/api/feed/\(postId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        try validateResponse(response, data: data)
    }

    // MARK: - Profile

    func getProfile(userId: String) async throws -> APIUserProfile {
        return try await get("/api/profile/\(userId)")
    }

    func updateProfile(name: String?, bio: String?) async throws -> APIUserProfile {
        var body: [String: Any] = [:]
        if let name { body["name"] = name }
        if let bio { body["bio"] = bio }
        return try await put("/api/profile/me", body: body)
    }

    func getUserPosts(userId: String, page: Int = 1) async throws -> PaginatedResponse<APIFeedPost> {
        return try await get("/api/profile/\(userId)/posts?page=\(page)")
    }

    // MARK: - Image Download

    func downloadImage(from urlString: String) async throws -> UIImage {
        guard let url = URL(string: urlString) else { throw APIError.invalidURL }
        let data = try await downloadDataWithRetry(from: url)
        guard let image = UIImage(data: data) else { throw APIError.invalidImageData }
        return image
    }

    // MARK: - Video Download

    func downloadVideo(from urlString: String) async throws -> URL {
        guard let url = URL(string: urlString) else { throw APIError.invalidURL }
        let data = try await downloadDataWithRetry(from: url)
        let fileName = "\(UUID().uuidString).mp4"
        let localURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("GeneratedVideos", isDirectory: true)
        try FileManager.default.createDirectory(at: localURL, withIntermediateDirectories: true)
        let fileURL = localURL.appendingPathComponent(fileName)
        try data.write(to: fileURL)
        return fileURL
    }

    /// Download data with automatic retry on transient SSL/network failures.
    /// Cloudflare R2 public URLs sometimes fail TLS handshake intermittently.
    private func downloadDataWithRetry(from url: URL, maxAttempts: Int = 3) async throws -> Data {
        var lastError: Error?
        for attempt in 0..<maxAttempts {
            do {
                let (data, _) = try await session.data(from: url)
                return data
            } catch {
                lastError = error
                let nsError = error as NSError
                // Retry only on transient network/SSL failures
                let isTransient = nsError.domain == NSURLErrorDomain && [
                    NSURLErrorSecureConnectionFailed,
                    NSURLErrorTimedOut,
                    NSURLErrorNetworkConnectionLost,
                    NSURLErrorCannotConnectToHost,
                    NSURLErrorNotConnectedToInternet,
                ].contains(nsError.code)

                if !isTransient || attempt == maxAttempts - 1 {
                    throw error
                }
                // Exponential backoff: 0.5s, 1s, 2s
                let delay = UInt64(500_000_000) * UInt64(1 << attempt)
                try await Task.sleep(nanoseconds: delay)
            }
        }
        throw lastError ?? APIError.invalidImageData
    }

    // MARK: - HTTP Helpers

    private func get<T: Decodable>(_ path: String, isRetry: Bool = false) async throws -> T {
        let url = URL(string: "\(APIConfig.baseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        // Auto-refresh on 401
        if let http = response as? HTTPURLResponse, http.statusCode == 401, !isRetry, refreshToken != nil {
            do {
                try await refreshAccessToken()
                return try await get(path, isRetry: true)
            } catch {
                // Refresh failed - try guest login
                _ = try await loginAsGuest()
                return try await get(path, isRetry: true)
            }
        }

        try validateResponse(response, data: data)

        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    @discardableResult
    private func post<T: Decodable>(_ path: String, body: [String: Any], authenticated: Bool, isRetry: Bool = false) async throws -> T {
        let url = URL(string: "\(APIConfig.baseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated, let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        // Auto-refresh on 401 for authenticated requests
        if authenticated, let http = response as? HTTPURLResponse, http.statusCode == 401, !isRetry, refreshToken != nil {
            do {
                try await refreshAccessToken()
                return try await post(path, body: body, authenticated: authenticated, isRetry: true)
            } catch {
                // Refresh failed - try guest login
                _ = try await loginAsGuest()
                return try await post(path, body: body, authenticated: authenticated, isRetry: true)
            }
        }

        try validateResponse(response, data: data)

        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    @discardableResult
    private func put<T: Decodable>(_ path: String, body: [String: Any], isRetry: Bool = false) async throws -> T {
        let url = URL(string: "\(APIConfig.baseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        // Auto-refresh on 401
        if let http = response as? HTTPURLResponse, http.statusCode == 401, !isRetry, refreshToken != nil {
            do {
                try await refreshAccessToken()
                return try await put(path, body: body, isRetry: true)
            } catch {
                _ = try await loginAsGuest()
                return try await put(path, body: body, isRetry: true)
            }
        }

        try validateResponse(response, data: data)

        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }

    private func validateResponse(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if http.statusCode == 401 {
            throw APIError.notAuthenticated
        }

        if http.statusCode == 402 {
            throw APIError.insufficientCoins
        }

        guard (200..<300).contains(http.statusCode) else {
            let message = parseErrorMessage(data) ?? "HTTP \(http.statusCode)"
            throw APIError.serverError(message)
        }
    }

    private func parseErrorMessage(_ data: Data) -> String? {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return json["error"] as? String ?? json["message"] as? String
        }
        return nil
    }

    private func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let maxSide = max(size.width, size.height)
        guard maxSide > maxDimension else { return image }
        let scale = maxDimension / maxSide
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}

// MARK: - Error Types

enum APIError: LocalizedError, Equatable {
    case invalidURL
    case invalidResponse
    case invalidImageData
    case notAuthenticated
    case insufficientCoins
    case timeout
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL."
        case .invalidResponse: return "Got an unexpected response from the server."
        case .invalidImageData: return "We couldn't process this image. Please try a different photo."
        case .notAuthenticated: return "Please sign in to continue."
        case .insufficientCoins: return "You're out of coins. Visit the Shop to top up."
        case .timeout: return "This is taking longer than expected. Please try again."
        case .serverError(let msg): return "Server error: \(msg)"
        }
    }
}

// MARK: - Helper Types

struct Transaction: Codable {
    let id: String
    let userId: String
    let type: String
    let coinAmount: Int
    let description: String?
    let createdAt: String
}

private struct EmptyResponse: Decodable {}
