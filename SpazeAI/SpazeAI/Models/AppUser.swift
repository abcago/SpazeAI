import Foundation

enum AuthProvider: String, Codable {
    case guest
    case apple
    case google
}

struct AppUser: Codable {
    let id: String
    let provider: AuthProvider
    var email: String?
    var displayName: String?

    var isGuest: Bool { provider == .guest }

    static func guest() -> AppUser {
        let existingId = UserDefaults.standard.string(forKey: "spaze_guest_id")
        let guestId = existingId ?? UUID().uuidString
        if existingId == nil {
            UserDefaults.standard.set(guestId, forKey: "spaze_guest_id")
        }
        return AppUser(id: guestId, provider: .guest)
    }
}
