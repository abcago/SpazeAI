import SwiftUI
import AuthenticationServices

struct SettingsView: View {
    @ObservedObject var coinManager: CoinManager
    @EnvironmentObject var authManager: AuthManager
    @State private var showResetAlert = false
    @State private var showSignOutAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                SpazeTheme.gradientNebula.ignoresSafeArea()

                List {
                    // Profile Section
                    Section {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(profileColor.opacity(0.2))
                                    .frame(width: 56, height: 56)
                                Image(systemName: profileIcon)
                                    .font(.title2)
                                    .foregroundStyle(profileColor)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text(profileName)
                                    .font(.headline)
                                    .foregroundStyle(SpazeTheme.neutral50)

                                if let email = authManager.currentUser?.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundStyle(SpazeTheme.neutral400)
                                }

                                HStack(spacing: 4) {
                                    Image(systemName: "circle.fill")
                                        .font(.system(size: 8))
                                        .foregroundStyle(.yellow)
                                    Text("\(coinManager.coins) Coin")
                                        .font(.caption)
                                        .foregroundStyle(SpazeTheme.neutral400)
                                }
                            }

                            Spacer()

                            providerBadge
                        }
                        .listRowBackground(SpazeTheme.nebula.opacity(0.5))
                    }

                    // Account Section — sign in or sign out
                    Section {
                        if authManager.currentUser?.isGuest == true {
                            // Guest user can sign in
                            SignInWithAppleButton(.signIn) { request in
                                request.requestedScopes = [.fullName, .email]
                            } onCompletion: { result in
                                authManager.handleAppleSignIn(result: result)
                            }
                            .signInWithAppleButtonStyle(.white)
                            .frame(height: 44)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .listRowBackground(SpazeTheme.nebula.opacity(0.5))

                            Button {
                                authManager.signInWithGoogle()
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "g.circle.fill")
                                        .font(.title3)
                                    Text("Continue with Google")
                                }
                                .foregroundStyle(SpazeTheme.neutral200)
                            }
                            .listRowBackground(SpazeTheme.nebula.opacity(0.5))
                        } else {
                            // Authenticated user can sign out
                            Button {
                                showSignOutAlert = true
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                    Text("Sign Out")
                                }
                                .foregroundStyle(SpazeTheme.neutral300)
                            }
                            .listRowBackground(SpazeTheme.nebula.opacity(0.5))
                        }
                    } header: {
                        Text(authManager.currentUser?.isGuest == true ? "Save Your Creations" : "Account")
                    } footer: {
                        if authManager.currentUser?.isGuest == true {
                            Text("Sign in to back up your gallery, sync across devices, and never lose your coin balance. You can keep using the app as a guest if you prefer.")
                        }
                    }

                    // Stats
                    Section {
                        HStack {
                            Label("Creations", systemImage: "photo.stack")
                                .foregroundStyle(SpazeTheme.neutral200)
                            Spacer()
                            Text("\(GalleryManager.shared.images.count)")
                                .foregroundStyle(SpazeTheme.neutral500)
                        }
                        .listRowBackground(SpazeTheme.nebula.opacity(0.5))

                        HStack {
                            Label("Coin Balance", systemImage: "circle.fill")
                                .foregroundStyle(SpazeTheme.neutral200)
                            Spacer()
                            Text("\(coinManager.coins)")
                                .foregroundStyle(.yellow)
                        }
                        .listRowBackground(SpazeTheme.nebula.opacity(0.5))
                    } header: {
                        Text("Your Stats")
                    }

                    // Danger zone
                    Section {
                        Button(role: .destructive) {
                            showResetAlert = true
                        } label: {
                            Label("Clear All Creations", systemImage: "trash")
                                .foregroundStyle(SpazeTheme.error)
                        }
                        .listRowBackground(SpazeTheme.nebula.opacity(0.5))
                    } header: {
                        Text("Danger Zone")
                    }

                    // About
                    Section {
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(SpazeTheme.primary500.opacity(0.15))
                                    .frame(width: 56, height: 56)
                                Image(systemName: "sparkles")
                                    .font(.title2)
                                    .foregroundStyle(SpazeTheme.gradientPrimary)
                            }

                            Text("SpazeAI")
                                .font(.headline.bold())
                                .foregroundStyle(SpazeTheme.neutral50)

                            Text("Turn anything into everything.")
                                .font(.caption)
                                .foregroundStyle(SpazeTheme.neutral400)

                            Text("v1.0.0")
                                .font(.caption2)
                                .foregroundStyle(SpazeTheme.neutral600)
                        }
                        .frame(maxWidth: .infinity)
                        .listRowBackground(Color.clear)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Profile")
                        .font(.headline.bold())
                        .foregroundStyle(SpazeTheme.neutral50)
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("Clear All Creations?", isPresented: $showResetAlert) {
                Button("Clear Everything", role: .destructive) {
                    GalleryManager.shared.deleteAll()
                }
                Button("Keep My Stuff", role: .cancel) {}
            } message: {
                Text("This will permanently delete every image in your gallery. There's no undo.")
            }
            .alert("Sign Out?", isPresented: $showSignOutAlert) {
                Button("Sign Out", role: .destructive) {
                    authManager.signOut()
                }
                Button("Stay Signed In", role: .cancel) {}
            } message: {
                Text("You'll switch to a guest account. Your coins and gallery will stay on this device, but won't sync to your account anymore.")
            }
            .alert("Something Went Wrong", isPresented: $authManager.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(authManager.errorMessage ?? "")
            }
        }
    }

    // MARK: - Computed Properties

    private var profileName: String {
        if let name = authManager.currentUser?.displayName, !name.isEmpty {
            return name
        }
        return authManager.currentUser?.isGuest == true ? "Guest" : "SpazeAI Creator"
    }

    private var profileIcon: String {
        switch authManager.currentUser?.provider {
        case .apple: return "applelogo"
        case .google: return "g.circle.fill"
        default: return "person.fill"
        }
    }

    private var profileColor: Color {
        switch authManager.currentUser?.provider {
        case .apple: return .white
        case .google: return SpazeTheme.secondary400
        default: return SpazeTheme.primary400
        }
    }

    @ViewBuilder
    private var providerBadge: some View {
        switch authManager.currentUser?.provider {
        case .apple:
            Text("Apple")
                .font(.caption2.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(.white.opacity(0.15))
                .clipShape(Capsule())
        case .google:
            Text("Google")
                .font(.caption2.bold())
                .foregroundStyle(SpazeTheme.secondary400)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(SpazeTheme.secondary400.opacity(0.15))
                .clipShape(Capsule())
        default:
            Text("Guest")
                .font(.caption2.bold())
                .foregroundStyle(SpazeTheme.neutral400)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(SpazeTheme.neutral600.opacity(0.5))
                .clipShape(Capsule())
        }
    }
}
