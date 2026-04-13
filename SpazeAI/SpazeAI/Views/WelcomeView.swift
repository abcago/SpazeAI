import SwiftUI
import AuthenticationServices

struct WelcomeView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            SpazeTheme.gradientNebula.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo & title
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(SpazeTheme.primary500.opacity(0.15))
                            .frame(width: 100, height: 100)
                        Circle()
                            .fill(SpazeTheme.primary500.opacity(0.08))
                            .frame(width: 140, height: 140)
                        Image(systemName: "sparkles")
                            .font(.system(size: 40))
                            .foregroundStyle(SpazeTheme.gradientPrimary)
                    }

                    Text("SpazeAI")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(SpazeTheme.neutral50)

                    Text("Turn anything into everything.")
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(SpazeTheme.neutral300)

                    Text("Sign in to back up your gallery and sync across devices.")
                        .font(.subheadline)
                        .foregroundStyle(SpazeTheme.neutral500)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 30)
                        .padding(.top, 4)
                }

                Spacer()

                // Login buttons
                VStack(spacing: 12) {
                    // Apple Sign In
                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.fullName, .email]
                    } onCompletion: { result in
                        authManager.handleAppleSignIn(result: result)
                        dismiss()
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    // Google Sign In
                    Button {
                        authManager.signInWithGoogle()
                    } label: {
                        HStack(spacing: 10) {
                            GoogleLogo()
                                .frame(width: 18, height: 18)
                            Text("Continue with Google")
                                .font(.system(size: 17, weight: .medium))
                        }
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    Button {
                        dismiss()
                    } label: {
                        Text("Continue as Guest")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(SpazeTheme.neutral400)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .alert("Something Went Wrong", isPresented: $authManager.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(authManager.errorMessage ?? "")
        }
    }
}

// MARK: - Google Logo (SVG-like path)

private struct GoogleLogo: View {
    var body: some View {
        Canvas { context, size in
            let scale = min(size.width, size.height) / 24

            // Blue
            var blue = Path()
            blue.move(to: CGPoint(x: 23.49 * scale, y: 12.27 * scale))
            blue.addLine(to: CGPoint(x: 23.49 * scale, y: 11.48 * scale))
            blue.addLine(to: CGPoint(x: 12.24 * scale, y: 11.48 * scale))
            blue.addLine(to: CGPoint(x: 12.24 * scale, y: 14.48 * scale))
            blue.addLine(to: CGPoint(x: 18.68 * scale, y: 14.48 * scale))
            blue.addCurve(to: CGPoint(x: 12.24 * scale, y: 19.8 * scale),
                          control1: CGPoint(x: 18.2 * scale, y: 17.2 * scale),
                          control2: CGPoint(x: 15.4 * scale, y: 19.8 * scale))
            blue.addCurve(to: CGPoint(x: 4.44 * scale, y: 12 * scale),
                          control1: CGPoint(x: 7.93 * scale, y: 19.8 * scale),
                          control2: CGPoint(x: 4.44 * scale, y: 16.3 * scale))
            blue.addCurve(to: CGPoint(x: 12.24 * scale, y: 4.2 * scale),
                          control1: CGPoint(x: 4.44 * scale, y: 7.7 * scale),
                          control2: CGPoint(x: 7.93 * scale, y: 4.2 * scale))
            blue.addCurve(to: CGPoint(x: 17.28 * scale, y: 6.19 * scale),
                          control1: CGPoint(x: 14.23 * scale, y: 4.2 * scale),
                          control2: CGPoint(x: 16.02 * scale, y: 4.94 * scale))
            blue.addLine(to: CGPoint(x: 19.36 * scale, y: 4.11 * scale))
            blue.addCurve(to: CGPoint(x: 12.24 * scale, y: 1.2 * scale),
                          control1: CGPoint(x: 17.58 * scale, y: 2.44 * scale),
                          control2: CGPoint(x: 15.07 * scale, y: 1.2 * scale))
            blue.addCurve(to: CGPoint(x: 1.44 * scale, y: 12 * scale),
                          control1: CGPoint(x: 6.28 * scale, y: 1.2 * scale),
                          control2: CGPoint(x: 1.44 * scale, y: 6.04 * scale))
            blue.addCurve(to: CGPoint(x: 12.24 * scale, y: 22.8 * scale),
                          control1: CGPoint(x: 1.44 * scale, y: 17.96 * scale),
                          control2: CGPoint(x: 6.28 * scale, y: 22.8 * scale))
            blue.addCurve(to: CGPoint(x: 23.49 * scale, y: 12.27 * scale),
                          control1: CGPoint(x: 18.48 * scale, y: 22.8 * scale),
                          control2: CGPoint(x: 23.49 * scale, y: 18.3 * scale))
            blue.closeSubpath()
            context.fill(blue, with: .color(Color(hex: "#4285F4")))
        }
    }
}
