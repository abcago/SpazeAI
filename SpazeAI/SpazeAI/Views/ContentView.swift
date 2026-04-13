import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var coinManager = CoinManager.shared
    @StateObject private var galleryManager = GalleryManager.shared
    @State private var selectedTab = 0
    @State private var navigateToShop = false

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(coinManager: coinManager, shopTab: $navigateToShop)
                .tabItem {
                    Label("Create", systemImage: "sparkles")
                }
                .tag(0)

            FeedView()
                .tabItem {
                    Label("Discover", systemImage: "rectangle.stack.person.crop")
                }
                .tag(1)

            GalleryView(galleryManager: galleryManager)
                .tabItem {
                    Label("Gallery", systemImage: "photo.on.rectangle")
                }
                .tag(2)

            ShopView(coinManager: coinManager)
                .tabItem {
                    Label("Shop", systemImage: "cart")
                }
                .tag(3)

            SettingsView(coinManager: coinManager)
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle")
                }
                .tag(4)
        }
        .tint(SpazeTheme.primary400)
        .preferredColorScheme(.dark)
        .onChange(of: navigateToShop) { _, newVal in
            if newVal {
                selectedTab = 3
                navigateToShop = false
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager.shared)
}
