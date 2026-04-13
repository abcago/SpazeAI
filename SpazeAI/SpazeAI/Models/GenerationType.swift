import Foundation
import SwiftUI

struct ExampleMedia {
    let before: String
    let after: String
}

struct GenerationType: Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let category: String
    let gradient: [Color]
    let inputMode: InputMode
    let falModel: String
    let coinCost: Int
    let estimatedSeconds: Int
    let previewBeforeUrl: String?
    let previewAfterUrl: String?
    let examples: [ExampleMedia]
    let photo1Label: String
    let photo2Label: String
    let photo1Icon: String
    let photo2Icon: String

    var isVideo: Bool { category == "video" }
    var hasRemotePreview: Bool { previewAfterUrl != nil }

    enum InputMode {
        case singlePhoto
        case twoPhotos
    }

    /// Create from API response
    init(from api: APIGenerationType) {
        self.id = api.id
        self.name = api.name
        self.description = api.description
        self.icon = Self.iconMap[api.id] ?? api.icon
        self.category = api.category ?? "photo"
        self.gradient = Self.gradientMap[api.id] ?? Self.categoryGradient(api.category ?? "photo")
        self.inputMode = api.inputMode == "twoPhotos" ? .twoPhotos : .singlePhoto
        self.falModel = api.falModel
        self.coinCost = api.coinCost
        self.estimatedSeconds = api.estimatedSeconds
        self.previewBeforeUrl = api.previewBeforeUrl
        self.previewAfterUrl = api.previewAfterUrl
        self.examples = [ExampleMedia(before: "example_\(api.id)_before", after: "example_\(api.id)_after")]
        // Photo input labels — defaults preserve the parent_baby flow.
        self.photo1Label = api.metadata?.photo1Label ?? "Anne"
        self.photo2Label = api.metadata?.photo2Label ?? "Baba"
        self.photo1Icon = api.metadata?.photo1Icon ?? "figure.stand.dress"
        self.photo2Icon = api.metadata?.photo2Icon ?? "figure.stand"
    }

    /// Fallback gradient per category
    private static func categoryGradient(_ category: String) -> [Color] {
        switch category {
        case "trending":    return [Color(hex: "#FF33AD"), Color(hex: "#FFB829")]
        case "realistic":   return [Color(hex: "#7C2FFF"), Color(hex: "#1CCFFF")]
        case "artistic":    return [Color(hex: "#FF66C2"), Color(hex: "#FFB829")]
        case "classic_art": return [Color(hex: "#BF0073"), Color(hex: "#5518B8")]
        case "fantasy":     return [Color(hex: "#FF4D6A"), Color(hex: "#7C2FFF")]
        case "car":         return [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")]
        case "you_and_car": return [Color(hex: "#FFB829"), Color(hex: "#FF4D6A")]
        case "you_and_girlfriend": return [Color(hex: "#FF66C2"), Color(hex: "#FF4D6A")]
        case "photoshoot":  return [Color(hex: "#F0E6FF"), Color(hex: "#0A0A0F")]
        case "product_model": return [Color(hex: "#FFB829"), Color(hex: "#7C2FFF")]
        case "wizard":      return [Color(hex: "#FF33AD"), Color(hex: "#1CCFFF")]
        case "video":       return [Color(hex: "#00E68A"), Color(hex: "#1CCFFF")]
        default:            return [Color(hex: "#7C2FFF"), Color(hex: "#5518B8")]
        }
    }

    // MARK: - Category display info

    struct CategoryInfo {
        let id: String
        let title: String
        let icon: String
    }

    static let categories: [CategoryInfo] = [
        CategoryInfo(id: "wizard", title: "Product Wizard", icon: "wand.and.stars"),
        CategoryInfo(id: "trending", title: "Trending", icon: "flame.fill"),
        CategoryInfo(id: "realistic", title: "Realistic", icon: "person.fill"),
        CategoryInfo(id: "artistic", title: "Artistic", icon: "paintbrush.fill"),
        CategoryInfo(id: "classic_art", title: "Classic Art", icon: "paintpalette.fill"),
        CategoryInfo(id: "fantasy", title: "Fantasy", icon: "sparkles"),
        CategoryInfo(id: "car", title: "Car Photography", icon: "car.fill"),
        CategoryInfo(id: "you_and_car", title: "You & Your Car", icon: "person.crop.circle.badge.plus"),
        CategoryInfo(id: "you_and_girlfriend", title: "You & Your Girlfriend", icon: "heart.fill"),
        CategoryInfo(id: "photoshoot", title: "Model Photoshoot", icon: "camera.aperture"),
        CategoryInfo(id: "product_model", title: "Product × Model", icon: "shippingbox.fill"),
    ]

    // MARK: - Icon mapping (SF Symbols per type ID)
    private static let iconMap: [String: String] = [
        "product_wizard": "wand.and.stars",
        "parent_baby": "figure.2.and.child.holdinghands",
        "baby_version": "face.smiling",
        "old_age": "figure.walk.motion",
        "young_version": "sparkles",
        "gender_swap": "arrow.left.arrow.right",
        "glamour": "camera.aperture",
        "linkedin_corporate": "briefcase.fill",
        "passport_photo": "person.text.rectangle.fill",
        "fitness_model": "figure.strengthtraining.traditional",
        "cartoon": "theatermask.and.paintbrush",
        "anime": "star.circle",
        "3d_character": "cube",
        "pixel_art": "square.grid.3x3.fill",
        "pop_art": "paintpalette",
        "ghibli": "leaf.circle.fill",
        "comic_book": "bolt.fill",
        "graffiti": "scribble.variable",
        "vaporwave": "waveform.path.ecg",
        "low_poly": "diamond.fill",
        "vector_art": "compass.drawing",
        "manga_bw": "book.closed.fill",
        "chibi": "heart.circle.fill",
        "caricature": "face.smiling.inverse",
        "stained_glass": "square.grid.2x2.fill",
        "mosaic": "rectangle.grid.3x2.fill",
        "tattoo_design": "drop.triangle.fill",
        "oil_painting": "paintbrush.pointed",
        "watercolor": "drop.fill",
        "pencil_sketch": "pencil.and.outline",
        "renaissance": "crown",
        "impressionist": "camera.macro",
        "cubist": "triangle.fill",
        "art_nouveau": "leaf.fill",
        "ukiyo_e": "mountain.2.fill",
        "charcoal": "scribble",
        "surrealist": "eye.trianglebadge.exclamationmark.fill",
        "baroque": "flame.fill",
        "superhero": "bolt.shield",
        "fantasy_elf": "leaf",
        "cyberpunk": "cpu",
        "zombie": "allergens",
        "viking": "shield.lefthalf.filled",
        "astronaut": "moon.stars",
        "steampunk": "gearshape.2.fill",
        "wizard": "wand.and.stars",
        "samurai": "katana",
        "pirate": "flag.fill",
        "mermaid": "fish.fill",
        "vampire": "drop.fill",
        "car_showroom": "sparkles.square.filled.on.square",
        "car_mountain_sunset": "mountain.2.fill",
        "car_racetrack": "flag.checkered",
        "car_beach_sunset": "beach.umbrella.fill",
        "car_neon_night": "lightbulb.fill",
        "car_rainy_night": "cloud.rain.fill",
        "car_desert_dunes": "sun.max.fill",
        "car_winter_alpine": "snowflake",
        "car_forest_autumn": "leaf.fill",
        "car_tokyo_neon": "building.2.fill",
        "car_garage_workshop": "wrench.and.screwdriver.fill",
        "car_studio_black": "camera.fill",
        "car_drift_smoke": "wind",
        "car_vintage_70s": "camera.metering.center.weighted",
        "car_movie_poster": "film.fill",
        "car_offroad_jungle": "tree.fill",
        "car_salt_flats": "speedometer",
        "car_volcanic": "flame.fill",
        "car_auto_show": "star.fill",
        "car_supercar_canyon": "road.lanes",
        "person_car_magazine_cover": "newspaper.fill",
        "person_car_hero_sunset": "person.fill.viewfinder",
        "person_car_garage_owner": "key.fill",
        "person_car_track_day": "flag.checkered.2.crossed",
        "person_car_neon_night": "moon.stars.fill",
        "person_car_road_trip": "map.fill",
        "person_car_driver_seat": "steeringwheel",
        "person_car_wheel_pov": "scope",
        "person_car_sunset_drive": "sun.haze.fill",
        "person_car_night_drive": "moon.haze.fill",
        "person_car_step_out": "door.left.hand.open",
        "couple_romantic_dinner": "fork.knife",
        "couple_beach_sunset": "sun.horizon.fill",
        "couple_paris": "building.columns.fill",
        "couple_cafe": "cup.and.saucer.fill",
        "couple_wedding": "heart.circle.fill",
        "shoot_vogue_cover": "newspaper.fill",
        "shoot_editorial_studio": "camera.fill",
        "shoot_bw_classic": "circle.lefthalf.filled",
        "shoot_couture_runway": "figure.walk",
        "shoot_streetwear": "tshirt.fill",
        "shoot_beach_editorial": "sun.max.fill",
        "shoot_vintage_70s": "record.circle.fill",
        "shoot_beauty_closeup": "face.smiling.inverse",
        "shoot_activewear": "figure.run",
        "shoot_avant_garde": "paintpalette.fill",
        "product_perfume": "drop.degreesign",
        "product_skincare": "leaf.fill",
        "product_lipstick": "mouth.fill",
        "product_watch": "applewatch",
        "product_handbag": "handbag.fill",
        "product_sunglasses": "eyeglasses",
        "product_coffee": "cup.and.saucer.fill",
        "product_wine": "wineglass.fill",
        "product_jewelry": "diamond.fill",
        "product_tech": "iphone",
        "video_talking": "mouth.fill",
        "video_dance": "figure.dance",
        "video_sing": "music.mic",
        "video_aging": "hourglass",
        "video_wink": "eye",
    ]

    // MARK: - Gradient mapping per type ID
    private static let gradientMap: [String: [Color]] = [
        "parent_baby": [Color(hex: "#FFB829"), Color(hex: "#FF33AD")],
        "baby_version": [Color(hex: "#FF33AD"), Color(hex: "#7C2FFF")],
        "old_age": [Color(hex: "#FFB829"), Color(hex: "#FF4D6A")],
        "young_version": [Color(hex: "#00E68A"), Color(hex: "#1CCFFF")],
        "gender_swap": [Color(hex: "#7C2FFF"), Color(hex: "#1CCFFF")],
        "glamour": [Color(hex: "#F0E6FF"), Color(hex: "#FF33AD")],
        "linkedin_corporate": [Color(hex: "#0077B5"), Color(hex: "#1CCFFF")],
        "passport_photo": [Color(hex: "#585878"), Color(hex: "#A0A0B8")],
        "fitness_model": [Color(hex: "#FF4D6A"), Color(hex: "#FFB829")],
        "cartoon": [Color(hex: "#FF66C2"), Color(hex: "#FFB829")],
        "anime": [Color(hex: "#5CE1FF"), Color(hex: "#B07AFF")],
        "3d_character": [Color(hex: "#00B8E6"), Color(hex: "#7C2FFF")],
        "pixel_art": [Color(hex: "#00E68A"), Color(hex: "#FFB829")],
        "pop_art": [Color(hex: "#FF4D6A"), Color(hex: "#FFB829")],
        "ghibli": [Color(hex: "#5CE1FF"), Color(hex: "#FFB829")],
        "comic_book": [Color(hex: "#FF4D6A"), Color(hex: "#1CCFFF")],
        "graffiti": [Color(hex: "#FF33AD"), Color(hex: "#00E68A")],
        "vaporwave": [Color(hex: "#FF66C2"), Color(hex: "#5CE1FF")],
        "low_poly": [Color(hex: "#7C2FFF"), Color(hex: "#00E68A")],
        "vector_art": [Color(hex: "#1CCFFF"), Color(hex: "#7C2FFF")],
        "manga_bw": [Color(hex: "#A0A0B8"), Color(hex: "#282840")],
        "chibi": [Color(hex: "#FF66C2"), Color(hex: "#F0E6FF")],
        "caricature": [Color(hex: "#FFB829"), Color(hex: "#FF33AD")],
        "stained_glass": [Color(hex: "#7C2FFF"), Color(hex: "#FF4D6A")],
        "mosaic": [Color(hex: "#BF0073"), Color(hex: "#FFB829")],
        "tattoo_design": [Color(hex: "#282840"), Color(hex: "#FF4D6A")],
        "oil_painting": [Color(hex: "#BF0073"), Color(hex: "#5518B8")],
        "watercolor": [Color(hex: "#1CCFFF"), Color(hex: "#00E68A")],
        "pencil_sketch": [Color(hex: "#A0A0B8"), Color(hex: "#585878")],
        "renaissance": [Color(hex: "#FFB829"), Color(hex: "#99005C")],
        "impressionist": [Color(hex: "#5CE1FF"), Color(hex: "#FFB829")],
        "cubist": [Color(hex: "#BF0073"), Color(hex: "#1CCFFF")],
        "art_nouveau": [Color(hex: "#00E68A"), Color(hex: "#FFB829")],
        "ukiyo_e": [Color(hex: "#FF33AD"), Color(hex: "#1CCFFF")],
        "charcoal": [Color(hex: "#3C3C58"), Color(hex: "#A0A0B8")],
        "surrealist": [Color(hex: "#7C2FFF"), Color(hex: "#FFB829")],
        "baroque": [Color(hex: "#FFB829"), Color(hex: "#282840")],
        "superhero": [Color(hex: "#FF4D6A"), Color(hex: "#7C2FFF")],
        "fantasy_elf": [Color(hex: "#00E68A"), Color(hex: "#007A99")],
        "cyberpunk": [Color(hex: "#1CCFFF"), Color(hex: "#E6008A")],
        "zombie": [Color(hex: "#00E68A"), Color(hex: "#282840")],
        "viking": [Color(hex: "#585878"), Color(hex: "#FFB829")],
        "astronaut": [Color(hex: "#0A0A0F"), Color(hex: "#1CCFFF")],
        "steampunk": [Color(hex: "#BF0073"), Color(hex: "#FFB829")],
        "wizard": [Color(hex: "#7C2FFF"), Color(hex: "#5CE1FF")],
        "samurai": [Color(hex: "#FF4D6A"), Color(hex: "#282840")],
        "pirate": [Color(hex: "#3C3C58"), Color(hex: "#FFB829")],
        "mermaid": [Color(hex: "#1CCFFF"), Color(hex: "#7C2FFF")],
        "vampire": [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")],
        "car_showroom": [Color(hex: "#F0E6FF"), Color(hex: "#A0A0B8")],
        "car_mountain_sunset": [Color(hex: "#FF4D6A"), Color(hex: "#FFB829")],
        "car_racetrack": [Color(hex: "#FF4D6A"), Color(hex: "#282840")],
        "car_beach_sunset": [Color(hex: "#FFB829"), Color(hex: "#FF66C2")],
        "car_neon_night": [Color(hex: "#E6008A"), Color(hex: "#1CCFFF")],
        "car_rainy_night": [Color(hex: "#1CCFFF"), Color(hex: "#282840")],
        "car_desert_dunes": [Color(hex: "#FFB829"), Color(hex: "#BF0073")],
        "car_winter_alpine": [Color(hex: "#5CE1FF"), Color(hex: "#F0E6FF")],
        "car_forest_autumn": [Color(hex: "#FFB829"), Color(hex: "#99005C")],
        "car_tokyo_neon": [Color(hex: "#FF33AD"), Color(hex: "#7C2FFF")],
        "car_garage_workshop": [Color(hex: "#FFB829"), Color(hex: "#3C3C58")],
        "car_studio_black": [Color(hex: "#A0A0B8"), Color(hex: "#0A0A0F")],
        "car_drift_smoke": [Color(hex: "#FF4D6A"), Color(hex: "#A0A0B8")],
        "car_vintage_70s": [Color(hex: "#FFB829"), Color(hex: "#BF0073")],
        "car_movie_poster": [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")],
        "car_offroad_jungle": [Color(hex: "#00E68A"), Color(hex: "#3C3C58")],
        "car_salt_flats": [Color(hex: "#F0E6FF"), Color(hex: "#1CCFFF")],
        "car_volcanic": [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")],
        "car_auto_show": [Color(hex: "#7C2FFF"), Color(hex: "#FFB829")],
        "car_supercar_canyon": [Color(hex: "#1CCFFF"), Color(hex: "#FFB829")],
        "person_car_magazine_cover": [Color(hex: "#FFB829"), Color(hex: "#0A0A0F")],
        "person_car_hero_sunset": [Color(hex: "#FF4D6A"), Color(hex: "#FFB829")],
        "person_car_garage_owner": [Color(hex: "#FFB829"), Color(hex: "#3C3C58")],
        "person_car_track_day": [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")],
        "person_car_neon_night": [Color(hex: "#FF33AD"), Color(hex: "#1CCFFF")],
        "person_car_road_trip": [Color(hex: "#00E68A"), Color(hex: "#FFB829")],
        "person_car_driver_seat": [Color(hex: "#7C2FFF"), Color(hex: "#0A0A0F")],
        "person_car_wheel_pov": [Color(hex: "#FF4D6A"), Color(hex: "#3C3C58")],
        "person_car_sunset_drive": [Color(hex: "#FFB829"), Color(hex: "#FF66C2")],
        "person_car_night_drive": [Color(hex: "#FF33AD"), Color(hex: "#1CCFFF")],
        "person_car_step_out": [Color(hex: "#F0E6FF"), Color(hex: "#7C2FFF")],
        "couple_romantic_dinner": [Color(hex: "#FFB829"), Color(hex: "#BF0073")],
        "couple_beach_sunset": [Color(hex: "#FFB829"), Color(hex: "#FF66C2")],
        "couple_paris": [Color(hex: "#F0E6FF"), Color(hex: "#FF4D6A")],
        "couple_cafe": [Color(hex: "#FFB829"), Color(hex: "#A0A0B8")],
        "couple_wedding": [Color(hex: "#F0E6FF"), Color(hex: "#FF66C2")],
        "shoot_vogue_cover": [Color(hex: "#FFB829"), Color(hex: "#0A0A0F")],
        "shoot_editorial_studio": [Color(hex: "#3C3C58"), Color(hex: "#0A0A0F")],
        "shoot_bw_classic": [Color(hex: "#A0A0B8"), Color(hex: "#0A0A0F")],
        "shoot_couture_runway": [Color(hex: "#BF0073"), Color(hex: "#0A0A0F")],
        "shoot_streetwear": [Color(hex: "#FFB829"), Color(hex: "#FF4D6A")],
        "shoot_beach_editorial": [Color(hex: "#FFB829"), Color(hex: "#1CCFFF")],
        "shoot_vintage_70s": [Color(hex: "#FFB829"), Color(hex: "#BF0073")],
        "shoot_beauty_closeup": [Color(hex: "#F0E6FF"), Color(hex: "#FF66C2")],
        "shoot_activewear": [Color(hex: "#FF4D6A"), Color(hex: "#1CCFFF")],
        "shoot_avant_garde": [Color(hex: "#FF33AD"), Color(hex: "#7C2FFF")],
        "product_perfume": [Color(hex: "#FFB829"), Color(hex: "#FF66C2")],
        "product_skincare": [Color(hex: "#00E68A"), Color(hex: "#F0E6FF")],
        "product_lipstick": [Color(hex: "#FF4D6A"), Color(hex: "#0A0A0F")],
        "product_watch": [Color(hex: "#FFB829"), Color(hex: "#3C3C58")],
        "product_handbag": [Color(hex: "#BF0073"), Color(hex: "#0A0A0F")],
        "product_sunglasses": [Color(hex: "#1CCFFF"), Color(hex: "#FFB829")],
        "product_coffee": [Color(hex: "#FFB829"), Color(hex: "#3C3C58")],
        "product_wine": [Color(hex: "#BF0073"), Color(hex: "#0A0A0F")],
        "product_jewelry": [Color(hex: "#F0E6FF"), Color(hex: "#FF66C2")],
        "product_tech": [Color(hex: "#1CCFFF"), Color(hex: "#7C2FFF")],
        "video_talking": [Color(hex: "#00E68A"), Color(hex: "#007A99")],
        "video_dance": [Color(hex: "#FF33AD"), Color(hex: "#FFB829")],
        "video_sing": [Color(hex: "#7C2FFF"), Color(hex: "#FF33AD")],
        "video_aging": [Color(hex: "#FFB829"), Color(hex: "#FF4D6A")],
        "video_wink": [Color(hex: "#1CCFFF"), Color(hex: "#7C2FFF")],
    ]
}

// MARK: - Equatable & Hashable

extension GenerationType: Equatable {
    static func == (lhs: GenerationType, rhs: GenerationType) -> Bool {
        lhs.id == rhs.id
    }
}

extension GenerationType: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
