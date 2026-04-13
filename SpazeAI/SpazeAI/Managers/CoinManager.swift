import Foundation
import SwiftUI

struct CoinPackage: Identifiable {
    let id: String
    let coins: Int
    let price: String
    let badge: String?
    let gradient: [Color]

    static let packages: [CoinPackage] = [
        CoinPackage(id: "pack_10", coins: 10, price: "₺29.99", badge: nil,
                    gradient: [Color(hex: "#585878"), Color(hex: "#3C3C58")]),
        CoinPackage(id: "pack_30", coins: 30, price: "₺69.99", badge: nil,
                    gradient: [Color(hex: "#7C2FFF"), Color(hex: "#5518B8")]),
        CoinPackage(id: "pack_75", coins: 75, price: "₺129.99", badge: "Most Popular",
                    gradient: [Color(hex: "#FF33AD"), Color(hex: "#7C2FFF")]),
        CoinPackage(id: "pack_150", coins: 150, price: "₺219.99", badge: "Save 20%",
                    gradient: [Color(hex: "#1CCFFF"), Color(hex: "#7C2FFF")]),
        CoinPackage(id: "pack_500", coins: 500, price: "₺549.99", badge: "Best Value",
                    gradient: [Color(hex: "#00E68A"), Color(hex: "#1CCFFF")]),
    ]
}

@MainActor
final class CoinManager: ObservableObject {
    @Published var coins: Int {
        didSet {
            UserDefaults.standard.set(coins, forKey: "spaze_coins")
        }
    }

    static let shared = CoinManager()

    private init() {
        self.coins = UserDefaults.standard.object(forKey: "spaze_coins") as? Int ?? 5 // 5 free coins to start
    }

    func canAfford(_ cost: Int) -> Bool {
        coins >= cost
    }

    func spend(_ cost: Int) -> Bool {
        guard canAfford(cost) else { return false }
        coins -= cost
        return true
    }

    func addCoins(_ amount: Int) {
        coins += amount
    }

    func setCoins(_ amount: Int) {
        coins = amount
    }
}
