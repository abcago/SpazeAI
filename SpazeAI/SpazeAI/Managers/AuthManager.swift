import Foundation
import AuthenticationServices
import SwiftUI

@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: AppUser?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var isReady = false

    private let api = APIService.shared

    private init() {
        loadUser()
    }

    // MARK: - Auto-authenticate on launch

    func ensureReady() async {
        isLoading = true
        do {
            try await api.ensureAuthenticated()
            let me = try await api.getMe()
            let user = AppUser(
                id: me.id,
                provider: AuthProvider(rawValue: "guest") ?? .guest, // will update below
                email: me.email,
                displayName: me.name
            )
            save(user)
            isReady = true
        } catch {
            // Offline or API unreachable — still allow local usage
            if currentUser == nil {
                let guest = AppUser.guest()
                save(guest)
            }
            isReady = true
        }
        isLoading = false
    }

    // MARK: - Apple Sign In (link guest → Apple account)

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential else {
                showErrorMessage("We couldn't get your Apple credentials. Please try again.")
                return
            }

            let userId = credential.user

            // Apple only sends name/email on first sign-in
            var name: String?
            if let fullName = credential.fullName {
                let parts = [fullName.givenName, fullName.familyName].compactMap { $0 }
                if !parts.isEmpty { name = parts.joined(separator: " ") }
            }

            var email: String?
            if let appleEmail = credential.email {
                email = appleEmail
            }

            // Load previously stored name/email for this Apple ID
            if name == nil {
                name = UserDefaults.standard.string(forKey: "spaze_apple_name_\(userId)")
            }
            if email == nil {
                email = UserDefaults.standard.string(forKey: "spaze_apple_email_\(userId)")
            }

            // Persist Apple-provided data for future logins
            if let n = name { UserDefaults.standard.set(n, forKey: "spaze_apple_name_\(userId)") }
            if let e = email { UserDefaults.standard.set(e, forKey: "spaze_apple_email_\(userId)") }

            Task {
                await linkToProvider(provider: "apple", token: userId, email: email, name: name)
            }

        case .failure(let error):
            if (error as NSError).code == ASAuthorizationError.canceled.rawValue { return }
            showErrorMessage("Apple sign-in failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Google Sign In (link guest → Google account)

    func signInWithGoogle() {
        showErrorMessage("Google sign-in is coming soon. For now, please use Apple Sign-In or continue as a guest.")
    }

    // Called after Google SDK returns credentials
    func handleGoogleSignIn(idToken: String, email: String?, name: String?) {
        Task {
            await linkToProvider(provider: "google", token: idToken, email: email, name: name)
        }
    }

    // MARK: - Link to Provider

    private func linkToProvider(provider: String, token: String, email: String?, name: String?) async {
        isLoading = true
        do {
            let response = try await api.linkAccount(
                provider: provider,
                token: token,
                email: email,
                name: name
            )

            let providerEnum: AuthProvider = provider == "apple" ? .apple : .google
            let user = AppUser(
                id: response.user.id,
                provider: providerEnum,
                email: response.user.email,
                displayName: response.user.name
            )
            save(user)
        } catch {
            showErrorMessage("Couldn't link your account: \(error.localizedDescription)")
        }
        isLoading = false
    }

    // MARK: - Sign Out (reverts to new guest)

    func signOut() {
        Task {
            try? await api.logout()
            await api.clearTokens()
            // Create a fresh guest account
            do {
                let response = try await api.loginAsGuest()
                let user = AppUser(
                    id: response.user.id,
                    provider: .guest,
                    email: nil,
                    displayName: nil
                )
                save(user)
            } catch {
                let guest = AppUser.guest()
                save(guest)
            }
        }
    }

    // MARK: - Persistence

    private func save(_ user: AppUser) {
        currentUser = user
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "spaze_current_user")
        }
    }

    private func loadUser() {
        guard let data = UserDefaults.standard.data(forKey: "spaze_current_user"),
              let user = try? JSONDecoder().decode(AppUser.self, from: data) else {
            return
        }
        currentUser = user
    }

    private func showErrorMessage(_ msg: String) {
        errorMessage = msg
        showError = true
    }
}
