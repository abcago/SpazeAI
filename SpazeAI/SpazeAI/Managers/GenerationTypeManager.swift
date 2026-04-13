import Foundation

@MainActor
final class GenerationTypeManager: ObservableObject {
    static let shared = GenerationTypeManager()

    @Published var types: [GenerationType] = []
    @Published var isLoading = false

    private let api = APIService.shared

    private init() {}

    /// Types grouped by category, in display order
    var grouped: [(category: GenerationType.CategoryInfo, types: [GenerationType])] {
        GenerationType.categories.compactMap { cat in
            let matching = types.filter { $0.category == cat.id }
            return matching.isEmpty ? nil : (category: cat, types: matching)
        }
    }

    /// Trending types (first 6 for the stories row)
    var trending: [GenerationType] {
        Array(types.filter { $0.category == "trending" }.prefix(6))
    }

    func loadTypes() async {
        isLoading = true
        do {
            let apiTypes = try await api.getGenerationTypes()
            types = apiTypes.map { GenerationType(from: $0) }
        } catch {
            print("Failed to load generation types: \(error)")
        }
        isLoading = false
    }
}
